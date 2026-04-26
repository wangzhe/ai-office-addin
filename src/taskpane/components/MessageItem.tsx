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

// Extract Excel formulas from AI response text
function extractFormulas(text: string): string[] {
  const matches = text.match(/=[\w(][^=\n"']{2,80}/g) ?? [];
  return [...new Set(matches.map((f) => f.trim().replace(/[,，。.]$/, "")))];
}

// Detect if the response is pure tabular data (no prose)
function isPureData(text: string): boolean {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return false;
  const tabLines = lines.filter((l) => l.includes("\t"));
  return tabLines.length >= lines.length * 0.7;
}

export default function MessageItem({ message }: Props) {
  const [copied, setCopied] = useState(false);
  const [appliedFormula, setAppliedFormula] = useState<string | null>(null);

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

  const handleApplyFormula = async (formula: string) => {
    try {
      await applyToDocument(formula);
      setAppliedFormula(formula);
      setTimeout(() => setAppliedFormula(null), 2000);
    } catch (e) {
      console.error("Formula apply failed:", e);
    }
  };

  if (message.role !== "assistant" || message.isStreaming) {
    return (
      <div className={`message ${message.role}`}>
        <div className="message-role">
          {message.role === "user" ? t("you") : t("assistant")}
        </div>
        <div className={`message-bubble${message.isStreaming ? " streaming" : ""}`}>
          {message.content}
        </div>
      </div>
    );
  }

  const formulas = extractFormulas(message.content);
  const pureData = isPureData(message.content);

  return (
    <div className={`message ${message.role}`}>
      <div className="message-role">{t("assistant")}</div>
      <div className="message-bubble">{message.content}</div>

      <div className="message-actions">
        {/* Pure data or text → apply whole response */}
        {(pureData || formulas.length === 0) && (
          <button className="action-btn primary" onClick={handleApply}>
            {t("apply")}
          </button>
        )}

        {/* Extracted formulas → individual write buttons */}
        {formulas.length > 0 && (
          <div className="formula-list">
            {formulas.slice(0, 4).map((f) => (
              <button
                key={f}
                className="action-btn formula-btn"
                onClick={() => handleApplyFormula(f)}
                title={f}
              >
                {appliedFormula === f ? "✓ 已写入" : `写入: ${f.length > 28 ? f.slice(0, 28) + "…" : f}`}
              </button>
            ))}
          </div>
        )}

        <button className="action-btn" onClick={handleCopy}>
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
    </div>
  );
}
