import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

export const newId = customAlphabet(alphabet, 21);

/** Builds a unique, lexically-sortable-friendly ID for DB primary keys. */
export function createId(): string {
  return newId();
}
