import { useRef, useState } from "react";
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
import { ImagePlus, X, GripVertical, Loader2 } from "lucide-react";

type PropertyType = "house" | "apartment" | "condo" | "villa" | "penthouse";
type PropertyStatus = "available" | "pending" | "sold";

type ImageItem = {
  id: string;
  previewUrl: string;
  file?: File;
  remoteUrl?: string;
};

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
  gallery_images: string[] | null;
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
  is_exclusive: false,
  features: "",
};

function buildInitialImages(existing?: Listing): ImageItem[] {
  if (!existing) return [];
  const all: string[] = [];
  if (existing.image_url) all.push(existing.image_url);
  if (existing.gallery_images) {
    for (const u of existing.gallery_images) {
      if (u && u !== existing.image_url) all.push(u);
    }
  }
  return all.map((url) => ({
    id: crypto.randomUUID(),
    previewUrl: url,
    remoteUrl: url,
  }));
}

const ListingForm = ({ existing, onSuccess, onCancel }: ListingFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          is_exclusive: existing.is_exclusive ?? false,
          features: (existing.features ?? []).join(", "),
        }
      : EMPTY_FORM
  );

  const [images, setImages] = useState<ImageItem[]>(() =>
    buildInitialImages(existing)
  );

  const dragIndex = useRef<number | null>(null);

  const set = (field: keyof ListingFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newItems: ImageItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      file,
    }));
    setImages((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.file) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === index) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      dragIndex.current = index;
      return next;
    });
  };

  const handleDrop = () => {
    dragIndex.current = null;
  };

  const uploadImage = async (item: ImageItem): Promise<string> => {
    if (item.remoteUrl && !item.file) return item.remoteUrl;
    if (!item.file) throw new Error("No file");
    const ext = item.file.name.split(".").pop() ?? "jpg";
    const path = `${user!.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("property-images")
      .upload(path, item.file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage
      .from("property-images")
      .getPublicUrl(path);
    return data.publicUrl;
  };

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

    let uploadedUrls: string[] = [];
    try {
      uploadedUrls = await Promise.all(images.map(uploadImage));
    } catch (err: unknown) {
      setSaving(false);
      const msg = err instanceof Error ? err.message : "Image upload failed";
      toast({
        variant: "destructive",
        title: "Image upload failed",
        description: msg.includes("bucket")
          ? 'Create a public storage bucket named "property-images" in your Supabase dashboard first.'
          : msg,
      });
      return;
    }

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
      image_url: uploadedUrls[0] ?? null,
      gallery_images: uploadedUrls.length > 0 ? uploadedUrls : [],
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Image uploader ── */}
      <div className="space-y-2">
        <Label>Photos</Label>
        <p className="text-xs text-muted-foreground">
          Upload photos and drag to reorder. The first photo is used as the thumbnail.
        </p>

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((img, index) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border cursor-grab active:cursor-grabbing select-none"
                style={{ borderColor: index === 0 ? "hsl(var(--primary))" : undefined }}
              >
                <img
                  src={img.previewUrl}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
                {index === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] font-semibold bg-primary text-primary-foreground py-0.5">
                    Thumbnail
                  </span>
                )}
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-white drop-shadow" />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-0.5"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px]">Add</span>
            </button>
          </div>
        )}

        {images.length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-lg border-2 border-dashed border-border py-10 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm font-medium">Click to upload photos</span>
            <span className="text-xs">JPG, PNG, WebP</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Fields ── */}
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
          <Select value={form.property_type} onValueChange={(v) => set("property_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["house", "apartment", "condo", "villa", "penthouse"].map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["available", "pending", "sold"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
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
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {images.some((i) => i.file) ? "Uploading…" : "Saving…"}
            </>
          ) : (
            existing ? "Update Listing" : "Create Listing"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ListingForm;
