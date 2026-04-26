const { streamAnthropic } = require("./anthropic");
const { streamOpenAICompat } = require("./openai-compat");

async function streamWithProvider({ provider, model, messages, apiKey, baseURL, hostType, sendChunk }) {
  if (provider === "anthropic") {
    return streamAnthropic({ model, messages, apiKey, baseURL, hostType, sendChunk });
  }
  return streamOpenAICompat({ provider, model, messages, apiKey, baseURL, hostType, sendChunk });
}

module.exports = { streamWithProvider };
