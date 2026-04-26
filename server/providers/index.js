const { streamAnthropic } = require("./anthropic");
const { streamOpenAICompat } = require("./openai-compat");

async function streamWithProvider({ provider, model, messages, apiKey, baseURL, sendChunk }) {
  if (provider === "anthropic") {
    return streamAnthropic({ model, messages, apiKey, baseURL, sendChunk });
  }
  return streamOpenAICompat({ provider, model, messages, apiKey, baseURL, sendChunk });
}

module.exports = { streamWithProvider };
