const express = require("express");
const { getConfig } = require("../config");

const router = express.Router();

router.get("/", (_req, res) => {
  const config = getConfig();
  const result = {};
  for (const [provider, data] of Object.entries(config.providers)) {
    if (data.apiKey && !data.apiKey.includes("YOUR_KEY")) {
      result[provider] = data.models || [];
    }
  }
  res.json(result);
});

module.exports = router;
