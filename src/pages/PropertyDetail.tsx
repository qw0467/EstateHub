import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Maximize, MapPin, ArrowLeft, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Property = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  property_type: string;
  status: string;
  image_url: string | null;
  gallery_images: string[];
  features: string[];
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchProperty();
      checkFavorite();
    }
  }, [id]);

  const fetchProperty = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
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
      setSelectedImage(data.image_url || data.gallery_images?.[0] || "");
    }
    setLoading(false);
  };

  const checkFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("property_id", id)
      .eq("user_id", session.user.id)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("property_id", id)
        .eq("user_id", session.user.id);
      setIsFavorite(false);
      toast({ title: "Removed from favorites" });
    } else {
      await supabase
        .from("favorites")
        .insert({ property_id: id, user_id: session.user.id });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!property) return null;

  const allImages = [property.image_url, ...property.gallery_images].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--real-estate-primary))] to-[hsl(var(--real-estate-secondary))] bg-clip-text text-transparent">
              EstateHub
            </Link>
            <Link to="/properties">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Properties
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Image Gallery */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="relative aspect-video md:aspect-square rounded-2xl overflow-hidden shadow-xl">
            <img
              src={selectedImage}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-white/90 hover:bg-white backdrop-blur-sm"
              onClick={toggleFavorite}
            >
              <Heart
                className={`h-5 w-5 ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-700"
                }`}
              />
            </Button>
            <Badge className="absolute top-4 left-4 bg-[hsl(var(--real-estate-accent))] text-black border-0">
              {property.property_type}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {allImages.slice(0, 4).map((image, index) => (
              <div
                key={index}
                className="aspect-video rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shadow-lg"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image}
                  alt={`${property.title} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin className="h-5 w-5 mr-2" />
                <span>
                  {property.address}, {property.city}, {property.state} {property.zip_code}
                </span>
              </div>
              <div className="text-4xl font-bold text-primary mb-6">
                {formatPrice(property.price)}
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">{property.bedrooms}</span>
                <span className="text-muted-foreground">Bedrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">{property.bathrooms}</span>
                <span className="text-muted-foreground">Bathrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">{property.sqft.toLocaleString()}</span>
                <span className="text-muted-foreground">sqft</span>
              </div>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description || "No description available."}
                </p>
              </CardContent>
            </Card>

            {property.features && property.features.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Features</h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contact Card */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold">Interested in this property?</h3>
                <p className="text-muted-foreground text-sm">
                  Schedule a viewing or make an offer today.
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate(`/booking/${property.id}`)}
                >
                  Schedule Viewing
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate(`/booking/${property.id}?type=purchase`)}
                >
                  Make an Offer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
