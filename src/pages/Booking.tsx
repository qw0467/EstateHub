import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Calendar } from "lucide-react";

type Property = {
  id: string;
  title: string;
  price: number;
  address: string;
  image_url: string | null;
};

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [user, setUser] = useState<any>(null);

  const bookingType = searchParams.get("type") === "purchase" ? "purchase" : "viewing";

  useEffect(() => {
    checkAuth();
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUser(session.user);
    }
  };

  const fetchProperty = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, price, address, image_url")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load property details",
      });
      navigate("/properties");
    } else {
      setProperty(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !property) return;

    setSubmitting(true);

    const { error } = await supabase.from("bookings").insert({
      property_id: property.id,
      user_id: user.id,
      payment_amount: property.price,
      notes: notes || null,
      status: bookingType === "purchase" ? "pending" : "confirmed",
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success!",
        description: `Your ${bookingType} request has been submitted.`,
      });
      navigate("/properties");
    }
    setSubmitting(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-QA", {
      style: "currency",
      currency: "QAR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Property Summary */}
            <Card className="border-0 shadow-xl h-fit">
              <CardHeader>
                <CardTitle>Property Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={property.image_url || ""}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{property.title}</h3>
                  <p className="text-muted-foreground text-sm">{property.address}</p>
                  <p className="text-2xl font-bold text-primary mt-2">
                    {formatPrice(property.price)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Booking Form */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {bookingType === "purchase" ? (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Make an Offer
                    </>
                  ) : (
                    <>
                      <Calendar className="h-5 w-5" />
                      Schedule Viewing
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">
                      {bookingType === "purchase" ? "Offer Details" : "Additional Notes"}
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder={
                        bookingType === "purchase"
                          ? "Enter your offer amount and any conditions..."
                          : "Preferred viewing time, questions, etc..."
                      }
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={5}
                    />
                  </div>

                  {bookingType === "purchase" && (
                    <div className="bg-accent p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> This is a preliminary offer request. Our team will
                        review and contact you to proceed with the purchase process.
                      </p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                    {submitting
                      ? "Submitting..."
                      : bookingType === "purchase"
                      ? "Submit Offer"
                      : "Request Viewing"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
