/**
 * Live-preview sign-in stores the session bearer in sessionStorage
 * (`grok-auth.bearer-token`). That vanishes when the tab/embed closes.
 * Mirror it to localStorage so the next visit can restore it, without
 * touching the prewired auth client.
 */
const TOKEN_KEY = "grok-auth.bearer-token";
const PERSIST_KEY = "mira.auth.bearer";
const INSTALLED = "__miraSessionPersist";

export function restorePreviewSession(): void {
  if (typeof window === "undefined") return;
  const flag = window as Window & { [INSTALLED]?: boolean };
  if (flag[INSTALLED]) return;
  flag[INSTALLED] = true;

  try {
    const live = window.sessionStorage.getItem(TOKEN_KEY);
    const saved = window.localStorage.getItem(PERSIST_KEY);
    if (!live && saved) window.sessionStorage.setItem(TOKEN_KEY, saved);
    else if (live && live !== saved) window.localStorage.setItem(PERSIST_KEY, live);

    const rawSet = window.sessionStorage.setItem.bind(window.sessionStorage);
    const rawRemove = window.sessionStorage.removeItem.bind(window.sessionStorage);
    window.sessionStorage.setItem = (key, value) => {
      rawSet(key, value);
      if (key === TOKEN_KEY) window.localStorage.setItem(PERSIST_KEY, value);
    };
    window.sessionStorage.removeItem = (key) => {
      rawRemove(key);
      if (key === TOKEN_KEY) window.localStorage.removeItem(PERSIST_KEY);
    };
  } catch {
    /* private mode / quota */
  }
}

export function clearPersistedSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(PERSIST_KEY);
  } catch {
    /* ignore */
  }
}

export function hasPreviewToken(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.sessionStorage.getItem(TOKEN_KEY));
  } catch {
    return false;
  }
}
