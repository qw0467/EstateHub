import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Maximize, MapPin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Property = {
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

const PropertyCard = ({ property }: { property: Property }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkFavorite();
  }, [property.id]);

  const checkFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("property_id", property.id)
      .eq("user_id", session.user.id)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("property_id", property.id)
        .eq("user_id", session.user.id);
      setIsFavorite(false);
      toast({ title: "Removed from favorites" });
    } else {
      await supabase
        .from("favorites")
        .insert({ property_id: property.id, user_id: session.user.id });
      setIsFavorite(true);
      toast({ title: "Added to favorites" });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-QA", {
      style: "currency",
      currency: "QAR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link to={`/property/${property.id}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-b from-card to-card/50 cursor-pointer">
        <div className="relative overflow-hidden">
          <img
            src={property.image_url || "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&auto=format&fit=crop"}
            alt={property.title}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-white/90 hover:bg-white backdrop-blur-sm z-10"
            onClick={toggleFavorite}
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-700"
              }`}
            />
          </Button>

          <div className="absolute bottom-4 left-4">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-black border-0 capitalize">
              {property.property_type}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="mb-3">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
              {property.title}
            </h3>
            <div className="flex items-center text-muted-foreground text-sm mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {property.address}, {property.city}, {property.state}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms} Beds</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms} Baths</span>
            </div>
            <div className="flex items-center gap-1">
              <Maximize className="h-4 w-4" />
              <span>{property.sqft.toLocaleString()} sqft</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-2xl font-bold text-primary">
              {formatPrice(property.price)}
            </div>
            <Button size="sm" className="shadow-md">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PropertyCard;
