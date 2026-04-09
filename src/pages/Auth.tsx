import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, ArrowLeft } from "lucide-react";

const TC_CONTENT = `
1. Acceptance of Terms
By creating an account on EstateHub, you agree to be bound by these Terms and Conditions in full. If you do not agree to these Terms, you must not register or use the Platform. Your continued use of EstateHub constitutes ongoing acceptance of any amendments.

2. About EstateHub
EstateHub is an online real estate marketplace connecting property seekers with available listings. We provide tools including property searches, booking requests, membership benefits, market insights, and agent support. EstateHub does not act as a real estate agent, broker, or legal adviser. All transactions remain solely between the parties involved.

3. Eligibility
You must be at least 18 years of age to create an account. By registering, you confirm all information provided is accurate, current, and complete. You are responsible for maintaining the confidentiality of your credentials.

4. User Accounts
You are responsible for:
  • Maintaining the security and confidentiality of your password
  • All activity that occurs under your account
  • Notifying us immediately at support@estatehub.com of any unauthorised access
  • Keeping your account information accurate and up to date

EstateHub reserves the right to suspend or terminate accounts that violate these Terms or are suspected of fraudulent activity.

5. Membership Plans
EstateHub offers free and paid membership tiers (Monthly and Yearly). Paid memberships grant access to additional features including priority bookings, VIP property previews, concierge services, market insights, and exclusive events.
  • Monthly memberships renew automatically each month unless cancelled before the renewal date.
  • Yearly memberships renew annually unless cancelled at least 7 days before renewal.
  • Membership fees are non-refundable except where required by applicable law.
  • We reserve the right to change pricing with 30 days' notice.

6. Property Listings
While we make reasonable efforts to ensure accuracy, we do not warrant that listing information is complete or error-free. You should independently verify all material facts before making any property-related decision. EstateHub reserves the right to remove or modify listings at any time.

7. Booking Requests
Booking requests submitted through EstateHub are expressions of interest only and do not constitute a legally binding reservation or agreement to purchase or rent a property.

8. Prohibited Conduct
You agree not to:
  • Use the Platform for any unlawful, fraudulent, or harmful purpose
  • Impersonate any person or entity
  • Submit false, misleading, or inaccurate information
  • Attempt to gain unauthorised access to the Platform or its systems
  • Scrape, harvest, or collect data without written consent
  • Use automated tools or bots to interact with the Platform
  • Circumvent any access controls or membership restrictions

9. Intellectual Property
All content on EstateHub — including text, images, logos, design, data, and software — is the property of EstateHub or its licensors and is protected by applicable intellectual property laws.

10. Privacy & Data Protection
Your use of EstateHub is governed by our Privacy Policy, incorporated into these Terms by reference. We handle all data in accordance with applicable data protection laws, including GDPR where applicable.

11. Disclaimers & Limitation of Liability
EstateHub is provided on an "as is" and "as available" basis. To the fullest extent permitted by law, we disclaim all warranties, express or implied. In no event shall EstateHub be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.

12. Governing Law
These Terms are governed by and construed in accordance with the laws of England and Wales. Disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.

13. Changes to These Terms
We may revise these Terms at any time. We will update the "Last updated" date and, where appropriate, notify registered users by email. Continued use constitutes acceptance.

14. Contact Us
Questions about these Terms? Contact us at support@estatehub.com or visit our Contact Us page.
`.trim();

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [tcScrolled, setTcScrolled] = useState(false);
  const [tcAgreed, setTcAgreed] = useState(false);
  const tcRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/properties");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/properties");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleTcScroll = () => {
    const el = tcRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 8;
    if (atBottom) setTcScrolled(true);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tcAgreed) {
      toast({ variant: "destructive", title: "Terms not accepted", description: "Please scroll through and accept the Terms & Conditions to continue." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/properties`,
      },
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Account created!", description: "Welcome to EstateHub. You can now sign in." });
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Welcome back!", description: "You have successfully signed in." });
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setForgotSent(true);
    }
    setForgotLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--real-estate-primary))] via-[hsl(var(--primary))] to-[hsl(var(--real-estate-secondary))] flex flex-col items-center justify-center p-4 gap-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Home className="h-5 w-5 text-primary" />
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] bg-clip-text text-transparent">
              EstateHub
            </CardTitle>
          </div>
          <CardDescription>
            {showForgot ? "Reset your password" : "Sign in to access your account"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {showForgot ? (
            <div className="space-y-4">
              {forgotSent ? (
                <div className="text-center space-y-3">
                  <div className="text-4xl">📬</div>
                  <p className="font-medium">Check your inbox</p>
                  <p className="text-sm text-muted-foreground">
                    We've sent a password reset link to <strong>{forgotEmail}</strong>. Click the link in the email to set a new password.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter the email address linked to your EstateHub account and we'll send you a reset link.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email Address</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={forgotLoading}>
                    {forgotLoading ? "Sending…" : "Send Reset Link"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgot(false)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sign In
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Terms & Conditions</Label>
                      {!tcScrolled && (
                        <span className="text-xs text-muted-foreground">Scroll to read all</span>
                      )}
                    </div>
                    <div
                      ref={tcRef}
                      onScroll={handleTcScroll}
                      className="h-36 overflow-y-auto rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-line leading-relaxed"
                    >
                      {TC_CONTENT}
                      <p className="mt-3">
                        Read the full Terms & Conditions at{" "}
                        <Link to="/terms" target="_blank" className="text-primary underline">
                          estatehub.com/terms
                        </Link>
                        .
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 ${!tcScrolled ? "opacity-40 pointer-events-none" : ""}`}>
                      <Checkbox
                        id="tc-agree"
                        checked={tcAgreed}
                        onCheckedChange={(v) => setTcAgreed(!!v)}
                        disabled={!tcScrolled}
                      />
                      <label htmlFor="tc-agree" className="text-sm cursor-pointer select-none">
                        I have read and agree to the{" "}
                        <Link to="/terms" target="_blank" className="text-primary underline">
                          Terms & Conditions
                        </Link>
                      </label>
                    </div>
                    {!tcScrolled && (
                      <p className="text-xs text-amber-600">Please scroll through the Terms & Conditions above before accepting.</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || !tcAgreed}>
                    {loading ? "Creating account…" : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <p className="text-white/60 text-xs text-center">
        By using EstateHub you agree to our{" "}
        <Link to="/terms" className="underline hover:text-white">Terms & Conditions</Link>
      </p>
    </div>
  );
};

export default Auth;
