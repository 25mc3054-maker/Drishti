# 🎨 Drishti Agent - Design System

## Color Palette

### Primary Colors (Google Gemini Inspired)

```css
/* Deep Blue Background */
--bg-primary: #001429;
--bg-secondary: #002952;
--bg-tertiary: #003d7a;

/* Gemini Blue Accents */
--blue-50: #e6f1ff;
--blue-100: #b3d9ff;
--blue-200: #80c1ff;
--blue-300: #4da9ff;
--blue-400: #1a91ff;
--blue-500: #0066CC;
--blue-600: #0052a3;
--blue-700: #003d7a;
--blue-800: #002952;
--blue-900: #001429;

/* Semantic Colors */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;
```

### Usage Guidelines

**Backgrounds:**
- Main app background: `#001429` with gradient overlay
- Cards/panels: Glass effect with `rgba(0, 82, 163, 0.1)`
- Hover states: `rgba(26, 145, 255, 0.15)`

**Text:**
- Primary text: `#FFFFFF`
- Secondary text: `#b3d9ff` (gemini-blue-100)
- Tertiary text: `#80c1ff` (gemini-blue-200)

**Borders:**
- Default: `rgba(26, 145, 255, 0.2)`
- Focus: `rgba(26, 145, 255, 0.5)`
- Active: `rgba(26, 145, 255, 0.8)`

## Typography

### Font Family

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 3.75rem (60px) | 700 | 1.2 |
| H2 | 3rem (48px) | 700 | 1.2 |
| H3 | 2rem (32px) | 600 | 1.3 |
| H4 | 1.5rem (24px) | 600 | 1.4 |
| Body Large | 1.125rem (18px) | 400 | 1.6 |
| Body | 1rem (16px) | 400 | 1.6 |
| Body Small | 0.875rem (14px) | 400 | 1.5 |
| Caption | 0.75rem (12px) | 400 | 1.4 |

## Components

### Glass Effect Card

```css
.glass-effect {
  background: rgba(0, 82, 163, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(26, 145, 255, 0.2);
  border-radius: 1rem;
}
```

### Gradient Button

```css
.btn-primary {
  background: linear-gradient(135deg, #1a91ff 0%, #0066CC 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 0 20px rgba(26, 145, 255, 0.3);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  box-shadow: 0 0 30px rgba(26, 145, 255, 0.5);
  transform: translateY(-2px);
}
```

### Status Badges

```tsx
// Severity badges
<span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-100">
  Low
</span>

<span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-sm text-yellow-100">
  Medium
</span>

<span className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-sm text-orange-100">
  High
</span>

<span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-sm text-red-100">
  Critical
</span>
```

## Animations

### Fade In

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}
```

### Slide Up

```css
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-up {
  animation: slideUp 0.5s ease-out;
}
```

### Pulse Glow

```css
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(26, 145, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 40px rgba(26, 145, 255, 0.8);
  }
}

.pulse-glow {
  animation: pulseGlow 2s ease-in-out infinite;
}
```

## Spacing System

Based on 4px base unit:

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Minimal padding/margin |
| sm | 8px | Small spacing |
| md | 16px | Default spacing |
| lg | 24px | Section spacing |
| xl | 32px | Large spacing |
| 2xl | 48px | Extra large spacing |
| 3xl | 64px | Hero sections |

## Responsive Breakpoints

```css
/* Mobile first approach */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

## Icons

Using **Lucide React** for consistent iconography:

### Common Icons

| Context | Icon |
|---------|------|
| Upload | `<Upload />` |
| Analysis | `<Brain />` |
| Success | `<CheckCircle2 />` |
| Error | `<AlertTriangle />` |
| Loading | `<Loader2 />` |
| Target | `<Target />` |
| Growth | `<TrendingUp />` |
| Code | `<Code2 />` |
| Vision | `<Eye />` |
| Sparkle | `<Sparkles />` |

### Size Guidelines

- Small: `w-4 h-4` (16px)
- Medium: `w-5 h-5` (20px)
- Large: `w-6 h-6` (24px)
- XL: `w-8 h-8` (32px)

## Layout Patterns

### Dashboard Grid

```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Metric cards */}
</div>
```

### Content Container

```tsx
<div className="container mx-auto px-4 py-8 max-w-7xl">
  {/* Content */}
</div>
```

### Two Column Layout

```tsx
<div className="grid lg:grid-cols-2 gap-8">
  <div>{/* Left column */}</div>
  <div>{/* Right column */}</div>
</div>
```

## Accessibility

### Focus States

```css
.focusable:focus {
  outline: 2px solid #1a91ff;
  outline-offset: 2px;
}
```

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Dark Mode (Default)

The entire application uses a dark theme by default, optimized for:
- Reduced eye strain
- Professional appearance
- Better contrast for data visualization
- Modern aesthetic

## Best Practices

### Visual Hierarchy

1. **Primary actions:** Bright blue gradient buttons
2. **Secondary actions:** Subtle outline buttons
3. **Tertiary actions:** Text-only buttons

### Consistent Spacing

- Use Tailwind's spacing scale consistently
- Maintain visual rhythm with multiples of 8px
- Keep adequate whitespace for breathing room

### Loading States

Always show feedback:
- Skeleton screens for content
- Spinners for actions
- Progress bars for lengthy operations

### Error States

Make errors clear and actionable:
- Red accent color
- Clear error message
- Suggested action/fix

---

**Design Philosophy:** Clean, professional, and accessible while maintaining visual excitement through subtle animations and gradients.
