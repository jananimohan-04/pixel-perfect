import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile, Role, UserRole } from "@/lib/api";

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  profile: null,
  role: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    role: null,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function loadData(session: Session | null) {
      if (!session) {
        if (mounted) setState({ session: null, user: null, profile: null, role: null, isLoading: false });
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("cncvault_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        let roleData = null;
        // Types in Supabase generated files can sometimes be deeply nested, we cast to any for simplicity
        const { data: userRole } = await supabase
          .from("cncvault_user_roles")
          .select("*, roles:cncvault_roles(*)")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (userRole && (userRole as any).roles) {
          roleData = (userRole as any).roles as Role;
        }

        if (mounted) {
          setState({
            session,
            user: session.user,
            profile,
            role: roleData,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Failed to load auth data", error);
        if (mounted) setState({ session, user: session.user, profile: null, role: null, isLoading: false });
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadData(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadData(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
