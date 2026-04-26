import React from "react";
import { ModelsMap } from "../../services/apiService";
import { t } from "../../i18n";

interface Props {
  models: ModelsMap;
  provider: string;
  model: string;
  onProviderChange: (p: string) => void;
  onModelChange: (m: string) => void;
}

export default function ModelSelector({ models, provider, model, onProviderChange, onModelChange }: Props) {
  const providers = Object.keys(models);
  const currentModels = models[provider] ?? [];

  const handleProviderChange = (p: string) => {
    onProviderChange(p);
    const first = models[p]?.[0]?.id ?? "";
    onModelChange(first);
  };

  if (providers.length === 0) {
    return (
      <div className="model-selector">
        <span style={{ color: "#999", fontSize: 12 }}>{t("noModels")}</span>
      </div>
    );
  }

  return (
    <div className="model-selector">
      <label>{t("provider")}</label>
      <select value={provider} onChange={(e) => handleProviderChange(e.target.value)}>
        {providers.map((p) => (
          <option key={p} value={p}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </option>
        ))}
      </select>
      <label>{t("model")}</label>
      <select value={model} onChange={(e) => onModelChange(e.target.value)}>
        {currentModels.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
