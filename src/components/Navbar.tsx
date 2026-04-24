import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, UserCircle, Crown, CalendarDays } from "lucide-react";

const Navbar = () => {
  const { user, role, membership, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? "text-primary font-semibold"
      : "hover:text-primary transition-colors";

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] bg-clip-text text-transparent"
          >
            EstateHub
          </Link>

          <nav className="hidden md:flex gap-6 items-center">
            <Link
              to="/properties"
              className={`text-sm font-medium ${isActive("/properties")}`}
            >
              All Properties
            </Link>
            <Link
              to="/exclusive"
              className={`text-sm font-medium ${isActive("/exclusive")}`}
            >
              Exclusive
            </Link>
            <Link
              to="/membership"
              className={`text-sm font-medium ${isActive("/membership")}`}
            >
              Membership
            </Link>
            {user && (
              <Link
                to="/profile"
                className={`text-sm font-medium flex items-center gap-1 ${isActive("/profile")}`}
              >
                <UserCircle className="h-4 w-4" />
                My Profile
              </Link>
            )}
            {user && (
              <Link
                to="/members"
                className={`text-sm font-medium flex items-center gap-1 ${isActive("/members")}`}
              >
                <Crown className="h-4 w-4" />
                Members
              </Link>
            )}
            {role === "admin" && (
              <Link
                to="/admin"
                className={`text-sm font-medium flex items-center gap-1 ${isActive("/admin")}`}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors max-w-[220px]"
                >
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
