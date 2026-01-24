import type { Messages } from "./get-messages";

export type Translator = (key: string) => string;

export function createTranslator(messages: Messages): Translator {
  return (key: string) => messages[key] ?? key;
}
