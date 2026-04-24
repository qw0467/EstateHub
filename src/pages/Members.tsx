import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Crown,
  Star,
  TrendingUp,
  Headphones,
  Eye,
  CalendarDays,
  BarChart3,
  Users,
  Lock,
  Sparkles,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ArrowRight,
  CheckCircle2,
  Clock,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type PropertyItem = {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  image_url: string | null;
  listed_at: string | null;
  is_vip_preview: boolean | null;
};

type ConciergeBooking = {
  id: string;
  property_id: string | null;
  scheduled_at: string;
  notes: string | null;
  status: string | null;
  created_at: string;
  properties?: { title: string } | null;
};

type ViewingItem = {
  id: string;
  booking_date: string;
  status: string | null;
  notes: string | null;
  properties?: {
    id: string;
    title: string;
    city: string;
    address: string;
    state: string;
  } | null;
};

type PropertyChoice = PropertyItem & {
  source: "market" | "appointment";
};

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  max_attendees: number | null;
};

type MarketData = {
  city: string;
  count: number;
  median_price: number;
  avg_price_per_sqft: number;
};

const formatQAR = (amount: number) =>
  new Intl.NumberFormat("en-QA", {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const UpgradeWall = ({ feature }: { feature: string }) => {
  const navigate = useNavigate();
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="py-16 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--real-estate-accent))]/20 to-[hsl(var(--real-estate-primary))]/20 flex items-center justify-center">
          <Lock className="h-8 w-8 text-[hsl(var(--real-estate-accent))]" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Yearly Membership Required</h3>
          <p className="text-muted-foreground max-w-sm">
            {feature} is available exclusively for Yearly Premium members. Upgrade your plan to unlock this feature.
          </p>
        </div>
        <Button onClick={() => navigate("/membership")} className="mt-2">
          Upgrade to Yearly
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

const PropertyMiniCard = ({ property }: { property: PropertyItem }) => (
  <Link to={`/property/${property.id}`}>
    <Card className="border-0 shadow-md hover:shadow-xl transition-shadow overflow-hidden">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={property.image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&auto=format&fit=crop"}
          alt={property.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <Badge className="absolute top-2 left-2 bg-[hsl(var(--real-estate-accent))] text-black border-0 text-xs capitalize">
          {property.property_type}
        </Badge>
      </div>
      <CardContent className="p-4">
        <p className="font-semibold text-sm truncate">{property.title}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <MapPin className="h-3 w-3" />
          {property.city}, {property.state}
        </p>
        <p className="text-primary font-bold mt-1 text-sm">{formatQAR(property.price)}</p>
        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5"><Bed className="h-3 w-3" /> {property.bedrooms}</span>
          <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" /> {property.bathrooms}</span>
          <span className="flex items-center gap-0.5"><Maximize className="h-3 w-3" /> {property.sqft.toLocaleString()} sqft</span>
        </div>
      </CardContent>
    </Card>
  </Link>
);

const Members = () => {
  const { user, membership, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [allProperties, setAllProperties] = useState<PropertyItem[]>([]);
  const [newListings, setNewListings] = useState<PropertyItem[]>([]);
  const [vipProperties, setVipProperties] = useState<PropertyItem[]>([]);
  const [conciergeBookings, setConciergeBookings] = useState<ConciergeBooking[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [dataLoading, setDataLoading] = useState(true);
  const [viewings, setViewings] = useState<ViewingItem[]>([]);

  const [supportName, setSupportName] = useState("");
  const [supportQuery, setSupportQuery] = useState("");
  const [supportContact, setSupportContact] = useState("email");
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  const [conciergePropertyId, setConciergePropertyId] = useState("");
  const [conciergePickerOpen, setConciergePickerOpen] = useState(false);
  const [conciergeDate, setConciergeDate] = useState("");
  const [conciergeNotes, setConciergeNotes] = useState("");
  const [conciergeSubmitting, setConciergeSubmitting] = useState(false);

  const [analysisMode, setAnalysisMode] = useState<"property" | "area">("property");
  const [analysisPropertyId, setAnalysisPropertyId] = useState("");
  const [analysisCity, setAnalysisCity] = useState("");
  const [eventRegistering, setEventRegistering] = useState<string | null>(null);

  const isActive = membership?.status === "active";
  const isMonthly = isActive && (membership?.tier === "monthly" || membership?.tier === "yearly");
  const isYearly = isActive && membership?.tier === "yearly";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!isActive || membership?.tier === "free") {
      navigate("/membership");
      return;
    }
    loadData();
  }, [authLoading, user, membership]);

  const loadData = async () => {
    setDataLoading(true);
    await Promise.all([
      fetchAllProperties(),
      fetchEvents(),
      fetchRegistrations(),
      fetchConciergeBookings(),
      fetchViewings(),
    ]);
    setDataLoading(false);
  };

  const fetchAllProperties = async () => {
    const { data } = await supabase
      .from("properties")
      .select("id, title, price, address, city, state, sqft, bedrooms, bathrooms, property_type, image_url, listed_at, is_vip_preview")
      .eq("status", "available")
      .order("listed_at", { ascending: false });

    const props = (data || []) as PropertyItem[];
    setAllProperties(props);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    setNewListings(props.filter((p) => p.listed_at && p.listed_at >= sevenDaysAgo));
    setVipProperties(props.filter((p) => p.is_vip_preview));
  };

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, description, location, event_date, max_attendees")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true });
    setEvents((data || []) as EventItem[]);
  };

  const fetchRegistrations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("event_registrations")
      .select("event_id")
      .eq("user_id", user.id);
    setRegisteredEventIds(new Set((data || []).map((r: { event_id: string }) => r.event_id)));
  };

  const fetchConciergeBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("concierge_bookings")
      .select("id, property_id, scheduled_at, notes, status, created_at, properties(title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setConciergeBookings((data as ConciergeBooking[]) || []);
  };

  const fetchViewings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookings")
      .select("id, booking_date, status, notes, properties(id, title, city, address, state)")
      .eq("user_id", user.id)
      .order("booking_date", { ascending: false });
    setViewings((data as ViewingItem[]) || []);
  };

  const cities = useMemo(() => [...new Set(allProperties.map((p) => p.city))].sort(), [allProperties]);

  const bookedProperties = useMemo(() => {
    const seen = new Set<string>();
    return viewings
      .map((v) => v.properties)
      .filter((p): p is NonNullable<ViewingItem["properties"]> => !!p)
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .map((p) => ({
        ...allProperties.find((item) => item.id === p.id),
        id: p.id,
        title: p.title,
        city: p.city,
        address: p.address,
        state: p.state,
        price: allProperties.find((item) => item.id === p.id)?.price ?? 0,
        sqft: allProperties.find((item) => item.id === p.id)?.sqft ?? 0,
        bedrooms: allProperties.find((item) => item.id === p.id)?.bedrooms ?? 0,
        bathrooms: allProperties.find((item) => item.id === p.id)?.bathrooms ?? 0,
        property_type: allProperties.find((item) => item.id === p.id)?.property_type ?? "house",
        image_url: allProperties.find((item) => item.id === p.id)?.image_url ?? null,
        listed_at: allProperties.find((item) => item.id === p.id)?.listed_at ?? null,
        is_vip_preview: allProperties.find((item) => item.id === p.id)?.is_vip_preview ?? null,
        source: "appointment" as const,
      })) as PropertyChoice[];
  }, [viewings, allProperties]);

  const propertyChoices = useMemo(() => {
    const marketChoices = allProperties.map((p) => ({ ...p, source: "market" as const }));
    const combined = [...marketChoices];
    for (const booked of bookedProperties) {
      if (!combined.some((p) => p.id === booked.id)) combined.push(booked);
    }
    return combined;
  }, [allProperties, bookedProperties]);

  const marketData: MarketData[] = useMemo(() => {
    const byCity: Record<string, { prices: number[]; price_per_sqfts: number[] }> = {};
    for (const p of allProperties) {
      if (!byCity[p.city]) byCity[p.city] = { prices: [], price_per_sqfts: [] };
      byCity[p.city].prices.push(p.price);
      byCity[p.city].price_per_sqfts.push(p.price / p.sqft);
    }
    return Object.entries(byCity)
      .map(([city, v]) => ({
        city,
        count: v.prices.length,
        median_price: Math.round(median(v.prices)),
        avg_price_per_sqft: Math.round(
          v.price_per_sqfts.reduce((s, x) => s + x, 0) / v.price_per_sqfts.length
        ),
      }))
      .sort((a, b) => b.median_price - a.median_price)
      .slice(0, 10);
  }, [allProperties]);

  const analysisProperty = useMemo(
    () => propertyChoices.find((p) => p.id === analysisPropertyId) ?? null,
    [analysisPropertyId, propertyChoices]
  );

  const analysisResults = useMemo(() => {
    const targetCity = analysisMode === "area" ? analysisCity : analysisProperty?.city;
    if (!targetCity && !analysisProperty) return null;

    const areaProperties = allProperties.filter((p) => p.city === targetCity);
    if (areaProperties.length === 0) return null;

    const subject = analysisProperty ?? null;
    const medianPrice = median(areaProperties.map((p) => p.price));
    const medianPricePerSqft = median(areaProperties.map((p) => p.price / p.sqft));

    const RENT_RATE = 7;   // QAR per sqft per month (Qatar market rate)
    const MAX_YIELD = 0.07; // cap at 7% annual yield to avoid outlier sqft inflating estimates
    const priceForYield = subject?.price ?? medianPrice;
    const capRent = Math.round(priceForYield * MAX_YIELD / 12);
    const sqftRent = subject
      ? Math.round(subject.sqft * RENT_RATE)
      : Math.round(median(areaProperties.map((p) => p.sqft)) * RENT_RATE);
    const estimatedMonthlyRent = Math.min(sqftRent, capRent);
    const grossYield = ((estimatedMonthlyRent * 12) / priceForYield) * 100;

    const comparables = subject
      ? allProperties.filter(
          (p) =>
            p.id !== subject.id &&
            p.price >= subject.price * 0.85 &&
            p.price <= subject.price * 1.15
        )
      : [];

    const subjectPricePerSqft = subject ? subject.price / subject.sqft : null;
    const valueVsMarket = subjectPricePerSqft
      ? ((subjectPricePerSqft - medianPricePerSqft) / medianPricePerSqft) * 100
      : null;

    const priceHistory = areaProperties
      .filter((p) => p.listed_at)
      .sort((a, b) => new Date(a.listed_at!).getTime() - new Date(b.listed_at!).getTime())
      .map((p) => ({
        date: new Date(p.listed_at!).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        }),
        price_per_sqft: Math.round(p.price / p.sqft),
        listed_at: p.listed_at,
      }));

    return {
      targetCity,
      areaProperties,
      medianPrice,
      medianPricePerSqft,
      estimatedMonthlyRent,
      grossYield,
      comparables,
      subjectPricePerSqft,
      valueVsMarket,
      priceHistory,
    };
  }, [analysisMode, analysisProperty, analysisCity, allProperties]);

  const vipVanSuggestion = useMemo(() => {
    const upcomingViewing = viewings.find((b) => b.status !== "cancelled");
    if (!upcomingViewing) return null;
    const viewingProperty = upcomingViewing.properties;
    if (!viewingProperty) return null;
    return {
      title: `VIP Van to ${viewingProperty.title}`,
      scheduledFor: new Date(upcomingViewing.booking_date).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      location: `${viewingProperty.address}, ${viewingProperty.city}, ${viewingProperty.state}`,
    };
  }, [viewings]);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSupportSubmitting(true);
    const { error } = await supabase.from("support_requests").insert({
      user_id: user.id,
      full_name: supportName,
      query: supportQuery,
      contact_method: supportContact,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Request submitted!", description: "Our agent team will contact you shortly." });
      setSupportName("");
      setSupportQuery("");
      setSupportContact("email");
    }
    setSupportSubmitting(false);
  };

  const handleConciergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !conciergeDate) return;
    setConciergeSubmitting(true);
    const { error } = await supabase.from("concierge_bookings").insert({
      user_id: user.id,
      property_id: conciergePropertyId || null,
      scheduled_at: new Date(conciergeDate).toISOString(),
      notes: conciergeNotes || null,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Concierge session booked!", description: "We will confirm your appointment shortly." });
      setConciergePropertyId("");
      setConciergeDate("");
      setConciergeNotes("");
      await fetchConciergeBookings();
    }
    setConciergeSubmitting(false);
  };

  const handleEventRegister = async (eventId: string) => {
    if (!user) return;
    setEventRegistering(eventId);
    if (registeredEventIds.has(eventId)) {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);
      if (!error) {
        setRegisteredEventIds((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        toast({ title: "Registration cancelled" });
      }
    } else {
      const { error } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        user_id: user.id,
      });
      if (!error) {
        setRegisteredEventIds((prev) => new Set([...prev, eventId]));
        toast({ title: "Registered!", description: "You're on the list for this event." });
      } else {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    }
    setEventRegistering(null);
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground animate-pulse">Loading your member portal...</p>
        </div>
      </div>
    );
  }

  const tierLabel = membership?.tier === "yearly" ? "Yearly Premium" : "Monthly Premium";
  const tierColor =
    membership?.tier === "yearly"
      ? "bg-gradient-to-r from-[hsl(var(--real-estate-accent))] to-amber-400 text-black"
      : "bg-gradient-to-r from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] text-white";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Member Portal</h1>
                <p className="text-muted-foreground text-sm">Your exclusive benefits &amp; tools</p>
              </div>
            </div>
            <Badge className={`${tierColor} border-0 px-4 py-2 text-sm font-semibold`}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              {tierLabel}
            </Badge>
          </div>
          {membership?.end_date && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Membership valid until{" "}
              {new Date(membership.end_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <Tabs defaultValue="new-listings" className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex h-auto gap-1 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="new-listings" className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-lg">
                <Star className="h-4 w-4" />
                New This Week
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-lg">
                <BarChart3 className="h-4 w-4" />
                Market Insights
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-lg">
                <Headphones className="h-4 w-4" />
                Agent Support
              </TabsTrigger>
              <TabsTrigger value="vip" className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-lg">
                <Eye className="h-4 w-4" />
                VIP Previews
              </TabsTrigger>
              <TabsTrigger value="concierge" className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-lg">
                <Crown className="h-4 w-4" />
                Concierge
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-lg">
                <TrendingUp className="h-4 w-4" />
                Investment
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-lg">
                <Users className="h-4 w-4" />
                Events
              </TabsTrigger>
            </TabsList>
          </div>

          {/* NEW THIS WEEK */}
          <TabsContent value="new-listings" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-[hsl(var(--real-estate-accent))]" />
                New This Week
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Early access to listings added in the past 7 days — visible to members before they appear on the public search.
              </p>
            </div>
            {newListings.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                  <p className="text-muted-foreground font-medium">No new listings this week</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check back soon — new properties are added regularly.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate("/properties")}>
                    Browse All Properties
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {newListings.map((property) => (
                  <div key={property.id} className="relative">
                    <Badge className="absolute top-3 left-3 z-10 bg-green-500 text-white border-0 text-xs">
                      New
                    </Badge>
                    <PropertyMiniCard property={property} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* MARKET INSIGHTS */}
          <TabsContent value="insights" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[hsl(var(--real-estate-primary))]" />
                Market Insights
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Area-level price trends — median price, price-per-sqft, and listing volume by city.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Listings</p>
                  <p className="text-3xl font-bold mt-1">{allProperties.length}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Overall Median Price</p>
                  <p className="text-3xl font-bold mt-1">
                    {allProperties.length > 0 ? formatQAR(median(allProperties.map((p) => p.price))) : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Markets Covered</p>
                  <p className="text-3xl font-bold mt-1">{marketData.length}</p>
                </CardContent>
              </Card>
            </div>

            {marketData.length > 0 ? (
              <>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Median Listing Price by City</CardTitle>
                    <CardDescription className="text-xs">True statistical median — not skewed by outliers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={marketData} margin={{ top: 4, right: 16, bottom: 40, left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="city"
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                        />
                        <Tooltip
                          formatter={(v: number) => [formatQAR(v), "Median Price"]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                          }}
                        />
                        <Bar dataKey="median_price" fill="hsl(var(--real-estate-primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Avg Price per sqft by City</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={marketData} margin={{ top: 4, right: 16, bottom: 40, left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="city"
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          tickFormatter={(v) => `QAR ${v}`}
                        />
                        <Tooltip
                          formatter={(v: number) => [`QAR ${v.toLocaleString()}`, "Avg/sqft"]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                          }}
                        />
                        <Bar dataKey="avg_price_per_sqft" fill="hsl(var(--real-estate-secondary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base">City Summary</CardTitle>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">City</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Listings</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Median Price</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Avg / sqft</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketData.map((row) => (
                          <tr key={row.city} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 font-medium">{row.city}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{row.count}</td>
                            <td className="px-4 py-3 text-right">{formatQAR(row.median_price)}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              QAR {row.avg_price_per_sqft.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No market data available yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AGENT SUPPORT */}
          <TabsContent value="support" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Headphones className="h-5 w-5 text-[hsl(var(--real-estate-secondary))]" />
                Agent Support
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Submit a request and a dedicated agent will reach out to assist you personally.
              </p>
            </div>
            <Card className="border-0 shadow-sm max-w-2xl">
              <CardContent className="pt-6">
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="support-name">Your Name</Label>
                    <Input
                      id="support-name"
                      placeholder="Full name"
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-query">How can we help?</Label>
                    <Textarea
                      id="support-query"
                      placeholder="Describe your property search goals, questions, or any specific requirements..."
                      value={supportQuery}
                      onChange={(e) => setSupportQuery(e.target.value)}
                      rows={5}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-contact">Preferred Contact Method</Label>
                    <Select value={supportContact} onValueChange={setSupportContact}>
                      <SelectTrigger id="support-contact">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={supportSubmitting} className="w-full">
                    {supportSubmitting ? "Submitting..." : "Submit Support Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VIP PREVIEWS */}
          <TabsContent value="vip" className="space-y-4">
            {!isYearly ? (
              <UpgradeWall feature="VIP property previews" />
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Eye className="h-5 w-5 text-[hsl(var(--real-estate-accent))]" />
                    VIP Previews
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Exclusive access to flagship properties before they are released to the general market.
                  </p>
                </div>
                {vipProperties.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="py-16 text-center">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                      <p className="text-muted-foreground font-medium">No VIP previews available right now</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        New VIP properties are added periodically — check back soon.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {vipProperties.map((property) => (
                      <div key={property.id} className="relative">
                        <Badge className="absolute top-3 left-3 z-10 bg-[hsl(var(--real-estate-accent))] text-black border-0 text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          VIP Preview
                        </Badge>
                        <PropertyMiniCard property={property} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* CONCIERGE */}
          <TabsContent value="concierge" className="space-y-6">
            {!isYearly ? (
              <UpgradeWall feature="Personal concierge booking" />
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Crown className="h-5 w-5 text-[hsl(var(--real-estate-primary))]" />
                    Personal Concierge
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Book a one-on-one session with your personal concierge — property viewings, market tours, or investment consultations.
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Book a Session</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {vipVanSuggestion && (
                        <div className="mb-6 rounded-xl border border-[hsl(var(--real-estate-accent))]/30 bg-[hsl(var(--real-estate-accent))]/10 p-4">
                          <p className="text-sm font-semibold text-foreground">Suggested VIP Van Booking</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {vipVanSuggestion.title} for your scheduled viewing on {vipVanSuggestion.scheduledFor}.
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Pickup can be arranged for {vipVanSuggestion.location}.
                          </p>
                          <Button
                            className="mt-3"
                            variant="outline"
                            onClick={() =>
                              setConciergeNotes((prev) =>
                                prev ? `${prev}\nVIP Van requested for scheduled viewing.` : "VIP Van requested for scheduled viewing."
                              )
                            }
                          >
                            Add VIP Van to Notes
                          </Button>
                        </div>
                      )}
                      <form onSubmit={handleConciergeSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Property (optional)</Label>
                          <Popover open={conciergePickerOpen} onOpenChange={setConciergePickerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={conciergePickerOpen}
                                className="w-full justify-between font-normal"
                              >
                                {conciergePropertyId
                                  ? propertyChoices.find((p) => p.id === conciergePropertyId)
                                      ? `${propertyChoices.find((p) => p.id === conciergePropertyId)!.title} — ${propertyChoices.find((p) => p.id === conciergePropertyId)!.city}`
                                      : "Select a property…"
                                  : "Select a property…"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search properties by name or city…" />
                                <CommandList>
                                  <CommandEmpty>No properties found.</CommandEmpty>
                                  <CommandGroup>
                                    {propertyChoices.map((p) => (
                                      <CommandItem
                                        key={p.id}
                                        value={`${p.title} ${p.city}`}
                                        onSelect={() => {
                                          setConciergePropertyId(p.id === conciergePropertyId ? "" : p.id);
                                          setConciergePickerOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn("mr-2 h-4 w-4", conciergePropertyId === p.id ? "opacity-100" : "opacity-0")}
                                        />
                                        <span className="truncate">{p.title} — {p.city}</span>
                                        <Badge variant="outline" className="ml-2 text-[10px] uppercase">
                                          {p.source === "appointment" ? "Booked" : "Market"}
                                        </Badge>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="concierge-date">Preferred Date &amp; Time</Label>
                          <Input
                            id="concierge-date"
                            type="datetime-local"
                            value={conciergeDate}
                            onChange={(e) => setConciergeDate(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="concierge-notes">Notes</Label>
                          <Textarea
                            id="concierge-notes"
                            placeholder="Any special requests, questions, or context for your concierge..."
                            value={conciergeNotes}
                            onChange={(e) => setConciergeNotes(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <Button type="submit" disabled={conciergeSubmitting} className="w-full">
                          {conciergeSubmitting ? "Booking..." : "Book Concierge Session"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Your Past Sessions
                    </h3>
                    {conciergeBookings.length === 0 ? (
                      <Card className="border-0 shadow-sm">
                        <CardContent className="py-10 text-center text-muted-foreground text-sm">
                          No concierge sessions booked yet.
                        </CardContent>
                      </Card>
                    ) : (
                      conciergeBookings.map((b) => (
                        <Card key={b.id} className="border-0 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">
                                  {b.properties?.title ?? "General Consultation"}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <CalendarDays className="h-3 w-3" />
                                  {new Date(b.scheduled_at).toLocaleString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                                {b.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.notes}</p>
                                )}
                              </div>
                              <Badge
                                variant={
                                  b.status === "confirmed"
                                    ? "default"
                                    : b.status === "cancelled"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="capitalize shrink-0 text-xs"
                              >
                                {b.status ?? "pending"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* INVESTMENT ANALYSIS */}
          <TabsContent value="analysis" className="space-y-6">
            {!isYearly ? (
              <UpgradeWall feature="Investment analysis tools" />
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Investment Analysis
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Analyse a specific property or a full area — estimated yield, comparable sales, and area price history.
                  </p>
                </div>

                <Card className="border-0 shadow-sm">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={analysisMode === "property" ? "default" : "outline"}
                        onClick={() => { setAnalysisMode("property"); setAnalysisCity(""); }}
                      >
                        By Property
                      </Button>
                      <Button
                        size="sm"
                        variant={analysisMode === "area" ? "default" : "outline"}
                        onClick={() => { setAnalysisMode("area"); setAnalysisPropertyId(""); }}
                      >
                        By Area / City
                      </Button>
                    </div>

                    {analysisMode === "property" ? (
                      <div className="max-w-sm">
                        <Label>Select a Property</Label>
                        <Select value={analysisPropertyId} onValueChange={setAnalysisPropertyId}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Choose a property…" />
                          </SelectTrigger>
                          <SelectContent>
                              {propertyChoices.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.title} — {p.city} ({p.source === "appointment" ? "Booked" : "Market"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="max-w-sm">
                        <Label>Select a City / Area</Label>
                        <Select value={analysisCity} onValueChange={setAnalysisCity}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Choose a city…" />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {analysisResults ? (
                  <div className="space-y-4">
                    {analysisProperty && (
                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">{analysisProperty.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {analysisProperty.address}, {analysisProperty.city}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-muted/40 rounded-lg p-4 text-center">
                              <p className="text-xs text-muted-foreground mb-1">Listing Price</p>
                              <p className="text-lg font-bold">{formatQAR(analysisProperty.price)}</p>
                            </div>
                            <div className="bg-muted/40 rounded-lg p-4 text-center">
                              <p className="text-xs text-muted-foreground mb-1">Price / sqft</p>
                              <p className="text-lg font-bold">
                                QAR {Math.round(analysisResults.subjectPricePerSqft!).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
                              <p className="text-xs text-muted-foreground mb-1">Est. Gross Yield</p>
                              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                                {analysisResults.grossYield.toFixed(2)}%
                              </p>
                            </div>
                            <div className="bg-muted/40 rounded-lg p-4 text-center">
                              <p className="text-xs text-muted-foreground mb-1">Est. Monthly Rent</p>
                              <p className="text-lg font-bold">{formatQAR(analysisResults.estimatedMonthlyRent)}</p>
                            </div>
                          </div>
                          {analysisResults.valueVsMarket !== null && (
                            <div className="mt-4 p-4 rounded-lg border border-border/60">
                              <p className="text-sm font-medium mb-1">Market Position vs {analysisResults.targetCity}</p>
                              <p className="text-sm text-muted-foreground">
                                Price/sqft is{" "}
                                <span
                                  className={
                                    analysisResults.valueVsMarket > 0
                                      ? "text-red-600 font-medium"
                                      : "text-green-600 font-medium"
                                  }
                                >
                                  {analysisResults.valueVsMarket > 0 ? "+" : ""}
                                  {analysisResults.valueVsMarket.toFixed(1)}%
                                </span>{" "}
                                vs area median (QAR{" "}
                                {Math.round(analysisResults.medianPricePerSqft).toLocaleString()}/sqft).
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {analysisMode === "area" && (
                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">{analysisResults.targetCity} Area Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid sm:grid-cols-4 gap-4">
                            <div className="bg-muted/40 rounded-lg p-4 text-center">
                              <p className="text-xs text-muted-foreground mb-1">Listings</p>
                              <p className="text-lg font-bold">{analysisResults.areaProperties.length}</p>
                            </div>
                            <div className="bg-muted/40 rounded-lg p-4 text-center">
                              <p className="text-xs text-muted-foreground mb-1">Median Price</p>
                              <p className="text-lg font-bold">{formatQAR(analysisResults.medianPrice)}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
                              <p className="text-xs text-muted-foreground mb-1">Est. Area Yield</p>
                              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                                {analysisResults.grossYield.toFixed(2)}%
                              </p>
                            </div>
                            <div className="bg-muted/40 rounded-lg p-4 text-center">
                              <p className="text-xs text-muted-foreground mb-1">Median / sqft</p>
                              <p className="text-lg font-bold">
                                QAR {Math.round(analysisResults.medianPricePerSqft).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {analysisResults.priceHistory.length >= 2 && (
                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">
                            Price / sqft History — {analysisResults.targetCity}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Listing prices over time for properties in this area, ordered by listing date
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={260}>
                            <LineChart
                              data={analysisResults.priceHistory}
                              margin={{ top: 4, right: 16, bottom: 40, left: 16 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                angle={-35}
                                textAnchor="end"
                                interval={0}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                tickFormatter={(v) => `QAR ${v}`}
                              />
                              <Tooltip
                                formatter={(v: number) => [`QAR ${v.toLocaleString()}`, "Price/sqft"]}
                                contentStyle={{
                                  background: "hsl(var(--card))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: 8,
                                }}
                              />
                              {analysisResults.subjectPricePerSqft && (
                                <ReferenceLine
                                  y={Math.round(analysisResults.subjectPricePerSqft)}
                                  stroke="hsl(var(--real-estate-accent))"
                                  strokeDasharray="4 4"
                                  label={{
                                    value: "This property",
                                    fill: "hsl(var(--real-estate-accent))",
                                    fontSize: 10,
                                  }}
                                />
                              )}
                              <Line
                                type="monotone"
                                dataKey="price_per_sqft"
                                stroke="hsl(var(--real-estate-primary))"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {analysisResults.comparables.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                          {analysisResults.comparables.length} Comparable Properties (±15% price range)
                        </h3>
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          {analysisResults.comparables.slice(0, 6).map((p) => (
                            <PropertyMiniCard key={p.id} property={p} />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
                      Estimates use a market rental rate of QAR 7/sqft/month (capped at 7% annual yield) based on Qatar residential market benchmarks.
                      This is indicative only and not financial advice.
                    </div>
                  </div>
                ) : (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                      {analysisMode === "property"
                        ? "Select a property above to see its investment analysis."
                        : "Select a city above to see area-level investment analysis."}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* EVENTS */}
          <TabsContent value="events" className="space-y-4">
            {!isYearly ? (
              <UpgradeWall feature="Exclusive networking events" />
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-[hsl(var(--real-estate-secondary))]" />
                    Networking Events
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Exclusive events for Yearly members — connect with investors, developers, and industry leaders.
                  </p>
                </div>

                {events.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="py-16 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                      <p className="text-muted-foreground font-medium">No upcoming events right now</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        New events are announced regularly — check back soon.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => {
                      const isRegistered = registeredEventIds.has(event.id);
                      return (
                        <Card key={event.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex gap-3 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--real-estate-primary))]/10 to-[hsl(var(--real-estate-secondary))]/10 flex items-center justify-center shrink-0">
                                  <CalendarDays className="h-6 w-6 text-[hsl(var(--real-estate-primary))]" />
                                </div>
                                <div>
                                  <h3 className="font-semibold">{event.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    {new Date(event.event_date).toLocaleDateString("en-GB", {
                                      weekday: "long",
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </p>
                                  {event.location && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5" />
                                      {event.location}
                                    </p>
                                  )}
                                  {event.description && (
                                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                      {event.description}
                                    </p>
                                  )}
                                  {event.max_attendees && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Limited to {event.max_attendees} attendees
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isRegistered && (
                                  <Badge variant="default" className="text-xs flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Registered
                                  </Badge>
                                )}
                                <Button
                                  variant={isRegistered ? "outline" : "default"}
                                  size="sm"
                                  disabled={eventRegistering === event.id}
                                  onClick={() => handleEventRegister(event.id)}
                                >
                                  {eventRegistering === event.id
                                    ? "..."
                                    : isRegistered
                                    ? "Cancel"
                                    : "Register Interest"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Members;
