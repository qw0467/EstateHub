import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Shield, Users, ArrowRight, Lock, Crown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "@/components/PropertyCard";

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
  is_exclusive: boolean;
};

type Membership = {
  tier: string;
  status: string;
  end_date: string | null;
};

const Index = () => {
  const [exclusiveProperties, setExclusiveProperties] = useState<Property[]>([]);
  const [user, setUser] = useState<any>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchExclusiveProperties();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      await fetchMembership(session.user.id);
    }
  };

  const fetchMembership = async (userId: string) => {
    const { data } = await supabase
      .from("memberships")
      .select("tier, status, end_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setMembership(data);
    }
  };

  const fetchExclusiveProperties = async () => {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "available")
      .eq("is_exclusive", true)
      .order("created_at", { ascending: false })
      .limit(3);

    if (data) {
      setExclusiveProperties(data);
    }
  };

  const hasPremiumAccess = membership && 
    (membership.tier === "monthly" || membership.tier === "yearly") && 
    membership.status === "active";

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--real-estate-primary))] via-[hsl(var(--primary))] to-[hsl(var(--real-estate-secondary))] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZ2LTZoNnYxMnptNiAwdi02aDZ2Nmg2djZoLTZ2Nmg2djZoLTZ2Nmg2djZoLTZ2Nmg2djZoLTZ2Nmg2djZoLTZ2Nmg2djZoLTZ2Nmg2djZoLTZ2Nmg2djZoLTZ2Nmg2djZoLTYiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Find Your Dream Home Today
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-white/90">
              Discover the perfect property from our curated collection of premium listings
            </p>

            {/* Search Bar */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl max-w-3xl mx-auto">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Enter location, neighborhood, or address"
                      className="pl-12 h-12 border-0 bg-secondary/50"
                    />
                  </div>
                  <Link to="/properties">
                    <Button size="lg" className="w-full md:w-auto h-12 px-8 shadow-lg hover:shadow-xl transition-shadow">
                      Search Properties
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
              <div>
                <div className="text-4xl font-bold mb-1">10K+</div>
                <div className="text-white/80 text-sm">Properties</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-1">5K+</div>
                <div className="text-white/80 text-sm">Happy Clients</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-1">500+</div>
                <div className="text-white/80 text-sm">Expert Agents</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Exclusive Properties Section */}
      {exclusiveProperties.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-background to-accent/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(var(--real-estate-accent))]/20 to-[hsl(var(--real-estate-primary))]/20 px-4 py-2 rounded-full mb-4">
                <Crown className="h-5 w-5 text-[hsl(var(--real-estate-accent))]" />
                <span className="text-sm font-semibold">Exclusive Collection</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] bg-clip-text text-transparent">
                  Ultra-Luxury Properties
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {hasPremiumAccess 
                  ? "Your exclusive access to premium listings" 
                  : "Unlock these exclusive properties with premium membership"}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {exclusiveProperties.map((property) => (
                <div key={property.id} className="relative">
                  {!hasPremiumAccess && (
                    <div 
                      className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-black/50 transition-colors" 
                      onClick={() => navigate("/membership")}
                    >
                      <div className="bg-white rounded-full p-4 shadow-xl">
                        <Lock className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-white font-semibold mb-1">Premium Access Required</p>
                        <p className="text-white/90 text-sm">Click to unlock</p>
                      </div>
                    </div>
                  )}
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              {hasPremiumAccess ? (
                <Link to="/exclusive">
                  <Button size="lg" variant="outline">
                    View All Exclusive Properties
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link to="/membership">
                  <Button size="lg" className="shadow-xl">
                    <Crown className="mr-2 h-5 w-5" />
                    Unlock Premium Access
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-accent/50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose EstateHub?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We make finding and buying your dream property simple and stress-free
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Market Insights</h3>
                <p className="text-muted-foreground">
                  Get real-time market data and trends to make informed decisions
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure Transactions</h3>
                <p className="text-muted-foreground">
                  Your transactions are protected with bank-level security
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Expert Support</h3>
                <p className="text-muted-foreground">
                  Professional agents available 24/7 to guide you
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDMwdi02aDZ2Nmg2djZoLTZ2Nmg2djZoLTZ2Nmg2djZoLTZ2Nmg2djZoLTZ2Nmg2djZoLTZ2Nmg2di02aC02di02aDZ2LTZoLTZ2LTZoNnYtNmgtNnYtNmg2di02aC02di02aDZ2LTZoLTZ2LTZoNnYtNmgtNnYtNmg2di02aC02di02aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Find Your Perfect Home?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Browse thousands of properties and connect with expert agents today
            </p>
            <Link to="/properties">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg shadow-2xl hover:shadow-xl transition-all">
                Explore Properties
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
