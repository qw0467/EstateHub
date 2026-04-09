import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "@/components/PropertyCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Property = {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  property_type: string;
  image_url: string | null;
};

type Membership = {
  tier: string;
  status: string;
  end_date: string | null;
};

const Exclusive = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    await fetchMembership(session.user.id);
    await fetchExclusiveProperties();
  };

  const fetchMembership = async (userId: string) => {
    const { data, error } = await supabase
      .from("memberships")
      .select("tier, status, end_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setMembership(data);
    }
  };

  const fetchExclusiveProperties = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("is_exclusive", true)
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching exclusive properties:", error);
    } else {
      setProperties(data || []);
    }
    setLoading(false);
  };

  const hasPremiumAccess = membership && 
    (membership.tier === "monthly" || membership.tier === "yearly") && 
    membership.status === "active";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(var(--real-estate-accent))]/20 to-[hsl(var(--real-estate-primary))]/20 px-4 py-2 rounded-full mb-4">
            <Crown className="h-5 w-5 text-[hsl(var(--real-estate-accent))]" />
            <span className="text-sm font-semibold">Exclusive Collection</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] bg-clip-text text-transparent">
              Ultra-Luxury Properties
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Access our most exclusive listings before anyone else
          </p>
        </div>

        {/* Membership Status Card */}
        <Card className="max-w-2xl mx-auto mb-12 border-0 shadow-xl bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[hsl(var(--real-estate-accent))]" />
              Your Membership Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!membership || membership.tier === "free" ? (
              <div className="text-center py-6">
                <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Premium Access Required</h3>
                <p className="text-muted-foreground mb-6">
                  Upgrade to view our exclusive property collection
                </p>
                <Button size="lg" onClick={() => navigate("/membership")}>
                  View Membership Plans
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] flex items-center justify-center">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold capitalize">{membership.tier} Member</h3>
                      <Badge variant={membership.status === "active" ? "default" : "secondary"} className="capitalize">
                        {membership.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {membership.end_date 
                        ? `Valid until ${new Date(membership.end_date).toLocaleDateString()}`
                        : "Active subscription"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => navigate("/membership")}>
                  Manage
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {hasPremiumAccess ? (
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              {properties.length} Exclusive {properties.length === 1 ? "Property" : "Properties"}
            </h2>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading exclusive properties...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No exclusive properties available at the moment.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <div key={property.id} className="relative">
                    <Badge className="absolute top-4 left-4 z-10 bg-[hsl(var(--real-estate-accent))] text-black border-0">
                      <Crown className="h-3 w-3 mr-1" />
                      Exclusive
                    </Badge>
                    <PropertyCard property={property} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 blur-sm pointer-events-none">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-lg">
                <div className="aspect-video bg-muted"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Exclusive;
