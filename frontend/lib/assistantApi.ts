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

export async function askAssistant(
  message: string,
  history: ChatMessage[],
): Promise<AssistantReply> {
  const url = `${BACKEND_API_BASE_URL}${CHAT_PATH}`;

  // The model reasons and may call tools, so this needs to be generous - but
  // not unbounded, or a dead backend leaves the user watching a spinner.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ASSISTANT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: toWireHistory(history) }),
      signal: controller.signal,
    });
  } catch {
    throw new AssistantError(
      'unreachable',
      'Could not reach the SmartFlow assistant. Check that the server is running.',
    );
  } finally {
    clearTimeout(timeout);
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
