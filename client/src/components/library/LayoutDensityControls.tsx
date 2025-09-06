import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Grid3X3, List } from "lucide-react";

interface Props {
  layout: "grid" | "list";
  onLayoutChange: (v: "grid" | "list") => void;
}

export function LayoutDensityControls({ layout, onLayoutChange }: Props) {
  return (
    <div className="ml-auto flex items-center gap-1">
      <Button size="icon" variant={layout==="grid"?"default":"outline"} className="h-8 w-8" onClick={()=>onLayoutChange("grid")}><Grid3X3 className="h-4 w-4"/></Button>
      <Button size="icon" variant={layout==="list"?"default":"outline"} className="h-8 w-8" onClick={()=>onLayoutChange("list")}><List className="h-4 w-4"/></Button>
    </div>
  );
}
