const PROXY_URL = "http://localhost:3002";

export interface ModelOption {
  id: string;
  label: string;
}

export type ModelsMap = Record<string, ModelOption[]>;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function fetchModels(): Promise<ModelsMap> {
  const res = await fetch(`${PROXY_URL}/api/models`);
  if (!res.ok) throw new Error("server_unavailable");
  return res.json();
}

export async function streamChat(params: {
  provider: string;
  model: string;
  messages: ChatMessage[];
  context: string | null;
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}): Promise<void> {
  const { provider, model, messages, context, onChunk, onDone, onError } = params;

  let res: Response;
  try {
    res = await fetch(`${PROXY_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, model, messages, context }),
    });
  } catch {
    onError("server_unavailable");
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    onError(err.error ?? "Request failed");
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try {
        const event = JSON.parse(raw);
        if (event.type === "text") onChunk(event.content);
        else if (event.type === "done") onDone();
        else if (event.type === "error") onError(event.message);
      } catch {
        // malformed chunk, skip
      }
    }
  }
}
