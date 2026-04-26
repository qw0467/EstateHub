import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentModal from "@/components/PaymentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
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
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; tier: string; price: number; name: string }>({
    open: false, tier: "", price: 0, name: "",
  });
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
    if (data) setMembership(data);
  };

  const handleSubscribeClick = (tier: string, price: number, name: string) => {
    if (tier === "free") {
      activateMembership(tier, price);
      return;
    }
    setPaymentModal({ open: true, tier, price, name });
  };

  const activateMembership = async (tier: string, price: number) => {
    if (!user) return;
    setLoading(true);

    const endDate = new Date();
    if (tier === "monthly") endDate.setMonth(endDate.getMonth() + 1);
    else if (tier === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);

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
        toast({ variant: "destructive", title: "Error", description: error.message });
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
        toast({ variant: "destructive", title: "Error", description: error.message });
        setLoading(false);
        return;
      }
      membershipId = data.id;
    }

    if (price > 0) {
      await supabase.from("payments").insert({
        user_id: user.id,
        membership_id: membershipId,
        amount: price,
        payment_status: "completed",
        payment_method: "card",
        transaction_id: `txn_${Date.now()}`,
      });
    }

    toast({ title: "Welcome!", description: `Your ${tier} membership is now active.` });
    await fetchMembership(user.id);
    setLoading(false);

    if (tier !== "free") navigate("/exclusive");
  };

  const formatPrice = (price: number) =>
    price === 0 ? "Free" : `QAR ${price % 1 === 0 ? price : price.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
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

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.tier}
              className={`relative overflow-hidden border-0 shadow-xl ${
                plan.popular ? "ring-2 ring-[hsl(var(--real-estate-primary))] scale-105" : ""
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
                  {plan.price === 0 ? (
                    <span className="text-4xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">QAR {plan.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </>
                  )}
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
                  onClick={() => handleSubscribeClick(plan.tier, plan.price, plan.name)}
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

        <p className="text-center text-xs text-muted-foreground mt-12">
          Payments are processed securely. Prices shown are for demonstration purposes.
        </p>
      </div>

      <Footer />

      <PaymentModal
        open={paymentModal.open}
        onClose={() => setPaymentModal((p) => ({ ...p, open: false }))}
        onSuccess={() => activateMembership(paymentModal.tier, paymentModal.price)}
        planName={paymentModal.name}
        price={paymentModal.price}
      />
    </div>
  );
};

export default Membership;
