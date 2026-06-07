import * as React from "react"
import { Input } from "./input"
import { cn } from "@/shared/lib/utils"

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number;
  onChange: (value: number) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    
    const formatValue = (val: number) => {
      if (isNaN(val)) val = 0;
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    };

    // Buffer local para permitir digitação transitória do '-'
    const [displayValue, setDisplayValue] = React.useState(() => formatValue(value));

    React.useEffect(() => {
      setDisplayValue(formatValue(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawString = e.target.value;
      const isNegative = rawString.includes('-');
      const digits = rawString.replace(/\D/g, '');
      
      if (digits === '') {
        setDisplayValue(isNegative ? '-' : '0,00');
        onChange(0);
        return;
      }
      
      const rawNumber = parseInt(digits, 10);
      const floatValue = (rawNumber / 100) * (isNegative ? -1 : 1);
      
      if (floatValue === 0 && isNegative) {
        setDisplayValue('-0,00');
      } else {
        setDisplayValue((isNegative ? '-' : '') + formatValue(Math.abs(floatValue)));
      }
      
      onChange(floatValue);
    };

    const handleBlur = () => {
      setDisplayValue(formatValue(value));
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn("text-right font-mono", className)}
      />
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"