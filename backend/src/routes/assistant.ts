import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import {
  CorridorExit,
  describeFeedAge,
  findExit,
  getCorridorStatus,
} from '../services/corridor';

/**
 * SmartFlow NLEX assistant.
 *
 * The model never answers traffic questions from its own knowledge - it has
 * none about NLEX. It is given tools that read our live corridor feed, and the
 * system prompt forbids guessing. That is deliberate: people make driving
 * decisions on these answers, so an invented "the road is clear" is worse than
 * admitting the data is unavailable.
 *
 * The API key lives here on the server and never reaches the mobile app, where
 * it could be extracted from the JS bundle and used to run up charges.
 */

const router: Router = Router();

const QWEN_API_KEY = process.env.QWEN_API_KEY ?? '';
const QWEN_BASE_URL =
  process.env.QWEN_BASE_URL ?? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const QWEN_MODEL = process.env.QWEN_MODEL ?? 'qwen3.8-flash';

/**
 * Zero Data Retention.
 *
 * Only meaningful on OpenRouter: with it set, OpenRouter routes the request
 * ONLY to endpoints that carry a zero-retention policy, and refuses rather
 * than silently falling back to one that logs. That turns "the provider says
 * it does not keep prompts" from something you take on trust into something
 * enforced at the routing layer.
 *
 * Sent only when enabled - a provider that does not understand the field
 * could reject the whole request.
 */
const LLM_ZDR = (process.env.LLM_ZDR ?? '').trim().toLowerCase() === 'true';

/** OpenRouter asks callers to identify themselves; harmless elsewhere. */
const isOpenRouter = QWEN_BASE_URL.includes('openrouter.ai');

export const isAssistantConfigured = QWEN_API_KEY.length > 0;

/** Built lazily so an unconfigured server still starts and reports why. */
let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (client === null) {
    client = new OpenAI({
      apiKey: QWEN_API_KEY,
      baseURL: QWEN_BASE_URL,
      defaultHeaders: isOpenRouter
        ? {
            'HTTP-Referer': 'https://github.com/SmartFlow-Nlex/Mobile-Application',
            'X-Title': 'SmartFlow NLEX Assistant',
          }
        : undefined,
    });
  }
  return client;
}

const SYSTEM_PROMPT_BASE = `You are the SmartFlow NLEX assistant. You help commuters and drivers on the NLEX expressway in the Philippines.

STRICT RULES:
1. You ONLY answer questions about the NLEX corridor - traffic conditions, exits, travel times, incidents and route choices along NLEX. For anything else, politely say it is outside what you can help with and offer an NLEX-related suggestion instead.
2. NEVER state or guess a traffic condition without calling a tool first. You have no knowledge of current NLEX conditions.
2b. NEVER say a place is not an NLEX exit based on your own knowledge. The authoritative list is given below - check it. If a name is on that list, call get_corridor_status for it. Only if it is genuinely absent from that list may you say you do not recognise it.
3. If a tool reports data is unavailable, say so plainly. Do not substitute a guess.
4. Users often write in Taglish (mixed Tagalog and English). Reply in whichever language they used.
5. Be brief - most users are about to drive. Two or three sentences is usually right.
6. Answer ONLY what was asked. Do not volunteer conditions at other exits unless the user asked about them.
7. Write plain text only. No markdown - no **bold**, no *italics*, no # headings. The app shows your reply in a chat bubble that renders none of it, so the symbols appear literally.

CHOOSING A TOOL:
- The user named a place (Bocaue, Balintawak, Marilao...) -> get_corridor_status for THAT exit. One call.
- The user asked about NLEX generally, with no place named -> get_corridor_overview.
- Never use get_corridor_overview to answer a question about one specific exit.

GEOGRAPHY: northbound runs from Balintawak (KM 0, Metro Manila) towards Sta. Ines (KM 86, near Clark). Southbound is the reverse. "Papuntang Manila" or "going to Manila" means SOUTHBOUND. "Papuntang Clark/Pampanga" means NORTHBOUND.`;

/**
 * The exit list goes into the prompt itself, not just into a tool.
 *
 * Asked about Dau, the model replied that Dau is not an NLEX exit - it is, at
 * KM 71 - because it answered from its own knowledge rather than calling a
 * tool. Whether a place exists on this road is something it should never have
 * to guess at, so it is stated up front. Conditions still come only from
 * tools; this is the roster, not the traffic.
 *
 * Built per request from the live feed rather than written into the source, so
 * an exit added upstream appears here without a code change.
 */
function buildSystemPrompt(exitNames: string[]): string {
  if (exitNames.length === 0) {
    return SYSTEM_PROMPT_BASE;
  }
  return `${SYSTEM_PROMPT_BASE}

THE COMPLETE LIST OF NLEX EXITS (authoritative - nothing else is an NLEX exit, and everything here IS one):
${exitNames.join(', ')}`;
}

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_corridor_status',
      description:
        'Live traffic status at ONE named NLEX exit in one direction. Use this whenever the user mentions a specific place, e.g. "Is Bocaue jammed?". Preferred over get_corridor_overview for any question about a named exit.',
      parameters: {
        type: 'object',
        properties: {
          exit_name: {
            type: 'string',
            description: 'Exit name, e.g. "Bocaue Barrier", "Balintawak", "Marilao".',
          },
          direction: {
            type: 'string',
            enum: ['northbound', 'southbound'],
            description: 'northbound = towards Clark, southbound = towards Manila.',
          },
        },
        required: ['exit_name', 'direction'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_corridor_overview',
      description:
        'Corridor-wide summary. Use ONLY when the user asks about NLEX as a whole and names no specific exit, e.g. "How is NLEX right now?". Do NOT use this to answer about a single named exit.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_exits',
      description:
        'All NLEX exits in order with their KM markers. Use to check a name or answer questions about which exits exist.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

/** Everything the model is allowed to learn about the road, in one place. */
async function runTool(name: string, rawArgs: string): Promise<unknown> {
  const corridor = await getCorridorStatus();
  if (!corridor.available) {
    return { error: corridor.reason };
  }
  const { exits, counts, feed } = corridor.data;

  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(rawArgs) as Record<string, unknown>;
  } catch {
    return { error: 'Could not read the tool arguments.' };
  }

  if (name === 'list_exits') {
    return {
      exits: exits.map((exit) => ({ name: exit.display_name, km: exit.km })),
    };
  }

  if (name === 'get_corridor_overview') {
    const worst = exits
      .flatMap((exit: CorridorExit) =>
        (['NB', 'SB'] as const)
          .filter((key) => exit.directions[key].status === 'congested')
          .map((key) => ({
            exit: exit.display_name,
            direction: key === 'NB' ? 'northbound' : 'southbound',
            speedKmh: exit.directions[key].speedKmh,
          })),
      )
      .slice(0, 6);

    return {
      feed: describeFeedAge(feed),
      stale: feed.stale,
      counts,
      congested_spots: worst,
    };
  }

  if (name === 'get_corridor_status') {
    const exitName = typeof args.exit_name === 'string' ? args.exit_name : '';
    const direction = args.direction === 'northbound' ? 'NB' : 'SB';
    const exit = findExit(exits, exitName);

    if (exit === null) {
      return {
        error: `No NLEX exit matches "${exitName}".`,
        valid_exits: exits.map((item) => item.display_name),
      };
    }

    const status = exit.directions[direction];
    return {
      exit: exit.display_name,
      km: exit.km,
      direction: direction === 'NB' ? 'northbound' : 'southbound',
      status: status.status,
      speed_kmh: status.speedKmh,
      jam_count: status.jamCount,
      has_ramp: status.hasRamp,
      feed: describeFeedAge(feed),
      stale: feed.stale,
    };
  }

  return { error: `Unknown tool "${name}".` };
}

/**
 * Strip markdown the chat bubble cannot render.
 *
 * The system prompt asks for plain text, but that is a request rather than a
 * guarantee - Qwen3 14B reaches for **bold** when listing congested exits. The
 * bubble is a plain Text node, so the asterisks would show up literally.
 *
 * Deliberately narrow: emphasis markers and list bullets only. It does not try
 * to be a general markdown parser, because mangling a reply is worse than
 * leaving an odd character in it.
 */
export function toPlainText(reply: string): string {
  return reply
    // **bold** and __bold__
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // *italic* - single markers, not spanning lines
    .replace(/\*([^*\n]+)\*/g, '$1')
    // "- item" / "* item" at the start of a line becomes a real bullet
    .replace(/^[ \t]*[-*][ \t]+/gm, '\u2022 ')
    // "# Heading"
    .replace(/^#{1,6}[ \t]+/gm, '')
    // Collapse the blank-line gaps markdown leaves behind
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface ChatRequestBody {
  message?: unknown;
  history?: unknown;
}

/** Caps the tool loop so a confused model cannot spin forever on our bill. */
const MAX_TOOL_ROUNDS = 4;

router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  if (!isAssistantConfigured) {
    res.status(503).json({
      success: false,
      error: 'Assistant not configured',
      message: 'Set QWEN_API_KEY in backend/.env and restart the server.',
    });
    return;
  }

  const body = req.body as ChatRequestBody;
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (message.length === 0) {
    res.status(400).json({ success: false, error: 'A message is required.' });
    return;
  }

  // Prior turns let the model resolve "what about southbound?" against the
  // exit the user named a message ago.
  const history: ChatCompletionMessageParam[] = Array.isArray(body.history)
    ? (body.history as ChatCompletionMessageParam[]).slice(-10)
    : [];

  // Reads the cached corridor feed (30s TTL), so this costs nothing per turn.
  // If the feed is down the prompt falls back to its static form and the tools
  // report the outage - the assistant still refuses to invent conditions.
  const corridor = await getCorridorStatus();
  const exitNames = corridor.available
    ? corridor.data.exits.map((exit) => exit.display_name)
    : [];

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt(exitNames) },
    ...history,
    { role: 'user', content: message },
  ];

  try {
    const toolsUsed: string[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const params: ChatCompletionCreateParamsNonStreaming = {
        model: QWEN_MODEL,
        messages,
        tools,
        tool_choice: 'auto',
        // Picking the right tool should not vary between identical questions.
        temperature: 0.2,
        // Replies are two or three sentences; this is already generous. Without
        // it the model's full 131k output ceiling is assumed, and OpenRouter
        // rejects the request up front unless the account can afford that worst
        // case - a 402 even though the real answer is ~80 tokens. It also caps
        // what a runaway response can cost.
        max_tokens: 800,
      };

      /*
       * `provider` and `reasoning` are OpenRouter extensions rather than part
       * of the OpenAI schema, so they are attached by cast.
       *
       * reasoning.enabled=false matters: Qwen3 is a hybrid thinking model, and
       * its internal reasoning is spent from the SAME budget as max_tokens. A
       * long think leaves nothing for the visible answer, so `content` comes
       * back empty and the user sees a blank bubble. We have no use for the
       * reasoning either - tool choice is already pinned by explicit rules in
       * the prompt - so it is pure cost and latency.
       *
       * `provider` is sent only when ZDR is on, since a provider that does not
       * know the field could reject the whole request.
       */
      const extras: Record<string, unknown> = { reasoning: { enabled: false } };
      if (LLM_ZDR) {
        extras.provider = { zdr: true };
      }

      const completion = await getClient().chat.completions.create({
        ...params,
        ...extras,
      } as ChatCompletionCreateParamsNonStreaming);

      const choice = completion.choices[0]?.message;
      if (choice === undefined) {
        throw new Error('The model returned no message.');
      }

      const calls = choice.tool_calls ?? [];
      if (calls.length === 0) {
        const reply = toPlainText(choice.content ?? '');

        /*
         * An empty reply renders as a blank chat bubble, which reads as a
         * broken app rather than a failure. It happens when the model spends
         * its whole budget before writing anything - finish_reason 'length'.
         * Say something useful instead, and log why so it is diagnosable
         * without reproducing it against a paid API.
         */
        if (reply.length === 0) {
          const why = completion.choices[0]?.finish_reason ?? 'unknown';
          console.error(`[assistant] empty reply from ${completion.model} (finish_reason: ${why})`);
          // Reported as a failure rather than answered with words of our own.
          // Every chat bubble in the app is the model speaking; when it says
          // nothing, the app must show an error, not something we wrote.
          res.status(502).json({
            success: false,
            error: 'Empty reply',
            message: 'The assistant did not return an answer. Please try again.',
          });
          return;
        }

        console.log(
          `[assistant] answered using [${toolsUsed.join(', ') || 'no tools'}] via ${completion.model}`,
        );
        res.json({
          success: true,
          data: { reply, toolsUsed, model: completion.model },
        });
        return;
      }

      messages.push(choice);

      for (const call of calls) {
        if (call.type !== 'function') {
          continue;
        }
        toolsUsed.push(call.function.name);
        const result = await runTool(call.function.name, call.function.arguments);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Ran out of rounds while still asking for tools, so the model never
    // produced an answer. Surfaced as a failure for the same reason as above:
    // we do not put words in the assistant's mouth.
    console.error(`[assistant] tool loop hit ${MAX_TOOL_ROUNDS} rounds without an answer`);
    res.status(502).json({
      success: false,
      error: 'No answer',
      message: 'The assistant could not work that out. Please try rephrasing.',
    });
  } catch (caught) {
    const detail = caught instanceof Error ? caught.message : 'Unknown error';
    console.error('[assistant]', detail);
    res.status(502).json({
      success: false,
      error: 'Assistant unavailable',
      message: 'Could not reach the assistant service. Please try again.',
    });
  }
});

export default router;
