import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ListingForm from "@/components/ListingForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Home, ShoppingBag, Plus, Pencil, Trash2, CalendarDays } from "lucide-react";

type Booking = {
  id: string;
  booking_date: string;
  status: string | null;
  payment_status: string | null;
  payment_amount: number;
  notes: string | null;
  properties: {
    id: string;
    title: string;
    city: string;
    image_url: string | null;
    price: number;
    property_type: string;
    address: string;
    state: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
  } | null;
};

type Listing = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  property_type: string;
  status: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  image_url: string | null;
  is_exclusive: boolean | null;
  features: string[] | null;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-QA", {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 0,
  }).format(price);

const statusColor = (status: string | null) => {
  if (!status) return "outline";
  if (["available", "confirmed", "paid", "completed"].includes(status)) return "default";
  if (["pending"].includes(status)) return "secondary";
  if (["sold", "cancelled", "expired", "failed"].includes(status)) return "destructive";
  return "outline";
};

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      fetchAll();
    }
  }, [user, loading]);

  const fetchAll = async () => {
    setDataLoading(true);
    await Promise.all([fetchBookings(), fetchListings()]);
    setDataLoading(false);
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select(
        `id, booking_date, status, payment_status, payment_amount, notes,
         properties(id, title, city, image_url, price, property_type, address, state, bedrooms, bathrooms, sqft)`
      )
      .eq("user_id", user!.id)
      .order("booking_date", { ascending: false });
    setBookings((data as Booking[]) ?? []);
  };

  const fetchListings = async () => {
    const { data } = await supabase
      .from("properties")
      .select("id, title, description, price, property_type, status, address, city, state, zip_code, bedrooms, bathrooms, sqft, image_url, is_exclusive, features")
      .eq("seller_id", user!.id)
      .order("created_at", { ascending: false });
    setListings((data as Listing[]) ?? []);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingListing(null);
    fetchListings();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", deletingId);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Listing deleted" });
      fetchListings();
    }
    setDeletingId(null);
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">My Profile</h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>

        <Tabs defaultValue="purchases">
          <TabsList className="mb-6">
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              My Purchases
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              My Listings
            </TabsTrigger>
          </TabsList>

          {/* ─── PURCHASES TAB ─── */}
          <TabsContent value="purchases">
            {bookings.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="py-16 text-center">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No bookings yet.</p>
                  <Button className="mt-4" onClick={() => navigate("/properties")}>
                    Browse Properties
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <Card key={b.id} className="border-0 shadow-md overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {b.properties?.image_url && (
                          <img
                            src={b.properties.image_url}
                            alt={b.properties.title}
                            className="w-full sm:w-40 h-40 object-cover shrink-0"
                          />
                        )}
                        <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">
                              {b.properties?.title ?? "Property"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {b.properties?.city}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Badge variant={statusColor(b.status) as any}>
                              {b.status ?? "pending"}
                            </Badge>
                            <Badge variant={statusColor(b.payment_status) as any}>
                              Payment: {b.payment_status ?? "pending"}
                            </Badge>
                            <span className="text-sm text-muted-foreground ml-auto">
                              {formatPrice(b.payment_amount)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Booked {new Date(b.booking_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── LISTINGS TAB ─── */}
          <TabsContent value="listings">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">
                {listings.length} Listing{listings.length !== 1 ? "s" : ""}
              </h2>
              <Button
                onClick={() => {
                  setEditingListing(null);
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Listing
              </Button>
            </div>

            {listings.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="py-16 text-center">
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    You haven't listed any properties yet.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setEditingListing(null);
                      setShowForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Listing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <Card key={listing.id} className="border-0 shadow-md overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        <img
                          src={
                            listing.image_url ||
                            "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=400&auto=format&fit=crop"
                          }
                          alt={listing.title}
                          className="w-full sm:w-40 h-40 object-cover shrink-0"
                        />
                        <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">
                              {listing.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {listing.address}, {listing.city}
                            </p>
                            <p className="text-primary font-bold mt-1">
                              {formatPrice(listing.price)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Badge variant={statusColor(listing.status) as any} className="capitalize">
                              {listing.status ?? "available"}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {listing.property_type}
                            </Badge>
                            {listing.is_exclusive && (
                              <Badge className="bg-amber-500 text-black border-0">
                                Exclusive
                              </Badge>
                            )}
                            <div className="ml-auto flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingListing(listing);
                                  setShowForm(true);
                                }}
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeletingId(listing.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create / Edit listing dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingListing(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingListing ? "Edit Listing" : "Create New Listing"}
            </DialogTitle>
          </DialogHeader>
          <ListingForm
            existing={editingListing ?? undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingListing(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => { if (!open) setDeletingId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the listing and all associated data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
