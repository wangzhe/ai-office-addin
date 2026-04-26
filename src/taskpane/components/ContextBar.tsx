import React from "react";
import { t } from "../../i18n";

interface Props {
  context: string | null;
  onRefresh: () => void;
}

export default function ContextBar({ context, onRefresh }: Props) {
  return (
    <div className="context-bar">
      <span className="context-label">{t("contextLabel")}:</span>
      {context ? (
        <span className="context-text" title={context}>
          {context.length > 60 ? context.slice(0, 60) + "…" : context}
        </span>
      ) : (
        <span className="context-empty">{t("noContext")}</span>
      )}
      <button className="context-refresh" onClick={onRefresh}>
        {t("refreshContext")}
      </button>
    </div>
  );
}
