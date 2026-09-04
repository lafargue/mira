import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { checkHandle, getMyProfile, setHandle, type SetHandleResult } from "@/lib/game/profile";

export function useProfile() {
  const { user, isPending } = useCurrentUserState();
  const [handle, setLocal] = useState<string | null>(null);
  const [suggested, setSuggested] = useState("");
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setLocal(null);
      setSuggested("");
      setReady(true);
      return;
    }
    try {
      const row = await getMyProfile();
      setLocal(row.handle);
      setSuggested(row.suggested);
    } catch {
      setLocal(null);
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
    if (res.ok) setLocal(res.handle);
    return res;
  }, []);

  const check = useCallback(async (value: string): Promise<SetHandleResult> => {
    return checkHandle({ data: { handle: value } });
  }, []);

  return {
    handle,
    suggested,
    ready,
    signedIn: Boolean(user),
    needsClaim: Boolean(user) && ready && !handle,
    save,
    check,
  };
}
