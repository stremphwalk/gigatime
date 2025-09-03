import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchField({ value, onChange, placeholder = "Search…", className }: SearchFieldProps) {
  return (
    <div className={`relative ${className || ""}`}>
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
      <Input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="pl-8 w-64"/>
    </div>
  );
}

