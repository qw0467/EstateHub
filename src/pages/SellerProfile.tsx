import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Phone, User } from "lucide-react";

type SellerInfo = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
};

type PropertyItem = {
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
};

const SellerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [listings, setListings] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSeller();
      fetchListings();
    }
  }, [id]);

  const fetchSeller = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, bio, phone")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
    } else {
      setSeller(data as SellerInfo);
    }
  };

  const fetchListings = async () => {
    const { data } = await supabase
      .from("properties")
      .select(
        "id, title, price, address, city, state, bedrooms, bathrooms, sqft, property_type, image_url"
      )
      .eq("seller_id", id)
      .eq("status", "available")
      .order("created_at", { ascending: false });

    setListings((data as PropertyItem[]) ?? []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="h-40 w-full mb-8 rounded-2xl" />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !seller) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Seller Not Found</h1>
          <p className="text-muted-foreground">
            This seller profile doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const initials = seller.full_name
    ? seller.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Seller info card */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <Avatar className="h-24 w-24 text-2xl">
                <AvatarImage src={seller.avatar_url ?? ""} alt={seller.full_name ?? ""} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">
                  {seller.full_name ?? "Anonymous Seller"}
                </h1>

                {seller.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Phone className="h-4 w-4" />
                    <span>{seller.phone}</span>
                  </div>
                )}

                {seller.bio && (
                  <p className="text-muted-foreground mt-3 leading-relaxed max-w-2xl">
                    {seller.bio}
                  </p>
                )}
              </div>

              <div className="text-center sm:text-right">
                <div className="text-3xl font-bold text-primary">{listings.length}</div>
                <div className="text-sm text-muted-foreground">Active Listing{listings.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Home className="h-5 w-5" />
            Active Listings
          </h2>

          {listings.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  This seller has no active listings at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
