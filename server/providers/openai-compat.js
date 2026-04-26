const OpenAI = require("openai");

const BASE_URLS = {
  openai: undefined,
  deepseek: "https://api.deepseek.com",
  kimi: "https://api.moonshot.cn/v1",
};

const SYSTEM_PROMPT =
  "You are an AI assistant embedded in Microsoft Office. Help the user work with their documents. " +
  "When providing content to be inserted into a document, format it clearly and concisely.";

async function streamOpenAICompat({ provider, model, messages, apiKey, baseURL: configBaseURL, sendChunk }) {
  const baseURL = configBaseURL ?? BASE_URLS[provider];
  const client = new OpenAI.default({ apiKey, ...(baseURL ? { baseURL } : {}) });

  const allMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

  const stream = await client.chat.completions.create({
    model,
    messages: allMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) sendChunk(text);
  }
}

module.exports = { streamOpenAICompat };
