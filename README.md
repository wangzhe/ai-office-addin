# AI Office Add-in

Multi-provider AI chat assistant for Microsoft Excel, Word, and PowerPoint.  
Switch freely between Anthropic (Claude), OpenAI (GPT), DeepSeek, and Kimi.

## Features

- Chat with AI directly inside Excel, Word, and PowerPoint
- One-click **Apply to Document** to insert AI responses into your file
- Auto-captures selected text/cells as context
- Switch provider and model without reloading
- Bilingual UI (中文 / English auto-detected)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure API keys

```bash
mkdir -p ~/.ai-office-addin
cp config.template.json ~/.ai-office-addin/config.json
```

Edit `~/.ai-office-addin/config.json` and fill in your API keys.  
You can disable a provider by removing it or leaving the key as-is with `YOUR_KEY`.

### 3. Install HTTPS certificates (first time only)

Office Add-ins require HTTPS. Run once:

```bash
npm run install-certs
```

### 4. Start the add-in

```bash
npm start
```

This starts both:
- **Proxy server** on `http://localhost:3002`
- **Webpack dev server** on `https://localhost:3000`

### 5. Sideload in Office (Mac)

**Excel / Word / PowerPoint:**
1. Open the app
2. Go to **Insert → Add-ins → My Add-ins → Manage My Add-ins**
3. Click **Upload My Add-in**
4. Select `manifest.xml` from this folder

The AI chat panel will appear in the ribbon under **Home → AI Assistant**.

## Adding custom models

Edit `~/.ai-office-addin/config.json` and add entries to any provider's `models` array:

```json
{
  "id": "gpt-4-turbo",
  "label": "GPT-4 Turbo"
}
```

Restart the proxy server (`node server/index.js`) and the new model appears automatically.

## Architecture

```
Office Add-in (React, TypeScript, Office.js)
    ↓ http://localhost:3002
Proxy Server (Node.js, Express)
    ├── Anthropic SDK  → Claude
    ├── OpenAI SDK     → GPT
    ├── OpenAI SDK (baseURL: deepseek) → DeepSeek
    └── OpenAI SDK (baseURL: kimi)    → Kimi
```
