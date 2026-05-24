import React, { useState } from "react";
import { CreditCard } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface CreditCardBrandIconProps {
  brand?: string | null;
  className?: string;
}

const BRAND_FILES: Record<string, string> = {
  "Visa": "/icons/visa.svg",
  "Mastercard": "/icons/mastercard.svg",
  "American Express": "/icons/american-express.svg",
  "Elo": "/icons/elo.svg",
  "UnionPay": "/icons/unionpay.svg",
  "JCB": "/icons/jcb.svg",
};

export const CreditCardBrandIcon: React.FC<CreditCardBrandIconProps> = ({ brand, className }) => {
  const [hasError, setHasError] = useState(false);

  const renderFallback = () => (
    <div className={cn("flex items-center justify-center shrink-0 w-12 h-8 rounded-md bg-primary/10 border border-primary/20 text-primary overflow-hidden", className)}>
      <CreditCard className="h-6 w-6" strokeWidth={1.5} />
    </div>
  );

  if (!brand || !BRAND_FILES[brand] || hasError) {
    return renderFallback();
  }

  return (
    <div className={cn("bg-white flex items-center justify-center shrink-0 w-12 h-8 rounded-md border border-gray-600 overflow-hidden", className)}>
      <img
        src={BRAND_FILES[brand]}
        alt={`Logo ${brand}`}
        className="w-full h-full object-contain p-1"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
