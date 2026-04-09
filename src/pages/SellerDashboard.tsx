import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ListingForm from "@/components/ListingForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Home, Plus, Pencil, Trash2 } from "lucide-react";

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

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const statusColor = (status: string | null): BadgeVariant => {
  if (!status) return "outline";
  if (["available"].includes(status)) return "default";
  if (["pending"].includes(status)) return "secondary";
  if (["sold"].includes(status)) return "destructive";
  return "outline";
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-QA", {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 0,
  }).format(price);

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select(
        "id, title, description, price, property_type, status, address, city, state, zip_code, bedrooms, bathrooms, sqft, image_url, is_exclusive, features"
      )
      .eq("seller_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Error loading listings", description: error.message });
    } else {
      setListings((data as Listing[]) ?? []);
    }
    setLoading(false);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingListing(null);
    fetchListings();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase.from("properties").delete().eq("id", deletingId);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Listing deleted" });
      fetchListings();
    }
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Seller Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your property listings
            </p>
          </div>
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
            <p className="text-sm text-muted-foreground">
              {listings.length} listing{listings.length !== 1 ? "s" : ""}
            </p>
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
                        <Badge variant={statusColor(listing.status)} className="capitalize">
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

        {/* Public profile link */}
        {listings.length > 0 && user && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => navigate(`/seller/${user.id}`)}>
              View My Public Profile
            </Button>
          </div>
        )}
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
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the listing. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SellerDashboard;
