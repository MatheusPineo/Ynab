import * as React from "react"
import { Check, ChevronsUpDown, Pin } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { COUNTRIES } from "@/constants/countries"
import { useAuthStore } from "@/modules/auth/store/useAuthStore"

interface CountryComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function CountryCombobox({ value, onChange }: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const user = useAuthStore((state) => state.user)
  const updatePinnedCountries = useAuthStore((state) => state.updatePinnedCountries)

  const pinnedCodes = user?.pinnedCountries || []

  const togglePin = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinned = pinnedCodes.includes(code)
      ? pinnedCodes.filter((c) => c !== code)
      : [...pinnedCodes, code];
    
    updatePinnedCountries(newPinned);
  };

  const selectedCountry = COUNTRIES.find((c) => c.code === value)

  const pinnedCountries = COUNTRIES.filter((c) => pinnedCodes.includes(c.code));
  const unpinnedCountries = COUNTRIES.filter((c) => !pinnedCodes.includes(c.code));

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background/50 border-border/60 rounded-xl font-medium"
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2">
              <img 
                src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`} 
                alt={selectedCountry.name} 
                className="w-5 h-[15px] object-cover rounded-[2px]" 
              />
              {selectedCountry.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Selecione o país...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 glass border-border/60" align="start">
        <Command>
          <CommandInput placeholder="Buscar país..." />
          <CommandList className="max-h-[250px] overflow-y-auto pointer-events-auto touch-auto">
            <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
            
            {pinnedCountries.length > 0 && (
              <>
                <CommandGroup heading="Fixados">
                  {pinnedCountries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={country.name}
                      onSelect={() => {
                        onChange(country.code)
                        setOpen(false)
                      }}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value === country.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <img 
                        src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`} 
                        alt={country.name} 
                        className="w-5 h-[15px] object-cover rounded-[2px] shrink-0" 
                      />
                      <span className="flex-1 truncate">{country.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-100 text-primary"
                        onClick={(e) => togglePin(country.code, e)}
                      >
                        <Pin className="h-3.5 w-3.5 fill-current" />
                      </Button>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup heading="Todos os Países">
              {unpinnedCountries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.name}
                  onSelect={() => {
                    onChange(country.code)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <img 
                    src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`} 
                    alt={country.name} 
                    className="w-5 h-[15px] object-cover rounded-[2px] shrink-0" 
                  />
                  <span className="flex-1 truncate">{country.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-40 hover:opacity-100 text-muted-foreground hover:text-primary transition-all"
                    onClick={(e) => togglePin(country.code, e)}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </Button>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
