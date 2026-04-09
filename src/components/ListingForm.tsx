import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type PropertyType = "house" | "apartment" | "condo" | "villa" | "penthouse";
type PropertyStatus = "available" | "pending" | "sold";

type ListingFormData = {
  title: string;
  description: string;
  price: string;
  property_type: PropertyType;
  status: PropertyStatus;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  image_url: string;
  is_exclusive: boolean;
  features: string;
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

type ListingFormProps = {
  existing?: Listing;
  onSuccess: () => void;
  onCancel: () => void;
};

const EMPTY_FORM: ListingFormData = {
  title: "",
  description: "",
  price: "",
  property_type: "house",
  status: "available",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  bedrooms: "",
  bathrooms: "",
  sqft: "",
  image_url: "",
  is_exclusive: false,
  features: "",
};

const ListingForm = ({ existing, onSuccess, onCancel }: ListingFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ListingFormData>(
    existing
      ? {
          title: existing.title,
          description: existing.description ?? "",
          price: String(existing.price),
          property_type: existing.property_type as PropertyType,
          status: (existing.status ?? "available") as PropertyStatus,
          address: existing.address,
          city: existing.city,
          state: existing.state,
          zip_code: existing.zip_code ?? "",
          bedrooms: String(existing.bedrooms),
          bathrooms: String(existing.bathrooms),
          sqft: String(existing.sqft),
          image_url: existing.image_url ?? "",
          is_exclusive: existing.is_exclusive ?? false,
          features: (existing.features ?? []).join(", "),
        }
      : EMPTY_FORM
  );

  const set = (field: keyof ListingFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const price = parseFloat(form.price);
    const bedrooms = parseInt(form.bedrooms);
    const bathrooms = parseInt(form.bathrooms);
    const sqft = parseInt(form.sqft);

    if (isNaN(price) || price <= 0) {
      toast({ variant: "destructive", title: "Invalid price" });
      return;
    }
    if (isNaN(bedrooms) || bedrooms < 0) {
      toast({ variant: "destructive", title: "Invalid bedrooms count" });
      return;
    }
    if (isNaN(bathrooms) || bathrooms < 0) {
      toast({ variant: "destructive", title: "Invalid bathrooms count" });
      return;
    }
    if (isNaN(sqft) || sqft <= 0) {
      toast({ variant: "destructive", title: "Invalid area" });
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      price,
      property_type: form.property_type,
      status: form.status,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zip_code: form.zip_code.trim() || null,
      bedrooms,
      bathrooms,
      sqft,
      image_url: form.image_url.trim() || null,
      is_exclusive: form.is_exclusive,
      features: form.features
        ? form.features.split(",").map((f) => f.trim()).filter(Boolean)
        : [],
    };

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase
        .from("properties")
        .insert({ ...payload, seller_id: user.id }));
    }

    setSaving(false);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: existing ? "Listing updated" : "Listing created" });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Modern Downtown Apartment"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="price">Price (QAR) *</Label>
          <Input
            id="price"
            type="number"
            min="1"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="e.g. 1500000"
            required
          />
        </div>

        <div className="space-y-1">
          <Label>Property Type *</Label>
          <Select
            value={form.property_type}
            onValueChange={(v) => set("property_type", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["house", "apartment", "condo", "villa", "penthouse"].map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => set("status", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["available", "pending", "sold"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="bedrooms">Bedrooms *</Label>
          <Input
            id="bedrooms"
            type="number"
            min="0"
            value={form.bedrooms}
            onChange={(e) => set("bedrooms", e.target.value)}
            placeholder="e.g. 3"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="bathrooms">Bathrooms *</Label>
          <Input
            id="bathrooms"
            type="number"
            min="0"
            value={form.bathrooms}
            onChange={(e) => set("bathrooms", e.target.value)}
            placeholder="e.g. 2"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="sqft">Area (sqft) *</Label>
          <Input
            id="sqft"
            type="number"
            min="1"
            value={form.sqft}
            onChange={(e) => set("sqft", e.target.value)}
            placeholder="e.g. 1400"
            required
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="e.g. Tower 12, West Bay"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="e.g. Doha"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="state">State / Region *</Label>
          <Input
            id="state"
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
            placeholder="e.g. Ad Dawhah"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="zip_code">Zip / Postal Code</Label>
          <Input
            id="zip_code"
            value={form.zip_code}
            onChange={(e) => set("zip_code", e.target.value)}
            placeholder="e.g. 00000"
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <Label htmlFor="image_url">Cover Image URL</Label>
          <Input
            id="image_url"
            type="url"
            value={form.image_url}
            onChange={(e) => set("image_url", e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe the property…"
            rows={4}
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <Label htmlFor="features">Features (comma-separated)</Label>
          <Input
            id="features"
            value={form.features}
            onChange={(e) => set("features", e.target.value)}
            placeholder="e.g. Pool, Gym, Parking"
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="is_exclusive"
            checked={form.is_exclusive}
            onCheckedChange={(v) => set("is_exclusive", v)}
          />
          <Label htmlFor="is_exclusive" className="cursor-pointer">
            Exclusive (members only)
          </Label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : existing ? "Update Listing" : "Create Listing"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ListingForm;
