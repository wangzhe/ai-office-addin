import zh from "./zh";
import en from "./en";

const strings = navigator.language.startsWith("zh") ? zh : en;

export function t(key: keyof typeof en): string {
  return strings[key] ?? key;
}
