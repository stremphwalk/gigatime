import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea"> & { [key: string]: any }
>(({ className, onInput, onChange, style, ...props }, forwardedRef) => {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
  const setRefs = (el: HTMLTextAreaElement | null) => {
    innerRef.current = el;
    if (typeof forwardedRef === 'function') forwardedRef(el);
    else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
  };

  const MAX_HEIGHT_PX = 360; // reasonable maximum before enabling scroll
  const autosizeDisabled = props['data-no-autosize'] === true || props['data-no-autosize'] === 'true';

  const adjustHeight = React.useCallback(() => {
    const el = innerRef.current;
    if (!el || autosizeDisabled) return;
    // Temporarily reset height to measure full scrollHeight
    el.style.height = 'auto';
    const desired = Math.min(el.scrollHeight, MAX_HEIGHT_PX);
    el.style.height = desired + 'px';
    // Toggle overflow based on cap
    if (el.scrollHeight > MAX_HEIGHT_PX) {
      el.style.overflowY = 'auto';
    } else {
      el.style.overflowY = 'hidden';
    }
  }, [autosizeDisabled]);

  React.useEffect(() => {
    adjustHeight();
  }, [adjustHeight, props.value]);

  const handleInput: React.FormEventHandler<HTMLTextAreaElement> = (e) => {
    adjustHeight();
    if (onInput) onInput(e);
  };
  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    adjustHeight();
    if (onChange) onChange(e);
  };

  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      style={{ ...style, maxHeight: MAX_HEIGHT_PX, overflowY: 'hidden' as const }}
      ref={setRefs}
      onInput={handleInput}
      onChange={handleChange}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
