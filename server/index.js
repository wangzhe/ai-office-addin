const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const express = require("express");
const cors = require("cors");
const modelsRouter = require("./routes/models");
const chatRouter = require("./routes/chat");

const app = express();
const PORT = 3002;

const certDir = path.join(os.homedir(), ".office-addin-dev-certs");
const sslOptions = {
  key: fs.readFileSync(path.join(certDir, "localhost.key")),
  cert: fs.readFileSync(path.join(certDir, "localhost.crt")),
};

app.use(cors({ origin: ["https://localhost:3000", "null"] }));
app.use(express.json());

app.use("/api/models", modelsRouter);
app.use("/api/chat", chatRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`AI Office Proxy running on https://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop");
});
