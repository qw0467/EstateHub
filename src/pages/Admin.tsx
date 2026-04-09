import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Home, Calendar, CreditCard, AlertTriangle } from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_suspended: boolean;
  created_at: string;
};

type Property = {
  id: string;
  title: string;
  city: string;
  price: number;
  property_type: string;
  status: string;
  is_exclusive: boolean | null;
  created_at: string;
};

type Booking = {
  id: string;
  status: string | null;
  payment_status: string | null;
  payment_amount: number;
  booking_date: string;
  created_at: string;
  user_id: string;
  property_id: string;
  notes: string | null;
};

type Membership = {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  start_date: string;
  end_date: string | null;
};

const ROLE_OPTIONS = ["free", "seller", "member", "admin"] as const;

const Admin = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (role !== "admin") {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view this page.",
        });
        navigate("/");
        return;
      }
      fetchAll();
    }
  }, [user, role, loading]);

  const fetchAll = async () => {
    setDataLoading(true);
    await Promise.all([
      fetchProfiles(),
      fetchProperties(),
      fetchBookings(),
      fetchMemberships(),
    ]);
    setDataLoading(false);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, is_suspended, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setProfiles(data as Profile[]);
  };

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, city, price, property_type, status, is_exclusive, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setProperties(data as Property[]);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, status, payment_status, payment_amount, booking_date, created_at, user_id, property_id, notes")
      .order("created_at", { ascending: false });
    if (!error && data) setBookings(data as Booking[]);
  };

  const fetchMemberships = async () => {
    const { data, error } = await supabase
      .from("memberships")
      .select("id, user_id, tier, status, start_date, end_date")
      .order("start_date", { ascending: false });
    if (!error && data) setMemberships(data as Membership[]);
  };

  const handleRoleChange = async (profileId: string, newRole: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole as "free" | "seller" | "member" | "admin" })
      .eq("id", profileId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Role updated", description: `Role changed to ${newRole}` });
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      );
    }
  };

  const handleToggleSuspend = async (profile: Profile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: !profile.is_suspended })
      .eq("id", profile.id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      const action = profile.is_suspended ? "Unsuspended" : "Suspended";
      toast({ title: `${action} user` });
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id ? { ...p, is_suspended: !profile.is_suspended } : p
        )
      );
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Property deleted" });
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    }
  };

  const handlePropertyStatusChange = async (propertyId: string, newStatus: string) => {
    const { error } = await supabase
      .from("properties")
      .update({ status: newStatus as "available" | "pending" | "sold" })
      .eq("id", propertyId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Property status updated" });
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus } : p))
      );
    }
  };

  const handleBookingStatusChange = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Booking status updated" });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    }
  };

  const handleMembershipTierChange = async (membershipId: string, newTier: string) => {
    const { error } = await supabase
      .from("memberships")
      .update({ tier: newTier as "free" | "monthly" | "yearly" })
      .eq("id", membershipId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Membership tier updated" });
      setMemberships((prev) =>
        prev.map((m) => (m.id === membershipId ? { ...m, tier: newTier } : m))
      );
    }
  };

  const handleMembershipStatusChange = async (membershipId: string, newStatus: string) => {
    const { error } = await supabase
      .from("memberships")
      .update({ status: newStatus as "active" | "expired" | "cancelled" })
      .eq("id", membershipId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Membership status updated" });
      setMemberships((prev) =>
        prev.map((m) => (m.id === membershipId ? { ...m, status: newStatus } : m))
      );
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-QA", {
      style: "currency",
      currency: "QAR",
      minimumFractionDigits: 0,
    }).format(price);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const statusVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!status) return "secondary";
    if (["active", "available", "confirmed", "completed", "paid"].includes(status)) return "default";
    if (["pending"].includes(status)) return "secondary";
    if (["cancelled", "expired", "failed", "sold"].includes(status)) return "destructive";
    return "outline";
  };

  if (loading || (user && role !== "admin" && !dataLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground text-sm">Manage users, properties, bookings, and memberships</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total Users", value: profiles.length, icon: Users },
              { label: "Properties", value: properties.length, icon: Home },
              { label: "Bookings", value: bookings.length, icon: Calendar },
              { label: "Memberships", value: memberships.length, icon: CreditCard },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="border-0 shadow-md">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        ) : (
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-lg">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="memberships">Memberships</TabsTrigger>
            </TabsList>

            {/* ── Users Tab ── */}
            <TabsContent value="users">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users ({profiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-left">
                          <th className="pb-3 pr-4 font-medium">Name</th>
                          <th className="pb-3 pr-4 font-medium">Phone</th>
                          <th className="pb-3 pr-4 font-medium">Role</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 pr-4 font-medium">Joined</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {profiles.map((profile) => (
                          <tr key={profile.id} className="py-3">
                            <td className="py-3 pr-4">
                              <div className="font-medium">{profile.full_name || "—"}</div>
                              <div className="text-xs text-muted-foreground font-mono">{profile.id.slice(0, 8)}…</div>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{profile.phone || "—"}</td>
                            <td className="py-3 pr-4">
                              <Select
                                value={profile.role}
                                onValueChange={(v) => handleRoleChange(profile.id, v)}
                                disabled={profile.id === user?.id}
                              >
                                <SelectTrigger className="w-28 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLE_OPTIONS.map((r) => (
                                    <SelectItem key={r} value={r} className="text-xs capitalize">
                                      {r}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={profile.is_suspended ? "destructive" : "default"}>
                                {profile.is_suspended ? "Suspended" : "Active"}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{formatDate(profile.created_at)}</td>
                            <td className="py-3">
                              <Button
                                variant={profile.is_suspended ? "outline" : "destructive"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleToggleSuspend(profile)}
                                disabled={profile.id === user?.id}
                              >
                                {profile.is_suspended ? "Unsuspend" : "Suspend"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {profiles.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No users found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Properties Tab ── */}
            <TabsContent value="properties">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Properties ({properties.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-left">
                          <th className="pb-3 pr-4 font-medium">Title</th>
                          <th className="pb-3 pr-4 font-medium">City</th>
                          <th className="pb-3 pr-4 font-medium">Price</th>
                          <th className="pb-3 pr-4 font-medium">Type</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 pr-4 font-medium">Exclusive</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {properties.map((property) => (
                          <tr key={property.id}>
                            <td className="py-3 pr-4">
                              <div className="font-medium max-w-[180px] truncate">{property.title}</div>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{property.city}</td>
                            <td className="py-3 pr-4 font-medium">{formatPrice(property.price)}</td>
                            <td className="py-3 pr-4 capitalize text-muted-foreground">{property.property_type}</td>
                            <td className="py-3 pr-4">
                              <Select
                                value={property.status}
                                onValueChange={(v) => handlePropertyStatusChange(property.id, v)}
                              >
                                <SelectTrigger className="w-28 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available" className="text-xs">Available</SelectItem>
                                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                                  <SelectItem value="sold" className="text-xs">Sold</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={property.is_exclusive ? "default" : "secondary"}>
                                {property.is_exclusive ? "Yes" : "No"}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleDeleteProperty(property.id)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {properties.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No properties found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Bookings Tab ── */}
            <TabsContent value="bookings">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Bookings ({bookings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-left">
                          <th className="pb-3 pr-4 font-medium">Booking ID</th>
                          <th className="pb-3 pr-4 font-medium">User</th>
                          <th className="pb-3 pr-4 font-medium">Amount</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 pr-4 font-medium">Payment</th>
                          <th className="pb-3 pr-4 font-medium">Date</th>
                          <th className="pb-3 font-medium">Update Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {bookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="py-3 pr-4">
                              <span className="font-mono text-xs text-muted-foreground">{booking.id.slice(0, 8)}…</span>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="font-mono text-xs text-muted-foreground">{booking.user_id.slice(0, 8)}…</span>
                            </td>
                            <td className="py-3 pr-4 font-medium">{formatPrice(booking.payment_amount)}</td>
                            <td className="py-3 pr-4">
                              <Badge variant={statusVariant(booking.status)}>
                                {booking.status || "—"}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={statusVariant(booking.payment_status)}>
                                {booking.payment_status || "—"}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{formatDate(booking.created_at)}</td>
                            <td className="py-3">
                              <Select
                                value={booking.status || "pending"}
                                onValueChange={(v) => handleBookingStatusChange(booking.id, v)}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                                  <SelectItem value="confirmed" className="text-xs">Confirmed</SelectItem>
                                  <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                                  <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {bookings.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No bookings found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Memberships Tab ── */}
            <TabsContent value="memberships">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Memberships ({memberships.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-left">
                          <th className="pb-3 pr-4 font-medium">User ID</th>
                          <th className="pb-3 pr-4 font-medium">Tier</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 pr-4 font-medium">Start</th>
                          <th className="pb-3 pr-4 font-medium">Expiry</th>
                          <th className="pb-3 font-medium">Override</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {memberships.map((membership) => (
                          <tr key={membership.id}>
                            <td className="py-3 pr-4">
                              <span className="font-mono text-xs text-muted-foreground">{membership.user_id.slice(0, 8)}…</span>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={membership.tier === "free" ? "secondary" : "default"} className="capitalize">
                                {membership.tier}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={statusVariant(membership.status)}>
                                {membership.status}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{formatDate(membership.start_date)}</td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {membership.end_date ? formatDate(membership.end_date) : "Ongoing"}
                            </td>
                            <td className="py-3">
                              <div className="flex gap-2">
                                <Select
                                  value={membership.tier}
                                  onValueChange={(v) => handleMembershipTierChange(membership.id, v)}
                                >
                                  <SelectTrigger className="w-24 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free" className="text-xs">Free</SelectItem>
                                    <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                                    <SelectItem value="yearly" className="text-xs">Yearly</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={membership.status}
                                  onValueChange={(v) => handleMembershipStatusChange(membership.id, v)}
                                >
                                  <SelectTrigger className="w-28 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active" className="text-xs">Active</SelectItem>
                                    <SelectItem value="expired" className="text-xs">Expired</SelectItem>
                                    <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {memberships.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No memberships found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Admin;
