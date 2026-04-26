import React, { useState } from "react";
import { t } from "../../i18n";
import { applyToDocument } from "../../services/officeService";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface Props {
  message: Message;
}

export default function MessageItem({ message }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleApply = async () => {
    try {
      await applyToDocument(message.content);
    } catch (e) {
      console.error("Apply failed:", e);
    }
  };

  return (
    <div className={`message ${message.role}`}>
      <div className="message-role">
        {message.role === "user" ? t("you") : t("assistant")}
      </div>
      <div className={`message-bubble${message.isStreaming ? " streaming" : ""}`}>
        {message.content}
      </div>
      {message.role === "assistant" && !message.isStreaming && (
        <div className="message-actions">
          <button className="action-btn primary" onClick={handleApply}>
            {t("apply")}
          </button>
          <button className="action-btn" onClick={handleCopy}>
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
      )}
    </div>
  );
}
