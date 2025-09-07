# Arinote Brand Guidelines

## Logo Description

The Arinote logo features a modern, medical-focused design that combines:
- **Document shape**: A rounded rectangle representing medical documentation
- **"A" letterform**: Bold, geometric design representing "Arinote" 
- **Dollar sign ($)**: Integrated into the "A" to symbolize value and efficiency
- **Medical accent**: Small medical cross element for healthcare context

The logo uses the Arinote brand gradient to create visual interest and modern appeal.

## Color Palette

### Primary Brand Gradient

#### Light Mode
```css
linear-gradient(90deg, #0a0096 0%, #4e4ecf 37%, #68c6d9 78%)
```
- **Start**: `#0a0096` - Deep medical blue/purple
- **Mid**: `#4e4ecf` - Professional purple  
- **End**: `#68c6d9` - Calming medical teal

#### Dark Mode  
```css
linear-gradient(90deg, #68c6d9 0%, #68c6d9 37%, #4e4ecf 78%)
```
- **Start**: `#68c6d9` - Medical teal (inverted)
- **Mid**: `#68c6d9` - Same as start
- **End**: `#4e4ecf` - Professional purple

### Supporting Colors

#### Medical Theme
- **Medical Teal**: `hsl(194 51% 37%)` - `#13b3c4`
- **Professional Blue**: `hsl(211 71% 59%)` - `#4f8bf4` 
- **Clinical White**: `hsl(210 20% 98%)` - `#f8fafc`
- **Success Green**: `hsl(145 63% 42%)` - `#22c55e`
- **Medical Red**: `hsl(0 84% 60%)` - `#ef4444`

## Typography

### Primary Font
- **Inter** - Modern, readable sans-serif for UI elements
- **Weights**: 300, 400, 500, 600, 700

### Accent Fonts
- **Source Serif 4** - For editorial content
- **JetBrains Mono** - For code and technical content

## Logo Usage

### Preferred Usage
1. **Primary Logo**: Use full 256px PNG for main branding
2. **Icon Version**: Use smaller PNG sizes for favicons and compact spaces
3. **Scalable**: Use SVG version for print and high-resolution displays

### Spacing and Sizing
- **Minimum Size**: 24px for icon versions, 64px for full logo
- **Clear Space**: Maintain 1/2 logo height clearance on all sides
- **Aspect Ratio**: Always maintain original proportions

### Background Guidelines
- **Light Backgrounds**: Use standard gradient version
- **Dark Backgrounds**: Use dark mode gradient version  
- **Color Backgrounds**: Ensure sufficient contrast (minimum 4.5:1 ratio)
- **Photography**: Use on solid overlay or ensure high contrast

## Digital Implementation

### Web Components
```css
/* Text Gradient */
.arinote-gradient {
  background: linear-gradient(90deg, var(--brand-from) 0%, rgba(78, 78, 207, 1) 37%, var(--brand-to) 78%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Background Gradient */
.arinote-gradient-bg {
  background: linear-gradient(90deg, var(--brand-from) 0%, rgba(78, 78, 207, 1) 37%, var(--brand-to) 78%);
}
```

### CSS Variables
```css
:root {
  /* Light Mode */
  --brand-from: #0a0096;
  --brand-to: #68c6d9;
  --brand-200: rgba(10, 0, 150, 0.2);
  --brand-600: rgba(78, 78, 207, 1);
}

.dark {
  /* Dark Mode */
  --brand-from: #68c6d9;
  --brand-to: #4e4ecf;
  --brand-200: rgba(104, 198, 217, 0.2);
  --brand-600: rgba(104, 198, 217, 1);
}
```

## File Structure

```
/brand/
├── arinote_logo.svg           # Master scalable version
├── arinote_full_256px.png     # Primary logo (256×256)
├── arinote_icon_32.png        # Small icon (32×32)
├── arinote_icon_192.png       # Medium icon (192×192)  
├── arinote_icon_512.png       # Large icon (512×512)
├── pinned-tab.svg            # Safari pinned tab
├── README.txt                # Technical documentation
└── BRAND_GUIDE.md            # This brand guide
```

## Don'ts

### Logo Modifications
❌ Don't change the gradient colors
❌ Don't separate the "A" from the dollar sign
❌ Don't add drop shadows or effects
❌ Don't rotate or skew the logo
❌ Don't use on insufficient contrast backgrounds

### Typography  
❌ Don't use the brand gradient on body text
❌ Don't use more than 2 font weights in a single component
❌ Don't use fonts other than Inter for UI elements

### Colors
❌ Don't use brand colors for error or warning states
❌ Don't use gradients for small text (under 16px)
❌ Don't combine with competing color schemes

## Brand Voice

### Tone
- **Professional** yet approachable
- **Efficient** and time-saving focused
- **Trustworthy** for healthcare environment
- **Innovative** in medical technology

### Key Messages
- "Transform voice into structured medical documentation"
- "Save time, improve patient care"
- "AI-powered precision for healthcare professionals"
- "Medical documentation made efficient"

---

*Last updated: September 2025*
*Version: 1.0*
