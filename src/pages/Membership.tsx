import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Membership = {
  id: string;
  tier: string;
  status: string;
  end_date: string | null;
};

const pricingPlans = [
  {
    name: "Free",
    tier: "free",
    price: 0,
    period: "forever",
    description: "Perfect for casual browsers",
    features: [
      "Access to standard properties",
      "Basic search filters",
      "Save favorites",
      "Email support",
    ],
  },
  {
    name: "Monthly Premium",
    tier: "monthly",
    price: 360,
    period: "month",
    description: "For serious property hunters",
    features: [
      "Everything in Free",
      "Early access to new listings",
      "Exclusive luxury properties",
      "Priority viewing slots",
      "Dedicated agent support",
      "Market insights & reports",
    ],
    popular: true,
  },
  {
    name: "Yearly Premium",
    tier: "yearly",
    price: 3640,
    period: "year",
    description: "Best value for committed buyers",
    features: [
      "Everything in Monthly",
      "Save 16% compared to monthly",
      "VIP property previews",
      "Personal concierge service",
      "Investment analysis tools",
      "Exclusive networking events",
    ],
    badge: "Best Value",
  },
];

const Membership = () => {
  const [user, setUser] = useState<any>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(false);
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
  };

  const fetchMembership = async (userId: string) => {
    const { data } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setMembership(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSubscribe = async (tier: string, price: number) => {
    if (!user) return;

    setLoading(true);

    // Calculate end date
    const endDate = new Date();
    if (tier === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (tier === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create or update membership
    const membershipData = {
      user_id: user.id,
      tier: tier as "free" | "monthly" | "yearly",
      status: "active" as "active" | "expired" | "cancelled",
      end_date: tier !== "free" ? endDate.toISOString() : null,
      auto_renew: true,
    };

    let membershipId = membership?.id;

    if (membership) {
      const { error } = await supabase
        .from("memberships")
        .update(membershipData)
        .eq("id", membership.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        setLoading(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("memberships")
        .insert(membershipData)
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        setLoading(false);
        return;
      }
      membershipId = data.id;
    }

    // Record payment
    if (price > 0) {
      await supabase.from("payments").insert({
        user_id: user.id,
        membership_id: membershipId,
        amount: price,
        payment_status: "completed",
        payment_method: "demo",
        transaction_id: `demo_${Date.now()}`,
      });
    }

    toast({
      title: "Success!",
      description: `You've subscribed to the ${tier} plan.`,
    });

    await fetchMembership(user.id);
    setLoading(false);

    if (tier !== "free") {
      navigate("/exclusive");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] bg-clip-text text-transparent">
              EstateHub
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link to="/properties" className="text-sm font-medium hover:text-primary transition-colors">All Properties</Link>
              <Link to="/exclusive" className="text-sm font-medium hover:text-primary transition-colors">Exclusive</Link>
              <Link to="/membership" className="text-sm font-medium text-primary">Membership</Link>
            </nav>
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(var(--real-estate-accent))]/20 to-[hsl(var(--real-estate-primary))]/20 px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-5 w-5 text-[hsl(var(--real-estate-accent))]" />
            <span className="text-sm font-semibold">Premium Access</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] bg-clip-text text-transparent">
              Choose Your Plan
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get exclusive access to luxury properties and premium features
          </p>
        </div>

        {/* Current Membership Status */}
        {membership && (
          <Card className="max-w-2xl mx-auto mb-12 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Current Membership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold capitalize">{membership.tier} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {membership.end_date
                      ? `Valid until ${new Date(membership.end_date).toLocaleDateString()}`
                      : "Active"}
                  </p>
                </div>
                <Badge variant={membership.status === "active" ? "default" : "secondary"} className="capitalize">
                  {membership.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.tier}
              className={`relative overflow-hidden border-0 shadow-xl ${
                plan.popular
                  ? "ring-2 ring-[hsl(var(--real-estate-primary))] scale-105"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] text-white text-center py-1 text-sm font-semibold">
                  Most Popular
                </div>
              )}
              {plan.badge && !plan.popular && (
                <Badge className="absolute top-4 right-4 bg-[hsl(var(--real-estate-accent))] text-black border-0">
                  {plan.badge}
                </Badge>
              )}
              
              <CardHeader className={plan.popular ? "pt-12" : ""}>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">QAR {plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-[hsl(var(--real-estate-secondary))] shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className="w-full"
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.tier, plan.price)}
                  disabled={loading || membership?.tier === plan.tier}
                >
                  {membership?.tier === plan.tier
                    ? "Current Plan"
                    : plan.tier === "free"
                    ? "Get Started"
                    : "Subscribe Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          * This is a demo payment system. In production, this would integrate with Stripe or similar payment processors.
        </p>
      </div>
    </div>
  );
};

export default Membership;
