import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Calendar as CalendarIcon, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const totalMins = 9 * 60 + i * 30;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const label = `${h % 12 === 0 ? 12 : h % 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  const value = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  return { label, value, h, m };
});

type Property = {
  id: string;
  title: string;
  price: number;
  address: string;
  image_url: string | null;
};

type BookingRecord = {
  booking_date: string;
  status: string;
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
  const [viewingDate, setViewingDate] = useState<Date | undefined>();
  const [viewingDateOpen, setViewingDateOpen] = useState(false);
  const [viewingTime, setViewingTime] = useState("");
  const [existingBookings, setExistingBookings] = useState<BookingRecord[]>([]);

  const bookingType = searchParams.get("type") === "purchase" ? "purchase" : "viewing";

  useEffect(() => {
    checkAuth();
    if (id) {
      fetchProperty();
      fetchExistingBookings();
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

  const fetchExistingBookings = async () => {
    const { data } = await supabase
      .rpc("get_property_booked_slots", { p_property_id: id });
    if (data) setExistingBookings(data as BookingRecord[]);
  };

  const slotStates = useMemo(() => {
    const now = new Date();
    return TIME_SLOTS.map((slot) => {
      if (!viewingDate) return { ...slot, state: "available" as const };

      const slotTime = new Date(
        viewingDate.getFullYear(),
        viewingDate.getMonth(),
        viewingDate.getDate(),
        slot.h,
        slot.m,
      );

      const isPast = slotTime <= now;

      const isBooked = existingBookings.some((b) => {
        const bDate = new Date(b.booking_date);
        return (
          isSameDay(bDate, viewingDate) &&
          bDate.getHours() === slot.h &&
          bDate.getMinutes() === slot.m
        );
      });

      if (isBooked) return { ...slot, state: "booked" as const };
      if (isPast) return { ...slot, state: "past" as const };
      return { ...slot, state: "available" as const };
    });
  }, [viewingDate, existingBookings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !property) return;
    if (bookingType === "viewing" && !viewingDate) {
      toast({
        variant: "destructive",
        title: "Select a viewing date",
        description: "Please choose a date from the calendar before submitting your request.",
      });
      return;
    }
    if (bookingType === "viewing" && !viewingTime) {
      toast({
        variant: "destructive",
        title: "Select a viewing time",
        description: "Please choose a time slot before submitting your request.",
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("bookings").insert({
      property_id: property.id,
      user_id: user.id,
      payment_amount: property.price,
      notes: [
        notes || null,
        viewingDate ? `Viewing date: ${format(viewingDate, "PPP")}` : null,
        viewingTime ? `Viewing time: ${viewingTime}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      booking_date: viewingDate
        ? new Date(
            viewingDate.getFullYear(),
            viewingDate.getMonth(),
            viewingDate.getDate(),
            Number(viewingTime.split(":")[0] || 0),
            Number(viewingTime.split(":")[1] || 0),
          ).toISOString()
        : new Date().toISOString(),
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
      navigate("/profile");
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
                      <CalendarIcon className="h-5 w-5" />
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

                  {bookingType === "viewing" && (
                    <div className="space-y-3">
                      <Label>Viewing Date</Label>
                      <Popover open={viewingDateOpen} onOpenChange={setViewingDateOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start font-normal">
                            {viewingDate ? format(viewingDate, "PPP") : "Select a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={viewingDate}
                            onSelect={(date) => {
                              setViewingDate(date);
                              setViewingTime("");
                              setViewingDateOpen(false);
                            }}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-1.5">
                            <Clock3 className="h-4 w-4" />
                            Viewing Time
                          </Label>
                          {viewingDate && (
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted border" />
                                Past
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-300" />
                                Booked
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary" />
                                Selected
                              </span>
                            </div>
                          )}
                        </div>

                        {!viewingDate ? (
                          <p className="text-sm text-muted-foreground py-2">
                            Select a date first to see available times.
                          </p>
                        ) : (
                          <div className="grid grid-cols-3 gap-1.5">
                            {slotStates.map((slot) => {
                              const isPast = slot.state === "past";
                              const isBooked = slot.state === "booked";
                              const isSelected = viewingTime === slot.value;
                              return (
                                <button
                                  key={slot.value}
                                  type="button"
                                  disabled={isPast || isBooked}
                                  onClick={() => setViewingTime(slot.value)}
                                  className={cn(
                                    "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                                    isSelected &&
                                      "bg-primary text-primary-foreground border-primary",
                                    !isSelected &&
                                      !isPast &&
                                      !isBooked &&
                                      "hover:bg-accent hover:border-primary/40 cursor-pointer",
                                    isPast &&
                                      "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-60",
                                    isBooked &&
                                      "bg-red-50 text-red-400 border-red-200 cursor-not-allowed",
                                  )}
                                >
                                  {slot.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                      rows={4}
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
