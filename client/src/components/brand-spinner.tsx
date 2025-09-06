import React from "react";

export function BrandSpinner({ size = 32 }: { size?: number }) {
  const stroke = "var(--brand-600)";
  const secondary = "var(--brand-200)";
  const s = size;
  const r = (s / 2) - 4;
  const c = 2 * Math.PI * r;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} role="img" aria-label="Loading">
      <circle cx={s/2} cy={s/2} r={r} stroke={secondary} strokeWidth={4} fill="none" />
      <circle
        cx={s/2}
        cy={s/2}
        r={r}
        stroke={stroke}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
        style={{
          strokeDasharray: c,
          strokeDashoffset: c * 0.75,
          transformOrigin: '50% 50%',
          animation: 'arinote-spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes arinote-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </svg>
  );
}

export default BrandSpinner;

