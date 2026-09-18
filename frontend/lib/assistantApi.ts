import type { AssistantToolName } from '@smartflow/shared';
import { ASSISTANT_TIMEOUT_MS, BACKEND_API_BASE_URL } from '../config/api';

/**
 * Talks to SmartFlow's own backend, never to the model provider directly.
 *
 * The LLM API key stays on the server. Anything bundled into this app can be
 * extracted from the JS bundle, and a leaked key is someone else spending our
 * quota - so the app only ever sees our own endpoint.
 */

const CHAT_PATH = '/api/assistant/chat';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  at: number;
  /**
   * Data tools the model consulted for this reply, on assistant messages.
   * Only ever set locally - `toWireHistory` strips it, so it never goes back
   * to the server as part of the conversation.
   */
  toolsUsed?: string[];
}

/**
 * Tool name -> what to tell the user it looked at.
 *
 * The backend already returned `toolsUsed` and the field was documented as
 * being "so the UI can show it was grounded", but nothing rendered it. An
 * answer about a road is worth more when you can see it checked the road.
 *
 * Keyed by `AssistantToolName` rather than `string`, so adding a tool on the
 * server without a label here fails the build instead of printing the raw
 * function name into the transcript.
 */
const labels: Record<AssistantToolName, string> = {
  // Reads ONE named exit in one direction - not the whole corridor, which is
  // what the old "Live corridor feed" label claimed.
  get_corridor_status: 'Live exit reading',
  get_corridor_overview: 'Live corridor snapshot',
  list_exits: 'Exit directory',
};

/**
 * What to show on the provenance chip for a tool the server reported.
 *
 * Falls back to the de-underscored name because `toolsUsed` arrives as plain
 * strings off the wire: a server running ahead of the app can still name a
 * tool this build has never heard of, and a rough label beats an empty chip.
 */
export function toolLabel(tool: string): string {
  return labels[tool as AssistantToolName] ?? tool.replace(/_/g, ' ');
}

export interface AssistantReply {
  reply: string;
  /** Which data tools the model consulted, so the UI can show it was grounded. */
  toolsUsed: string[];
}

export type AssistantErrorKind = 'unreachable' | 'notConfigured' | 'failed';

export class AssistantError extends Error {
  readonly kind: AssistantErrorKind;

  constructor(kind: AssistantErrorKind, message: string) {
    super(message);
    this.name = 'AssistantError';
    this.kind = kind;
  }
}

/** Only role and content go to the server; ids and timestamps are ours. */
function toWireHistory(history: ChatMessage[]): { role: ChatRole; content: string }[] {
  return history.slice(-10).map((message) => ({
    role: message.role,
    content: message.text,
  }));
}

/** Pause between the first attempt and the retry. */
const RETRY_DELAY_MS = 1200;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function postOnce(
  url: string,
  message: string,
  history: ChatMessage[],
): Promise<Response> {
  // The model reasons and may call tools, so this needs to be generous - but
  // not unbounded, or a dead backend leaves the user watching a spinner.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ASSISTANT_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: toWireHistory(history) }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function askAssistant(
  message: string,
  history: ChatMessage[],
): Promise<AssistantReply> {
  const url = `${BACKEND_API_BASE_URL}${CHAT_PATH}`;

  /*
   * One retry, and only when nothing completed.
   *
   * Both services are on a free tier that sleeps, so the first request after an
   * idle spell can take long enough that the phone gives up while the server is
   * still starting. By the second attempt it is usually awake. A dropped mobile
   * signal behaves the same way.
   *
   * Deliberately not retried for anything the server actually answered: a
   * missing key will not fix itself, and a failed generation would just be paid
   * for twice.
   */
  let response: Response;
  try {
    response = await postOnce(url, message, history);
  } catch {
    await wait(RETRY_DELAY_MS);
    try {
      response = await postOnce(url, message, history);
    } catch {
      throw new AssistantError(
        'unreachable',
        "The assistant didn't respond in time. It may be waking up - try again.",
      );
    }
  }

  if (response.status === 503) {
    throw new AssistantError(
      'notConfigured',
      'The assistant is not configured on the server yet.',
    );
  }

  let payload: { success?: boolean; data?: AssistantReply; message?: string };
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    throw new AssistantError('failed', 'The assistant sent a reply we could not read.');
  }

  if (!response.ok || payload.success !== true || payload.data === undefined) {
    throw new AssistantError('failed', payload.message ?? 'The assistant could not answer.');
  }

  return { reply: payload.data.reply, toolsUsed: payload.data.toolsUsed ?? [] };
}
