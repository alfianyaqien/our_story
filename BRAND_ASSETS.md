# Our Story - Brand Assets

## Logo Files

### Primary Logo
- **Full Logo**: `components/Logo.tsx` - Complex flowing wave design with heart
- **Favicon**: `public/favicon.svg` - Optimized SVG for browser tabs
- **App Icon**: `app/icon.tsx` - Dynamic PNG icon generator (32x32)

### Logo Variants
The main Logo component supports three variants:
1. **Full** - Complex flowing wave design with decorative elements (default)
2. **Simple** - Clean circle with gradient and heart
3. **Minimal** - Simplified version for compact spaces

### Logo Sizes
- **Small**: `w-10 h-10` (40x40px) - For buttons, badges
- **Default**: `w-16 h-16` (64x64px) - Standard size
- **Large**: `w-24 h-24` (96x96px) - Hero sections, headers

## Color Palette

### Primary Colors
```
love-sky: #87CEEB     - Sky Blue (Primary)
love-ocean: #4A90E2   - Ocean Blue (Secondary)
love-navy: #2C5AA0    - Navy Blue (Accent)
```

### Supporting Colors
```
love-blue: #6B9FE8    - Soft Blue (Highlights)
love-lavender: #B8C5E6 - Blue Lavender (Muted)
love-ice: #E6F2FF     - Ice Blue (Backgrounds)
```

### Usage Guidelines
- **Primary Actions**: `love-ocean` - Buttons, links
- **Backgrounds**: `love-ice` - Page backgrounds, cards
- **Text**: `love-navy` - Headings, important text
- **Accents**: `love-sky` - Decorative elements, icons
- **Subtle Elements**: `love-lavender` - Dividers, borders

## Gradients

### Blue Gradient
```css
bg-gradient-to-r from-love-sky via-love-ocean to-love-navy
```
Use for: Headers, hero sections, feature highlights

### Light Gradient
```css
bg-gradient-to-br from-love-ice via-love-lavender to-love-sky
```
Use for: Backgrounds, subtle effects

### Button Gradient
```css
bg-gradient-to-r from-love-ocean to-love-navy
hover:from-love-sky hover:to-love-ocean
```
Use for: Primary buttons, CTAs

## Typography

### Headings
- **Font**: System UI font stack
- **Color**: `text-love-navy` or gradient
- **Gradient Effect**: `bg-gradient-to-r from-love-sky via-love-ocean to-love-navy bg-clip-text text-transparent`

### Body Text
- **Color**: `text-gray-700` (default) or `text-love-navy` (emphasis)
- **Size**: Base 16px, adjust with Tailwind utilities

### Tagline
- **Style**: Italic, `text-love-ocean`
- **Example**: "Love, written together"

## Decorative Components

### Available Components (`components/Decorations.tsx`)

1. **WavePattern** - Flowing wave background
   ```tsx
   <WavePattern className="opacity-20" />
   ```

2. **FloatingHearts** - Animated floating hearts
   ```tsx
   <FloatingHearts />
   ```

3. **CornerFlourish** - Decorative corner elements
   ```tsx
   <CornerFlourish position="top-left" />
   ```

4. **GradientOrb** - Gradient orb decoration
   ```tsx
   <GradientOrb size="large" className="absolute -top-32 -right-32" />
   ```

5. **ParticleBackground** - Animated particles
   ```tsx
   <ParticleBackground />
   ```

6. **Divider** - Section dividers with variants
   ```tsx
   <Divider variant="hearts" />
   <Divider variant="wave" />
   ```

7. **DecorativeCard** - Card with built-in decorations
   ```tsx
   <DecorativeCard>
     {/* Your content */}
   </DecorativeCard>
   ```

## Animations

### Available Animations
```css
animate-float      - Floating motion (8s infinite)
animate-shimmer    - Shimmer effect (3s infinite)
animate-fadeIn     - Fade in with slide up (0.5s)
```

### Usage Examples
```tsx
<div className="animate-float">Floating element</div>
<div className="animate-shimmer bg-gradient-to-r">Shimmer effect</div>
<div className="animate-fadeIn">Fade in on load</div>
```

## Icons

### Primary Icons (from lucide-react)
- Heart - Love, favorites
- RefreshCw - Reload, refresh
- ChefHat - Culinary plans
- Mail - Messages, contact
- StickyNote - Notes, memories
- Camera - Photos, gallery

### Icon Style
```tsx
<Heart className="w-6 h-6 text-love-ocean" />
```

## Logo Usage in Code

### Basic Logo
```tsx
import { Logo } from '@/components/Logo'

<Logo size="default" variant="full" />
```

### Logo with Text
```tsx
import { LogoWithText } from '@/components/Logo'

<LogoWithText 
  size="large" 
  showTagline={true}
  className="mb-8"
/>
```

### Brand Mark (Favicon)
```tsx
import { BrandMark } from '@/components/Logo'

<BrandMark size={32} />
```

## Design Principles

1. **Romantic & Modern** - Blend flowing organic shapes with clean lines
2. **Consistent Blue Theme** - Always use colors from the defined palette
3. **Depth & Dimension** - Use gradients and shadows for visual interest
4. **Animation** - Subtle animations for engagement (floating hearts, shimmers)
5. **Whitespace** - Give elements room to breathe
6. **Heart Motif** - Incorporate heart elements throughout the design

## File Structure

```
our_story/
├── components/
│   ├── Logo.tsx              # Main logo component with variants
│   └── Decorations.tsx       # Decorative UI components
├── public/
│   └── favicon.svg           # SVG favicon
├── app/
│   ├── icon.tsx              # Dynamic PNG icon
│   └── layout.tsx            # Metadata configuration
└── tailwind.config.js        # Theme colors & animations
```

## Best Practices

1. **Always use theme colors** - Never hardcode hex values outside config
2. **Mobile-first responsive** - Test all assets on mobile devices
3. **Optimize SVGs** - Keep file sizes small for performance
4. **Accessibility** - Ensure sufficient color contrast (WCAG AA)
5. **Consistency** - Use provided components rather than creating new ones
6. **Performance** - Use animations sparingly, prefer CSS over JS

## Quick Start

```tsx
import { Logo, LogoWithText } from '@/components/Logo'
import { 
  WavePattern, 
  FloatingHearts, 
  Divider 
} from '@/components/Decorations'

export default function Page() {
  return (
    <div className="relative min-h-screen bg-love-ice">
      {/* Background decorations */}
      <WavePattern className="opacity-10" />
      <FloatingHearts />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <LogoWithText size="large" showTagline />
        
        <Divider variant="hearts" />
        
        {/* Your content here */}
      </div>
    </div>
  )
}
```
