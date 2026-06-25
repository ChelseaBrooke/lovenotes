import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Profile, Space } from "./types";

interface AuthContextValue {
  initializing: boolean;
  session: Session | null;
  profile: Profile | null;
  space: Space | null;
  partner: Profile | null;
  authError: string | null;
  retry: () => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  leaveSpace: () => Promise<void>;
  createSpace: (name?: string) => Promise<Space>;
  joinSpace: (code: string) => Promise<Space>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadProfileGraph = useCallback(async (userId: string) => {
    const { data: me } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile(me ?? null);

    if (me?.space_id) {
      const [{ data: sp }, { data: members }] = await Promise.all([
        supabase.from("spaces").select("*").eq("id", me.space_id).maybeSingle(),
        supabase.from("profiles").select("*").eq("space_id", me.space_id),
      ]);
      setSpace(sp ?? null);
      setPartner((members ?? []).find((m) => m.id !== userId) ?? null);
    } else {
      setSpace(null);
      setPartner(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (session?.user.id) await loadProfileGraph(session.user.id);
  }, [session?.user.id, loadProfileGraph]);

  // No sign-in screen: every device silently gets an anonymous identity on
  // first launch (session persists in AsyncStorage). Surfaces an error instead
  // of hanging if auth is unreachable (e.g. the project's egress quota block).
  const bootstrap = useCallback(async () => {
    setAuthError(null);
    try {
      const { data } = await supabase.auth.getSession();
      let next = data.session;
      if (!next) {
        const { data: anon, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        next = anon.session ?? null;
      }
      setSession(next);
      if (next?.user.id) await loadProfileGraph(next.user.id);
    } catch (e: any) {
      setAuthError(e?.message ?? "Couldn’t connect.");
    } finally {
      setInitializing(false);
    }
  }, [loadProfileGraph]);

  const retry = useCallback(async () => {
    setInitializing(true);
    await bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user.id) {
        await loadProfileGraph(s.user.id);
      } else {
        setProfile(null);
        setSpace(null);
        setPartner(null);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [bootstrap, loadProfileGraph]);

  const setDisplayName = useCallback(
    async (name: string) => {
      if (!session?.user.id) return;
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim() })
        .eq("id", session.user.id);
      if (error) throw error;
      await refresh();
    },
    [session?.user.id, refresh]
  );

  const leaveSpace = useCallback(async () => {
    if (!session?.user.id) return;
    await supabase.from("profiles").update({ space_id: null }).eq("id", session.user.id);
    await refresh();
  }, [session?.user.id, refresh]);

  const createSpace = useCallback(
    async (name?: string) => {
      const { data, error } = await supabase.rpc("create_space", {
        space_name: name?.trim() || null,
      });
      if (error) throw error;
      await refresh();
      return data as unknown as Space;
    },
    [refresh]
  );

  const joinSpace = useCallback(
    async (code: string) => {
      const { data, error } = await supabase.rpc("join_space", { code });
      if (error) throw error;
      await refresh();
      return data as unknown as Space;
    },
    [refresh]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      session,
      profile,
      space,
      partner,
      authError,
      retry,
      setDisplayName,
      leaveSpace,
      createSpace,
      joinSpace,
      refresh,
    }),
    [
      initializing,
      session,
      profile,
      space,
      partner,
      authError,
      retry,
      setDisplayName,
      leaveSpace,
      createSpace,
      joinSpace,
      refresh,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
