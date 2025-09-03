import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Check } from "lucide-react";

interface Option { value: string; label: string; }
interface FilterDropdownProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  menuLabel?: string;
}

export function FilterDropdown({ label, options, value, onChange, menuLabel }: FilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1"><ChevronsUpDown className="h-4 w-4"/>{label}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {menuLabel && <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>}
        <DropdownMenuSeparator/>
        {options.map(opt => (
          <DropdownMenuItem key={opt.value} onClick={()=>onChange(value===opt.value?"":opt.value)}>
            {value===opt.value && <Check className="mr-2 h-4 w-4"/>}{opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

