import React, { useEffect, useState } from "react";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  useAuth,
} from "@clerk/clerk-react";
import { api } from "@/lib/api";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

/** Attaches the Clerk session token to every API request. */
const TokenBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = api.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    setReady(true);
    return () => api.interceptors.request.eject(id);
  }, [getToken]);

  // Don't fire unauthenticated requests before the interceptor exists
  return ready ? <>{children}</> : null;
};

/**
 * Wraps the app in Clerk auth when VITE_CLERK_PUBLISHABLE_KEY is set.
 * Without the key (local dev), renders the app directly — the backend runs
 * in single-user local mode in that case too.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!PUBLISHABLE_KEY) return <>{children}</>;
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <SignedIn>
        <TokenBridge>{children}</TokenBridge>
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <SignIn />
        </div>
      </SignedOut>
    </ClerkProvider>
  );
};
