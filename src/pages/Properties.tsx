import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Lock } from "lucide-react";
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
  is_exclusive: boolean;
};

type Membership = {
  tier: string;
  status: string;
  end_date: string | null;
};

export type PropertyFiltersType = {
  priceRange: [number, number];
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
};

const Properties = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [exclusiveProperties, setExclusiveProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filters, setFilters] = useState<PropertyFiltersType>({
    priceRange: [0, 5000000],
    bedrooms: "any",
    bathrooms: "any",
    propertyType: "all",
  });

  useEffect(() => {
    checkAuth();
    fetchProperties();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      await fetchMembership(session.user.id);
    }
  };

  const fetchMembership = async (userId: string) => {
    const { data } = await supabase
      .from("memberships")
      .select("tier, status, end_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setMembership(data);
    }
  };

  const fetchProperties = async () => {
    // Fetch regular properties
    const { data: regularData, error: regularError } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "available")
      .eq("is_exclusive", false)
      .order("created_at", { ascending: false });

    if (regularError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load properties",
      });
    } else {
      setProperties(regularData || []);
    }

    // Fetch exclusive properties (for display, even if user can't access)
    const { data: exclusiveData } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "available")
      .eq("is_exclusive", true)
      .order("created_at", { ascending: false })
      .limit(3);

    if (exclusiveData) {
      setExclusiveProperties(exclusiveData);
    }

    setLoading(false);
  };

  const hasPremiumAccess = membership && 
    (membership.tier === "monthly" || membership.tier === "yearly") && 
    membership.status === "active";

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPrice =
      property.price >= filters.priceRange[0] &&
      property.price <= filters.priceRange[1];

    const matchesBedrooms =
      filters.bedrooms === "any" ||
      property.bedrooms >= parseInt(filters.bedrooms);

    const matchesBathrooms =
      filters.bathrooms === "any" ||
      property.bathrooms >= parseInt(filters.bathrooms);

    const matchesType =
      filters.propertyType === "all" ||
      property.property_type.toLowerCase() === filters.propertyType.toLowerCase();

    return (
      matchesSearch &&
      matchesPrice &&
      matchesBedrooms &&
      matchesBathrooms &&
      matchesType
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by address, city, or neighborhood..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg shadow-lg"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <PropertyFilters filters={filters} setFilters={setFilters} />
          </aside>

          {/* Property Grid */}
          <div>
            {/* Exclusive Properties Section */}
            {exclusiveProperties.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <span className="bg-gradient-to-r from-[hsl(var(--real-estate-accent))] to-[hsl(var(--real-estate-primary))] bg-clip-text text-transparent">
                        Exclusive Properties
                      </span>
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasPremiumAccess 
                        ? "Premium listings just for you" 
                        : "Unlock with premium membership"}
                    </p>
                  </div>
                  {!hasPremiumAccess && (
                    <Link to="/membership">
                      <Button variant="outline" size="sm">
                        Unlock Access
                      </Button>
                    </Link>
                  )}
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {exclusiveProperties.map((property) => (
                    <div key={property.id} className="relative">
                      {!hasPremiumAccess && (
                        <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer" onClick={() => navigate("/membership")}>
                          <div className="bg-white rounded-full p-4">
                            <Lock className="h-8 w-8 text-primary" />
                          </div>
                          <div className="text-center px-4">
                            <p className="text-white font-semibold mb-1">Premium Only</p>
                            <p className="text-white/80 text-sm">Upgrade to view this property</p>
                          </div>
                        </div>
                      )}
                      <PropertyCard property={property} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Properties Section */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {filteredProperties.length} {exclusiveProperties.length > 0 ? "Standard" : ""} Properties {filteredProperties.length === 0 ? "Found" : ""}
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Loading properties...</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No properties match your filters. Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Properties;
