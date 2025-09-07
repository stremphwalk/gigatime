# Arinote Brand Assets

This directory contains the official Arinote brand assets including logos, icons, and related brand files.

## Logo Files

The main logo features an "A$" symbol representing Arinote's medical documentation platform:

### Available Sizes:
- `arinote_full_256px.png` - Primary logo (256x256)
- `arinote_icon_32.png` - Small icon (32x32)
- `arinote_icon_192.png` - Medium icon (192x192)
- `arinote_icon_512.png` - Large icon (512x512)
- `arinote_logo.svg` - Scalable vector version
- `pinned-tab.svg` - Safari pinned tab icon

## Brand Colors

The Arinote brand uses a gradient color system:

### Light Mode Gradient:
- Start (0%): #0a0096 (deep purple/blue)
- Middle (37%): #4e4ecf (purple)
- End (78%): #68c6d9 (light blue/teal)

### Dark Mode Gradient:
- Start (0%): #68c6d9 (light blue/teal)
- Middle (37%): #68c6d9 (same as start)
- End (78%): #4e4ecf (purple)

### CSS Implementation:
```css
/* Light Mode */
--brand-from: #0a0096;
--brand-to: #68c6d9;

/* Dark Mode */
--brand-from: #68c6d9;
--brand-to: #4e4ecf;

/* Gradient Classes */
.arinote-gradient {
  background: linear-gradient(90deg, var(--brand-from) 0%, rgba(78, 78, 207, 1) 37%, var(--brand-to) 78%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## Usage Guidelines

### Logo Usage:
- Use the PNG versions for web display
- Use the SVG version for print or scalable applications
- Maintain proper aspect ratio when resizing
- Ensure sufficient contrast against backgrounds

### Component Integration:
- Login page: Uses 256px version in header
- Sidebar: Uses 256px version as brand identifier
- Landing page: Uses PNG with SVG fallback
- Favicons: Uses 32px, 192px, and 512px versions

## File References

These files are referenced in:
- `/client/index.html` (favicon, apple-touch-icon, Open Graph)
- `/client/public/site.webmanifest` (PWA icons)
- `/client/src/pages/login.tsx` (login header)
- `/client/src/components/sidebar.tsx` (app header)
- `/client/src/pages/landing-new.tsx` (landing page logo)

## Technical Notes

- All PNG files are generated from the master SVG
- The logo combines medical documentation (document shape) with financial/value indication ($)
- The gradient matches the overall Arinote brand theme
- Files are optimized for web performance

Last updated: September 2025
