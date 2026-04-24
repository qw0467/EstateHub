import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planName: string;
  price: number;
};

function luhn(num: string) {
  const digits = num.replace(/\D/g, "");
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function detectBrand(num: string) {
  const d = num.replace(/\D/g, "");
  if (/^4/.test(d)) return "visa";
  if (/^5[1-5]|^2[2-7]/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  return null;
}

function formatCard(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 16);
  return d.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 4);
  if (d.length >= 3) return d.slice(0, 2) + "/" + d.slice(2);
  return d;
}

const BrandBadge = ({ brand }: { brand: string | null }) => {
  if (!brand) return <CreditCard className="h-5 w-5 text-muted-foreground" />;
  if (brand === "visa")
    return <span className="text-[10px] font-black tracking-widest text-blue-700 border border-blue-200 rounded px-1">VISA</span>;
  if (brand === "mastercard")
    return (
      <span className="inline-flex">
        <span className="w-4 h-4 rounded-full bg-red-500 opacity-90 -mr-1.5 inline-block" />
        <span className="w-4 h-4 rounded-full bg-yellow-400 opacity-90 inline-block" />
      </span>
    );
  if (brand === "amex")
    return <span className="text-[10px] font-black tracking-widest text-blue-500 border border-blue-200 rounded px-1">AMEX</span>;
  return null;
};

export default function PaymentModal({ open, onClose, onSuccess, planName, price }: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<"form" | "processing" | "success">("form");

  const brand = detectBrand(cardNumber);
  const rawDigits = cardNumber.replace(/\D/g, "");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Cardholder name is required";
    if (rawDigits.length < 13 || !luhn(rawDigits)) e.card = "Invalid card number";
    const [mm, yy] = expiry.split("/");
    const now = new Date();
    const expMonth = parseInt(mm, 10);
    const expYear = 2000 + parseInt(yy || "0", 10);
    if (!mm || !yy || expMonth < 1 || expMonth > 12 || expYear < now.getFullYear() ||
      (expYear === now.getFullYear() && expMonth < now.getMonth() + 1))
      e.expiry = "Invalid or expired date";
    if (cvv.length < 3) e.cvv = "Invalid CVV";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStage("processing");
    await new Promise((r) => setTimeout(r, 2200));
    setStage("success");
    await new Promise((r) => setTimeout(r, 1400));
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setCardNumber(""); setExpiry(""); setCvv(""); setName("");
    setErrors({}); setStage("form");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-green-600" />
            Secure Payment
          </DialogTitle>
        </DialogHeader>

        {stage === "processing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing your payment…</p>
          </div>
        )}

        {stage === "success" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-semibold text-lg">Payment Successful!</p>
            <p className="text-sm text-muted-foreground">Your {planName} membership is now active.</p>
          </div>
        )}

        {stage === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Subscribing to</p>
                <p className="font-semibold">{planName}</p>
              </div>
              <p className="text-xl font-bold text-primary">QAR {price.toLocaleString()}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ch-name">Cardholder Name</Label>
              <Input
                id="ch-name"
                placeholder="Name on card"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(errors.name && "border-red-400")}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="card-num">Card Number</Label>
              <div className="relative">
                <Input
                  id="card-num"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  inputMode="numeric"
                  onChange={(e) => setCardNumber(formatCard(e.target.value))}
                  className={cn("pr-12", errors.card && "border-red-400")}
                  maxLength={19}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <BrandBadge brand={brand} />
                </div>
              </div>
              {errors.card && <p className="text-xs text-red-500">{errors.card}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={expiry}
                  inputMode="numeric"
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  className={cn(errors.expiry && "border-red-400")}
                  maxLength={5}
                />
                {errors.expiry && <p className="text-xs text-red-500">{errors.expiry}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cvv}
                  inputMode="numeric"
                  type="password"
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className={cn(errors.cvv && "border-red-400")}
                  maxLength={4}
                />
                {errors.cvv && <p className="text-xs text-red-500">{errors.cvv}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Lock className="h-4 w-4 mr-2" />
              Pay QAR {price.toLocaleString()}
            </Button>

            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" /> 256-bit SSL encrypted · Demo environment
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
