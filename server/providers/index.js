const { streamAnthropic } = require("./anthropic");
const { streamOpenAICompat } = require("./openai-compat");

async function streamWithProvider({ provider, model, messages, apiKey, sendChunk }) {
  if (provider === "anthropic") {
    return streamAnthropic({ model, messages, apiKey, sendChunk });
  }
  return streamOpenAICompat({ provider, model, messages, apiKey, sendChunk });
}

module.exports = { streamWithProvider };
