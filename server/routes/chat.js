const express = require("express");
const { getConfig } = require("../config");
const { streamWithProvider } = require("../providers");

const router = express.Router();

router.post("/", async (req, res) => {
  const { provider, model, messages, context } = req.body;
  if (!provider || !model || !messages) {
    return res.status(400).json({ error: "Missing provider, model, or messages" });
  }

  const config = getConfig();
  const providerConfig = config.providers[provider];
  if (!providerConfig?.apiKey) {
    return res.status(400).json({ error: `No API key configured for ${provider}` });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const allMessages = [...messages];
  if (context) {
    const last = allMessages[allMessages.length - 1];
    if (last?.role === "user") {
      allMessages[allMessages.length - 1] = {
        ...last,
        content: `${last.content}\n\n---\n以下是当前选中内容（Selected content）:\n${context}`,
      };
    }
  }

  const sendChunk = (text) => {
    res.write(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`);
  };

  try {
    await streamWithProvider({ provider, model, messages: allMessages, apiKey: providerConfig.apiKey, baseURL: providerConfig.baseUrl, sendChunk });
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
  } finally {
    res.end();
  }
});

module.exports = router;
