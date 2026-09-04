import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { publicHandle } from "@/lib/game/handle";
import { checkHandle, getMyProfile, setHandle, type SetHandleResult } from "@/lib/game/profile";

export function useProfile() {
  const { user, isPending } = useCurrentUserState();
  const [handle, setLocal] = useState<string | null>(null);
  const [suggested, setSuggested] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setLocal(null);
      setSuggested("");
      setSuggestions([]);
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
      setSuggestions([]);
    }
    setReady(true);
  }, [user]);

  useEffect(() => {
    if (isPending) {
      setReady(false);
      return;
    }
    setReady(false);
    void refresh();
  }, [isPending, refresh]);

  const save = useCallback(async (value: string): Promise<SetHandleResult> => {
    const res = await setHandle({ data: { handle: value } });
    if (res.ok) {
      setLocal(res.handle);
      setSuggested(res.handle);
    }
    return res;
  }, []);

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
