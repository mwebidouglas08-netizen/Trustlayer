"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { backend } from "@/lib/supabase/client";
interface AccountContext {
  session: Session | null;
  loading: boolean;
  authError: string;
  signOut: () => Promise<void>;
}
const Context = createContext<AccountContext | null>(null);
export function useAccount() {
  const context = useContext(Context);
  if (!context) throw new Error("Account provider missing");
  return context;
}
export function AccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  useEffect(() => {
    let active = true;
    void backend()
      .auth.getSession()
      .then(({ data, error }) => {
        if (active) {
          setSession(data.session);
          setLoading(false);
          if (error) setAuthError(error.message);
        }
      })
      .catch(() => {
        if (active) {
          setAuthError("Could not restore your account session.");
          setLoading(false);
        }
      });
    const {
      data: { subscription },
    } = backend().auth.onAuthStateChange((_event, next) => {
      if (active) {
        setSession(next);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  async function signOut() {
    const { error } = await backend().auth.signOut({ scope: "local" });
    if (error) throw error;
    setSession(null);
  }
  return (
    <Context.Provider value={{ session, loading, authError, signOut }}>
      {children}
    </Context.Provider>
  );
}
