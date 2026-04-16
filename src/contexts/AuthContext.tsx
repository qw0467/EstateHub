import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "free" | "seller" | "member" | "admin";

type Membership = {
  id: string;
  tier: string;
  status: string;
  end_date: string | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  role: UserRole;
  membership: Membership | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  refreshMembership: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: "free",
  membership: null,
  loading: true,
  signOut: async () => {},
  refreshRole: async () => {},
  refreshMembership: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>("free");
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (): Promise<UserRole> => {
    const { data } = await supabase.rpc("get_current_user_role");
    const resolved = (data as UserRole) ?? "free";
    setRole(resolved);
    return resolved;
  };

  const fetchMembership = async (userId: string) => {
    const { data } = await supabase
      .from("memberships")
      .select("id, tier, status, end_date")
      .eq("user_id", userId)
      .maybeSingle();
    setMembership(data);
  };

  const refreshRole = async () => {
    await fetchRole();
  };

  const refreshMembership = async () => {
    if (user) await fetchMembership(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "global" });
    setUser(null);
    setSession(null);
    setRole("free");
    setMembership(null);
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Await both so that `loading` is only cleared after role is known.
        // This prevents ProtectedRoute from reading a stale "free" role and
        // redirecting a legitimate admin away on initial page load / refresh.
        await Promise.all([
          fetchRole(),
          fetchMembership(session.user.id),
        ]);
      }

      if (mounted) setLoading(false);
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Role and membership are fetched asynchronously on auth-state changes
        // (sign-in, token refresh).  The initial bootstrap already awaits them,
        // so this covers subsequent changes without blocking the UI.
        fetchRole();
        fetchMembership(session.user.id);
      } else {
        setRole("free");
        setMembership(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, role, membership, loading, signOut, refreshRole, refreshMembership }}
    >
      {children}
    </AuthContext.Provider>
  );
};
