const express = require("express");
const cors = require("cors");
const modelsRouter = require("./routes/models");
const chatRouter = require("./routes/chat");

const app = express();
const PORT = 3002;

app.use(cors({ origin: ["https://localhost:3000", "null"] }));
app.use(express.json());

app.use("/api/models", modelsRouter);
app.use("/api/chat", chatRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`AI Office Proxy running on http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop");
});
