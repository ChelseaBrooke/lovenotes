import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/lib/AuthProvider";
import { ConnectionError, FullLoader } from "@/components/ui";

/**
 * Pairing gate. No sign-in screen — an anonymous identity is created silently
 * (see AuthProvider). Route to pairing until paired, then straight to the board
 * on every launch.
 */
export default function Index() {
  const { initializing, session, profile, authError, retry } = useAuth();

  if (initializing) return <FullLoader />;
  if (!session) return <ConnectionError message={authError} onRetry={retry} />;
  if (!profile?.space_id) return <Redirect href="/pair" />;
  return <Redirect href="/board" />;
}
