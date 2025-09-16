import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { autoUpdate, computePosition, flip, offset, shift, type VirtualElement } from "@floating-ui/dom";
import { getTextareaCaretRect } from "@/lib/caret";

interface FloatingCaretOptions {
  placement?: "bottom-start" | "top-start" | "bottom" | "top";
  gutter?: number;
}

export function useFloatingCaret(
  textareaRef: React.RefObject<HTMLTextAreaElement | null | undefined>,
  opts: FloatingCaretOptions = {}
) {
  const { placement = "bottom-start", gutter = 6 } = opts;

  const floatingRef = useRef<HTMLElement | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  // Virtual reference anchored to the caret rect of the textarea
  const virtualRef = useMemo<VirtualElement | null>(() => {
    if (!textareaRef?.current) return null;
    return {
      getBoundingClientRect() {
        const ta = textareaRef.current!;
        const c = getTextareaCaretRect(ta);
        // Place reference point at caret bottom-left
        return new DOMRect(c.left, c.bottom, 0, 0);
      },
    };
  }, [textareaRef?.current]);

  const update = useCallback(async () => {
    if (!virtualRef || !floatingRef.current) return;
    const { x, y } = await computePosition(virtualRef, floatingRef.current, {
      strategy: "fixed",
      placement,
      middleware: [offset(gutter), flip(), shift()],
    });
    const nx = Math.round(x);
    const ny = Math.round(y);
    setCoords((prev) => (prev && prev.x === nx && prev.y === ny ? prev : { x: nx, y: ny }));
  }, [virtualRef, placement, gutter]);

  useEffect(() => {
    if (!virtualRef || !floatingRef.current) return;

    // Use animationFrame to track caret movement, scrolling, and layout shifts reliably
    const cleanup = autoUpdate(virtualRef, floatingRef.current, update);

    // Also listen for textarea-specific events to prompt an update
    const ta = textareaRef?.current || null;
    const onInput = () => update();
    const onScroll = () => update();
    const onResize = () => update();
    ta?.addEventListener("input", onInput);
    ta?.addEventListener("keyup", onInput);
    ta?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // Initial compute
    update();

    return () => {
      cleanup();
      ta?.removeEventListener("input", onInput);
      ta?.removeEventListener("keyup", onInput);
      ta?.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", onResize);
    };
  }, [virtualRef, update, textareaRef]);

  return {
    floatingRef,
    x: coords?.x ?? 0,
    y: coords?.y ?? 0,
    ready: coords !== null,
  } as const;
}

interface FloatingAnchorOptions {
  placement?: "bottom-start" | "top-start" | "bottom" | "top";
  gutter?: number;
}

// Anchor to the entire textarea element (e.g., show dropdown under the field)
export function useFloatingAnchor(
  anchorRef: React.RefObject<HTMLElement | null | undefined>,
  opts: FloatingAnchorOptions = {}
) {
  const { placement = "bottom-start", gutter = 6 } = opts;

  const floatingRef = useRef<HTMLElement | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  const update = useCallback(async () => {
    if (!anchorRef?.current || !floatingRef.current) return;
    const { x, y } = await computePosition(anchorRef.current, floatingRef.current, {
      strategy: "fixed",
      placement,
      middleware: [offset(gutter), flip(), shift()],
    });
    const nx = Math.round(x);
    const ny = Math.round(y);
    setCoords((prev) => (prev && prev.x === nx && prev.y === ny ? prev : { x: nx, y: ny }));
  }, [anchorRef, placement, gutter]);

  useEffect(() => {
    if (!anchorRef?.current || !floatingRef.current) return;

    const cleanup = autoUpdate(anchorRef.current, floatingRef.current, update);

    const el = anchorRef.current as HTMLElement | null;
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    update();
    return () => {
      cleanup();
      window.removeEventListener("resize", onResize);
    };
  }, [anchorRef, update]);

  return {
    floatingRef,
    x: coords?.x ?? 0,
    y: coords?.y ?? 0,
    ready: coords !== null,
  } as const;
}
