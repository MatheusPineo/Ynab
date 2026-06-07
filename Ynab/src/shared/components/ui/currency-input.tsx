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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawString = e.target.value;
      
      // 1. Detecta se existe um sinal de menos na string digitada
      const isNegative = rawString.includes('-');
      
      // 2. Remove tudo o que não for dígito numérico
      const digits = rawString.replace(/\D/g, '');
      
      if (digits === '') {
        onChange(0);
        return;
      }
      
      // 3. Calcula o valor flutuante aplicando a polaridade correta
      const rawNumber = parseInt(digits, 10);
      const floatValue = (rawNumber / 100) * (isNegative ? -1 : 1);
      onChange(floatValue);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        // Mudamos para "text" para que teclados mobile/desktop aceitem a tecla hífen (-)
        inputMode="text"
        value={formatValue(value)}
        onChange={handleChange}
        className={cn("text-right font-mono", className)}
      />
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"