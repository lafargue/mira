/**
 * Live-preview sign-in stores the session bearer in sessionStorage
 * (`grok-auth.bearer-token`). That vanishes when the tab/embed closes.
 * Mirror it to localStorage so the next visit can restore it, without
 * touching the prewired auth client.
 *
 * Restore must run BEFORE the auth client fetches `/get-session`. An inline
 * script in `<head>` (PREVIEW_RESTORE_SCRIPT) covers the first paint;
 * restorePreviewSession() then patches sessionStorage so later sign-in/out
 * stay mirrored.
 */
const TOKEN_KEY = "grok-auth.bearer-token";
const PERSIST_KEY = "mira.auth.bearer";
const INSTALLED = "__miraSessionPersist";

/** Runs in <head> before module JS. Keep in sync with restorePreviewSession. */
export const PREVIEW_RESTORE_SCRIPT =
  'try{var k="grok-auth.bearer-token",p="mira.auth.bearer";var s=sessionStorage.getItem(k),l=localStorage.getItem(p);if(!s&&l)sessionStorage.setItem(k,l);else if(s&&s!==l)localStorage.setItem(p,s);}catch(e){}';

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
    return Boolean(
      window.sessionStorage.getItem(TOKEN_KEY) || window.localStorage.getItem(PERSIST_KEY),
    );
  } catch {
    return false;
  }
}
