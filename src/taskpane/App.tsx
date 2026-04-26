import React, { useEffect, useState, useCallback } from "react";
import ModelSelector from "./components/ModelSelector";
import ContextBar from "./components/ContextBar";
import ChatPanel from "./components/ChatPanel";
import { Message } from "./components/MessageItem";
import { fetchModels, streamChat, ModelsMap } from "../services/apiService";
import { getSelectionText, getHostType } from "../services/officeService";
import { t } from "../i18n";

const STORAGE_KEY_PROVIDER = "ai_addin_provider";
const STORAGE_KEY_MODEL = "ai_addin_model";

function makeId() {
  return Math.random().toString(36).slice(2);
}

export default function App() {
  const [models, setModels] = useState<ModelsMap>({});
  const [provider, setProvider] = useState(localStorage.getItem(STORAGE_KEY_PROVIDER) ?? "");
  const [model, setModel] = useState(localStorage.getItem(STORAGE_KEY_MODEL) ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    try {
      const data = await fetchModels();
      setModels(data);
      setError(null);
      const providers = Object.keys(data);
      if (providers.length > 0) {
        const savedProvider = localStorage.getItem(STORAGE_KEY_PROVIDER);
        const activeProvider = savedProvider && data[savedProvider] ? savedProvider : providers[0];
        setProvider(activeProvider);
        const savedModel = localStorage.getItem(STORAGE_KEY_MODEL);
        const providerModels = data[activeProvider] ?? [];
        const activeModel =
          savedModel && providerModels.find((m) => m.id === savedModel)
            ? savedModel
            : providerModels[0]?.id ?? "";
        setModel(activeModel);
      }
    } catch {
      setError(t("serverError"));
    }
  }, []);

  const refreshContext = useCallback(async () => {
    const sel = await getSelectionText();
    setContext(sel);
  }, []);

  useEffect(() => {
    loadModels();
    refreshContext();
  }, [loadModels, refreshContext]);

  const handleProviderChange = (p: string) => {
    setProvider(p);
    localStorage.setItem(STORAGE_KEY_PROVIDER, p);
  };

  const handleModelChange = (m: string) => {
    setModel(m);
    localStorage.setItem(STORAGE_KEY_MODEL, m);
  };

  const handleSend = async (text: string) => {
    if (!provider || !model) return;

    const userMsg: Message = { id: makeId(), role: "user", content: text };
    const assistantId = makeId();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", isStreaming: true };

    const history = [...messages, userMsg];
    setMessages([...history, assistantMsg]);
    setIsLoading(true);

    const chatHistory = history.map((m) => ({ role: m.role, content: m.content }));

    await streamChat({
      provider,
      model,
      messages: chatHistory,
      context,
      hostType: getHostType(),
      onChunk: (chunk) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
        );
      },
      onDone: () => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
        );
        setIsLoading(false);
      },
      onError: (msg) => {
        const errText = msg === "server_unavailable" ? t("serverError") : t("errorPrefix") + msg;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: errText, isStreaming: false } : m
          )
        );
        setIsLoading(false);
      },
    });
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <>
      <div className="header">
        <span className="header-title">{t("title")}</span>
        <div className="header-actions">
          <button className="icon-btn" onClick={handleClear} title={t("clear")}>
            ✕ {t("clear")}
          </button>
        </div>
      </div>

      <ModelSelector
        models={models}
        provider={provider}
        model={model}
        onProviderChange={handleProviderChange}
        onModelChange={handleModelChange}
      />

      <ContextBar context={context} onRefresh={refreshContext} />

      {error && <div className="error-banner">{error}</div>}

      <ChatPanel messages={messages} isLoading={isLoading} onSend={handleSend} />
    </>
  );
}
