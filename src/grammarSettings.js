export const GRAMMAR_SET_IDS_STORAGE_KEY = "grammarSetIds";

export function getStoredGrammarSetIds() {
  const rawValue = window.localStorage.getItem(GRAMMAR_SET_IDS_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return null;
    }

    return parsedValue.filter((id) => id !== null && id !== undefined);
  } catch {
    return null;
  }
}

export function storeGrammarSetIds(setIds) {
  window.localStorage.setItem(
    GRAMMAR_SET_IDS_STORAGE_KEY,
    JSON.stringify(setIds)
  );
}
