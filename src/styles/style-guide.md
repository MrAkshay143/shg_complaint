# Modern Colorful Design System - Style Guide

## Overview
This design system provides a vibrant, modern, and accessible frontend for the Complaint Management System while preserving all existing functionality.

## Design Principles
- **Vibrant & Colorful**: Rich color palette with gradients and glass morphism effects
- **Modern & Clean**: Contemporary design with smooth animations and transitions
- **Accessible**: WCAG 2.1 compliant with proper contrast ratios and keyboard navigation
- **Responsive**: Mobile-first design with breakpoints for all device sizes
- **Performance-Optimized**: Minimal CSS, compressed assets, and lazy loading

## Color Palette

### Primary Colors (Blue-Purple Gradient)
- `--color-primary-50`: #f5f3ff (Lightest)
- `--color-primary-500`: #8b5cf6 (Primary)
- `--color-primary-600`: #7c3aed (Hover)
- `--color-primary-700`: #6d28d9 (Active)
- `--color-primary-900`: #4c1d95 (Darkest)

### Secondary Colors (Coral Pink)
- `--color-secondary-50`: #fff7ed
- `--color-secondary-500`: #f97316
- `--color-secondary-600`: #ea580c
- `--color-secondary-700`: #c2410c

### Success Colors (Emerald Green)
- `--color-success-50`: #ecfdf5
- `--color-success-500`: #10b981
- `--color-success-600`: #059669

### Info Colors (Sky Blue)
- `--color-info-50`: #f0f9ff
- `--color-info-500`: #0ea5e9
- `--color-info-600`: #0284c7

### Warning Colors (Amber)
- `--color-warning-50`: #fffbeb
- `--color-warning-500`: #f59e0b
- `--color-warning-600`: #d97706

### Error Colors (Rose Red)
- `--color-error-50`: #fff1f2
- `--color-error-500`: #f43f5e
- `--color-error-600`: #e11d48

## Typography

### Font Families
- **Primary**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Mono**: 'Fira Code', 'Monaco', 'Consolas', monospace

### Font Sizes
- `--font-size-xs`: 0.75rem (12px)
- `--font-size-sm`: 0.875rem (14px)
- `--font-size-base`: 1rem (16px)
- `--font-size-lg`: 1.125rem (18px)
- `--font-size-xl`: 1.25rem (20px)
- `--font-size-2xl`: 1.5rem (24px)
- `--font-size-3xl`: 1.875rem (30px)
- `--font-size-4xl`: 2.25rem (36px)

### Font Weights
- `--font-weight-normal`: 400
- `--font-weight-medium`: 500
- `--font-weight-semibold`: 600
- `--font-weight-bold`: 700

## Spacing System

### Base Spacing Scale
- `--space-1`: 0.25rem (4px)
- `--space-2`: 0.5rem (8px)
- `--space-3`: 0.75rem (12px)
- `--space-4`: 1rem (16px)
- `--space-5`: 1.25rem (20px)
- `--space-6`: 1.5rem (24px)
- `--space-8`: 2rem (32px)
- `--space-10`: 2.5rem (40px)
- `--space-12`: 3rem (48px)
- `--space-16`: 4rem (64px)
- `--space-20`: 5rem (80px)
- `--space-24`: 6rem (96px)

## Border Radius

### Radius Scale
- `--radius-sm`: 0.125rem (2px)
- `--radius-base`: 0.25rem (4px)
- `--radius-md`: 0.375rem (6px)
- `--radius-lg`: 0.5rem (8px)
- `--radius-xl`: 0.75rem (12px)
- `--radius-2xl`: 1rem (16px)
- `--radius-3xl`: 1.5rem (24px)
- `--radius-full`: 9999px (Pill)

## Shadows

### Shadow Scale
- `--shadow-sm`: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- `--shadow-base`: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
- `--shadow-md`: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
- `--shadow-lg`: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
- `--shadow-xl`: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
- `--shadow-2xl`: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

## Glass Morphism Effects

### Glass Properties
- `--glass-blur`: 16px
- `--glass-border`: 1px solid rgba(255, 255, 255, 0.2)
- `--glass-shadow`: 0 8px 32px rgba(0, 0, 0, 0.1)
- `--glass-backdrop-filter`: blur(16px) saturate(180%)

## Animation System

### Duration
- `--duration-150`: 150ms
- `--duration-200`: 200ms
- `--duration-300`: 300ms
- `--duration-500`: 500ms
- `--duration-700`: 700ms
- `--duration-1000`: 1000ms

### Easing Functions
- `--ease-in`: cubic-bezier(0.4, 0, 1, 1)
- `--ease-out`: cubic-bezier(0, 0, 0.2, 1)
- `--ease-in-out`: cubic-bezier(0.4, 0, 0.2, 1)
- `--ease-bounce`: cubic-bezier(0.68, -0.55, 0.265, 1.55)

### Keyframe Animations
- **Float**: Gentle floating animation for decorative elements
- **Pulse**: Subtle pulsing for active states
- **Bounce**: Bouncing animation for notifications
- **Slide In/Out**: Smooth slide animations for modals and panels
- **Fade In/Out**: Opacity transitions for overlays and content

## Component Patterns

### Buttons
- **Primary**: Blue-purple gradient background with white text
- **Secondary**: Coral pink background with white text
- **Success**: Emerald green for positive actions
- **Warning**: Amber for caution actions
- **Error**: Rose red for destructive actions
- **Ghost**: Transparent background with colored border

### Cards
- **Default**: White background with subtle shadow
- **Glass**: Semi-transparent with backdrop blur
- **Gradient**: Gradient background with glass overlay
- **Bordered**: Colored border with white background

### Forms
- **Inputs**: Rounded corners with focus rings
- **Labels**: Clear typography with proper spacing
- **Validation**: Color-coded feedback with icons
- **Groups**: Logical grouping with visual separation

### Navigation
- **Rail**: Vertical navigation with icons and labels
- **Header**: Horizontal navigation with user menu
- **Breadcrumbs**: Hierarchical navigation with separators
- **Tabs**: Horizontal tab navigation with active indicators

## Accessibility Guidelines

### Color Contrast
- All text meets WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have sufficient contrast in all states
- Focus indicators are clearly visible with 3:1 contrast ratio

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus order follows logical reading order
- Skip links provided for main content navigation
- Custom focus styles for better visibility

### Screen Reader Support
- Semantic HTML structure with proper heading hierarchy
- ARIA labels and descriptions where needed
- Live regions for dynamic content updates
- Alternative text for all images and icons

### Motion Preferences
- Respects `prefers-reduced-motion` user preference
- Animations can be disabled via system settings
- Essential animations only for user feedback

## Responsive Breakpoints

### Mobile First Approach
- **Mobile**: 320px - 767px (Base styles)
- **Tablet**: 768px - 1023px (`@media (min-width: 768px)`)
- **Desktop**: 1024px - 1279px (`@media (min-width: 1024px)`)
- **Large Desktop**: 1280px+ (`@media (min-width: 1280px)`)

### Responsive Patterns
- Fluid typography using `clamp()` functions
- Flexible grid systems with CSS Grid and Flexbox
- Responsive images with proper aspect ratios
- Touch-friendly tap targets on mobile devices

## Performance Optimization

### CSS Optimization
- Minimal, focused CSS files per page/component
- CSS custom properties for efficient theming
- Purge unused styles in production builds
- Minified and compressed CSS delivery

### Asset Optimization
- SVG icons for scalability and small file size
- Compressed images with modern formats (WebP)
- Lazy loading for non-critical assets
- CDN delivery for static assets

### JavaScript Performance
- No JavaScript changes required (preserved existing functionality)
- CSS-only animations where possible
- Efficient DOM updates and event handling

## Implementation Notes

### File Structure
```
src/styles/
├── new-design-tokens.css    # Color, spacing, typography tokens
├── new-base-styles.css      # Base utilities and components
├── pages/                   # Per-page styles
│   ├── login.css
│   ├── dashboard.css
│   ├── complaints.css
│   ├── masters.css
│   └── reports.css
└── components/              # Component-specific styles
    ├── layout.css
    └── audit-timeline.css
```

### Usage Guidelines
1. Import design tokens first for variable availability
2. Import base styles for utility classes
3. Import page-specific styles for unique layouts
4. Import component styles for reusable components
5. Maintain CSS specificity hierarchy

### Browser Support
- Modern browsers (Chrome 88+, Firefox 85+, Safari 14+, Edge 88+)
- CSS Grid and Flexbox support required
- CSS Custom Properties (CSS Variables) support
- Prefers-color-scheme and prefers-reduced-motion support

## Testing Checklist

### Visual Testing
- [ ] All pages render correctly in light and dark themes
- [ ] Color palette is consistent across all components
- [ ] Animations and transitions work smoothly
- [ ] Glass morphism effects render properly
- [ ] Responsive layouts work at all breakpoints

### Accessibility Testing
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Keyboard navigation works for all interactive elements
- [ ] Focus indicators are clearly visible
- [ ] Screen reader announces content correctly
- [ ] Motion preferences are respected

### Performance Testing
- [ ] CSS files are minified in production
- [ ] Images are compressed and optimized
- [ ] Animations don't cause performance issues
- [ ] Page load times are acceptable
- [ ] No layout shifts during loading

### Functionality Testing
- [ ] All existing JavaScript functionality preserved
- [ ] Form submissions work correctly
- [ ] Navigation and routing function properly
- [ ] Data loading and display work as expected
- [ ] User authentication flows work correctly

This style guide ensures a consistent, modern, and accessible user experience while maintaining the existing functionality of the Complaint Management System.