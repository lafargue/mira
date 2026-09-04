import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { publicHandle, slugFromName } from "@/lib/game/handle";
import { checkHandle, getMyProfile, setHandle, type SetHandleResult } from "@/lib/game/profile";

export function useProfile() {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id ?? null;
  const displayName = user?.displayName ?? "";
  const [handle, setLocal] = useState<string | null>(null);
  const [suggested, setSuggested] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const loadedFor = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLocal(null);
      setSuggested("");
      setSuggestions([]);
      loadedFor.current = "out";
      setReady(true);
      return;
    }
    try {
      const row = await getMyProfile();
      setLocal(publicHandle(row.handle));
      setSuggested(row.suggested);
      setSuggestions(row.suggestions ?? []);
    } catch {
      setLocal(null);
      setSuggested(slugFromName(displayName));
      setSuggestions([]);
    }
    loadedFor.current = userId;
    setReady(true);
  }, [userId, displayName]);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isPending) return;
    const key = userId ?? "out";
    if (loadedFor.current === key) return;
    if (loadedFor.current !== null) setReady(false);
    void refresh();
  }, [isPending, userId, refresh]);

  const save = useCallback(async (value: string): Promise<SetHandleResult> => {
    const res = await setHandle({ data: { handle: value } });
    if (res.ok) {
      setLocal(res.handle);
      setSuggested(res.handle);
      loadedFor.current = userId;
    }
    return res;
  }, [userId]);

  const check = useCallback(async (value: string): Promise<SetHandleResult> => {
    return checkHandle({ data: { handle: value } });
  }, []);

  const signedIn = Boolean(user) && !user?.isDevFallback;

  return {
    handle,
    suggested,
    suggestions,
    ready,
    signedIn,
    needsClaim: signedIn && ready && !handle,
    save,
    check,
  };
}
