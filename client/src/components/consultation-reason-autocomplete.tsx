import { useState, useRef, useEffect } from 'react';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown, Search } from 'lucide-react';
import { searchReasons } from '@/lib/consultation-reasons';
import { cn } from '@/lib/utils';

interface ConsultationReasonAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'consultation' | 'admission';
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function ConsultationReasonAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Search consultation reasons...",
  type = 'consultation',
  className,
  onFocus,
  onBlur
}: ConsultationReasonAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [suggestions, setSuggestions] = useState(searchReasons('', type));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    const results = searchReasons(search, type);
    setSuggestions(results);
  }, [search, type]);

  const handleInputChange = (newValue: string) => {
    setSearch(newValue);
    onChange(newValue);
  };

  const handleSelect = (selectedValue: string) => {
    setSearch(selectedValue);
    onChange(selectedValue);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && !open) {
      setOpen(true);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setOpen(true);
                onFocus?.();
              }}
              onBlur={onBlur}
              placeholder={placeholder}
              className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid={`input-${type}-reason`}
            />
            <ChevronDown 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
              onClick={() => setOpen(!open)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" side="bottom" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={`Search ${type} reasons...`}
                value={search}
                onChange={(e) => handleInputChange(e.target.value)}
                data-testid={`search-${type}-reasons`}
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {suggestions.length === 0 ? (
                <CommandEmpty>No reasons found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {suggestions.map((reason) => (
                    <CommandItem
                      key={reason}
                      value={reason}
                      onSelect={() => handleSelect(reason)}
                      className="cursor-pointer"
                      data-testid={`option-${type}-${reason.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {reason}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}