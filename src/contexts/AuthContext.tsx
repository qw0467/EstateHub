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

  const fetchRole = async () => {
    const { data } = await supabase.rpc("get_current_user_role");
    if (data) setRole(data as UserRole);
    else setRole("free");
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole("free");
    setMembership(null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole();
        fetchMembership(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole();
        fetchMembership(session.user.id);
      } else {
        setRole("free");
        setMembership(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, role, membership, loading, signOut, refreshRole, refreshMembership }}
    >
      {children}
    </AuthContext.Provider>
  );
};
