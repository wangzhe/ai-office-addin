const Anthropic = require("@anthropic-ai/sdk");

function buildSystemPrompt(hostType) {
  const base =
    "You are an AI assistant embedded in Microsoft Office. " +
    "Always respond in the same language the user writes in (Chinese or English).";

  if (hostType === "Excel") {
    return (
      base +
      "\n\nYou are working inside Microsoft Excel. You can help the user:" +
      "\n- Analyze and summarize data from selected cells" +
      "\n- Write Excel formulas (always start with =, e.g. =SUM(A1:A10), =VLOOKUP(...))" +
      "\n- Generate structured data in tab-separated format for pasting into cells" +
      "\n- Explain data patterns, trends, or anomalies" +
      "\nWhen the user asks to fill cells or create a formula, output ONLY the formula or data (no explanation around it), so it can be directly applied. " +
      "For multi-cell data, use tab (\\t) between columns and newline between rows."
    );
  }

  if (hostType === "Word") {
    return (
      base +
      "\n\nYou are working inside Microsoft Word. Help the user write, rewrite, summarize, or improve document content. " +
      "When asked to rewrite or replace text, output only the new text without extra explanation."
    );
  }

  if (hostType === "PowerPoint") {
    return (
      base +
      "\n\nYou are working inside Microsoft PowerPoint. Help the user write slide content, titles, bullet points, or speaker notes. " +
      "Keep responses concise and presentation-appropriate."
    );
  }

  return base + "\n\nHelp the user work with their Office document.";
}

async function streamAnthropic({ model, messages, apiKey, baseURL, hostType, sendChunk }) {
  const opts = { apiKey };
  if (baseURL) opts.baseURL = baseURL;
  const client = new Anthropic.default(opts);

  const stream = await client.messages.stream({
    model,
    max_tokens: 4096,
    system: buildSystemPrompt(hostType),
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
