const Anthropic = require("@anthropic-ai/sdk");

const SYSTEM_PROMPT =
  "You are an AI assistant embedded in Microsoft Office. Help the user work with their documents. " +
  "When providing content to be inserted into a document, format it clearly and concisely.";

async function streamAnthropic({ model, messages, apiKey, baseURL, sendChunk }) {
  const opts = { apiKey };
  if (baseURL) opts.baseURL = baseURL;
  const client = new Anthropic.default(opts);

  const stream = await client.messages.stream({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      sendChunk(chunk.delta.text);
    }
  }
}

module.exports = { streamAnthropic };
