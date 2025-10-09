# Robo Advisor App Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from modern fintech applications like Robinhood, Wealthfront, and Betterment, combined with productivity tools like Linear for clean data presentation.

## Core Design Elements

### Color Palette

**Primary Colors:**

- Brand Primary: 14 88% 35% (deep green for trust and growth)
- Brand Secondary: 220 15% 25% (sophisticated dark blue-gray)

**Dark Mode:**

- Background: 220 13% 9%
- Surface: 220 13% 13%
- Text Primary: 220 9% 96%
- Text Secondary: 220 9% 78%

**Light Mode:**

- Background: 0 0% 100%
- Surface: 220 14% 96%
- Text Primary: 220 26% 14%
- Text Secondary: 220 9% 46%

**Accent Colors:**

- Success: 142 71% 45% (portfolio gains)
- Warning: 38 92% 50% (moderate risk)
- Error: 0 84% 60% (high risk alerts)

### Typography

- **Primary Font**: Inter (Google Fonts) - clean, professional fintech standard
- **Headings**: Inter Medium/Semibold (24px, 20px, 18px, 16px)
- **Body Text**: Inter Regular (16px, 14px)
- **Data/Numbers**: Inter Medium for emphasis on financial figures

### Layout System

**Spacing Units**: Tailwind units of 2, 4, 6, 8, 12, 16

- Consistent spacing: p-4, m-6, gap-8
- Component padding: p-6 for cards, p-8 for main sections
- Section margins: mb-12, mt-16 for major page divisions

### Component Library

**Navigation:**

- Clean left sidebar with subtle hover states
- Mobile: Collapsible bottom navigation
- Logo placement: Top-left with brand mark

**Forms:**

- Rounded input fields (rounded-lg) with subtle borders
- Focus states with brand primary color
- Multi-step progress indicator for questionnaire
- Clear form validation states

**Data Displays:**

- Card-based layout with subtle shadows
- Chart integration using Chart.js for portfolio visualization
- Progress bars for risk tolerance display
- Clean table design for portfolio breakdown

**Interactive Elements:**

- Primary buttons: Solid brand primary with white text
- Secondary buttons: Outline style with brand primary border
- Chat interface: Modern messaging UI with user/AI message distinction

### Landing Page Design

**Hero Section:**

- Gradient background: 220 15% 25% to 14 88% 35%
- Clean typography hierarchy
- Single focused CTA: "Get Started" button
- Subtitle emphasizing AI-powered portfolio recommendations

**Key Sections (Maximum 4):**

1. Hero with value proposition
2. How it works (3-step process)
3. Trust indicators (security, AI technology)
4. Final CTA section

**Visual Treatment:**

- Minimal gradients on hero background
- Clean icons for feature highlights
- Professional imagery showing financial growth
- Generous whitespace for premium feel

### Dashboard Design

- Left sidebar navigation (collapsible on mobile)
- Main content area with card-based layout
- Clear visual hierarchy for financial data
- Consistent spacing using 6, 8, 12 unit system

### Portfolio Visualization

- Donut charts for asset allocation
- Line charts for historical performance
- Color-coded risk indicators
- Clean data tables with proper typography hierarchy

### Chat Interface

- Modern messaging design
- Clear distinction between user and AI messages
- Subtle animations for message appearance
- Integration within portfolio page layout

### Images

**Hero Image**: Abstract financial growth visualization or clean geometric patterns representing portfolio diversity
**Feature Icons**: Simple line icons for security, AI, and portfolio features
**No large product screenshots**: Focus on clean, abstract representations of financial concepts

The design emphasizes trust, professionalism, and clarity - essential for financial applications while maintaining modern, approachable aesthetics suitable for both web and mobile platforms.

## Responsive Design Principles

### Breakpoints

Following Tailwind CSS default breakpoints:

- **sm**: 640px - Small tablets and large phones
- **md**: 768px - Tablets and small desktops
- **lg**: 1024px - Desktops
- **xl**: 1280px - Large desktops
- **2xl**: 1536px - Extra large screens

### Mobile-First Approach

- Start with mobile layout and progressively enhance for larger screens
- Sidebar collapses to icon-only view on tablets (768px-1024px)
- Full sidebar navigation on desktop (1024px+)
- Bottom navigation bar for mobile devices (< 768px)

### Responsive Component Behavior

- **Dashboard Cards**: Single column on mobile, 2 columns on tablet, 3 columns on desktop
- **Charts**: Full-width on mobile, responsive containers maintain aspect ratios
- **Forms**: Stacked labels on mobile, side-by-side on desktop where appropriate
- **Data Tables**: Horizontal scroll on mobile, full layout on desktop

## Animation & Motion Design

### Animation Principles

- **Purposeful**: Animations guide user attention and provide feedback
- **Performant**: Use CSS transforms and opacity for smooth 60fps animations
- **Subtle**: Keep durations short (150ms-300ms) for micro-interactions
- **Consistent**: Use the same timing functions across similar interactions

### Standard Transitions

```css
/* Quick interactions (buttons, hovers) */
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* Modal and dialog appearances */
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Page transitions and larger movements */
transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Specific Animations

- **Button Hover**: Scale (1.02), slight shadow increase
- **Card Hover**: Subtle lift with shadow elevation
- **Loading States**: Skeleton loaders with shimmer effect
- **Message Appearance**: Slide up with fade-in for chat messages
- **Chart Rendering**: Progressive data point drawing
- **Notification Toast**: Slide in from bottom-right with fade

### Loading States

- **Skeleton Screens**: Use for dashboard cards and charts during data fetch
- **Spinner**: For button loading states (inline with text)
- **Progress Bars**: For multi-step forms (risk assessment)
- **Shimmer Effect**: Animated gradient overlay on skeleton elements

## Accessibility Guidelines

### WCAG 2.1 Level AA Compliance

#### Color Contrast

- **Text on Background**: Minimum 4.5:1 ratio for normal text
- **Large Text**: Minimum 3:1 ratio (18pt+ or 14pt+ bold)
- **Interactive Elements**: Minimum 3:1 ratio against background
- **Focus Indicators**: High contrast, minimum 2px outline

#### Keyboard Navigation

- **Tab Order**: Logical flow matching visual layout
- **Focus Visible**: Clear focus states on all interactive elements
- **Skip Links**: "Skip to main content" for screen readers
- **Keyboard Shortcuts**: Escape to close modals/dialogs

#### Screen Reader Support

- **Semantic HTML**: Proper heading hierarchy (h1 → h6)
- **ARIA Labels**: Descriptive labels for icon buttons and links
- **ARIA Live Regions**: For dynamic content updates (chat, notifications)
- **Alt Text**: Descriptive text for all meaningful images
- **Form Labels**: Explicit associations between labels and inputs

#### Visual Accessibility

- **Font Sizes**: Minimum 14px for body text, 16px preferred
- **Line Height**: 1.5 for body text, 1.2 for headings
- **Focus Indicators**: Never remove outline without alternative
- **Color Independence**: Never rely solely on color to convey information
- **Animation Respect**: Honor prefers-reduced-motion media query

### Dark Mode Considerations

- **Contrast Testing**: Ensure AA compliance in both themes
- **Color Adjustments**: Slightly desaturated colors in dark mode
- **Shadow Alternatives**: Use borders or subtle glows instead of shadows
- **Image Handling**: Adjust image opacity or provide dark-specific assets

## Component Specifications

### Button Variants

**Primary Button**

- Background: Brand primary color (hsl(14 88% 35%))
- Text: White
- Border: None
- Hover: Darken 10%, scale(1.02)
- Active: Darken 15%, scale(0.98)
- Disabled: 50% opacity, no interactions

**Secondary Button**

- Background: Transparent
- Text: Brand primary color
- Border: 2px solid brand primary
- Hover: Light background tint, scale(1.02)
- Active: Darker background tint, scale(0.98)

**Destructive Button**

- Background: Error color (hsl(0 84% 60%))
- Text: White
- Usage: Delete actions, dangerous operations

**Ghost Button**

- Background: Transparent
- Text: Text primary color
- Hover: Subtle background overlay
- Usage: Tertiary actions

### Input Fields

**Standard Input**

- Border: 1px solid border color
- Border Radius: 8px (rounded-lg)
- Padding: 12px 16px
- Font Size: 16px (prevents zoom on iOS)
- Focus: 2px border, brand primary color

**Error State**

- Border: Error color
- Helper Text: Error color, below input
- Icon: Warning/error icon on right

**Success State**

- Border: Success color
- Icon: Checkmark on right

**Disabled State**

- Background: Muted background
- Opacity: 60%
- Cursor: not-allowed

### Card Component

**Base Card**

- Background: Surface color
- Border Radius: 12px (rounded-xl)
- Padding: 24px (p-6)
- Shadow: Subtle elevation (shadow-sm)
- Border: 1px solid border color

**Interactive Card**

- Add hover effect: shadow-md, scale(1.01)
- Cursor: pointer
- Transition: 150ms ease

**Card Header**

- Title: Font size 20px, semibold
- Description: Font size 14px, muted color
- Margin bottom: 16px

### Modal/Dialog

**Overlay**

- Background: Black with 50% opacity
- Z-index: 50
- Backdrop blur: Optional for modern browsers

**Content Container**

- Max Width: 500px for standard, 800px for wide
- Background: Surface color
- Border Radius: 16px
- Padding: 32px
- Shadow: Large elevation (shadow-2xl)

**Close Button**

- Position: Top-right
- Size: 32px × 32px
- Icon: X or Close icon
- Keyboard: Escape key to close

### Navigation Sidebar

**Desktop Layout (1024px+)**

- Width: 256px (16rem)
- Background: Surface color
- Border: Right border, 1px
- Padding: 16px

**Tablet Layout (768px-1024px)**

- Width: 64px (icon-only)
- Collapsible to full width on click
- Icons centered, no text labels

**Mobile Layout (<768px)**

- Hidden by default
- Overlay when opened (full-screen)
- Close on navigation or outside click

**Navigation Items**

- Height: 40px
- Padding: 8px 12px
- Border Radius: 8px
- Active State: Primary background tint
- Hover: Subtle background overlay

## Data Visualization Standards

### Chart Color Palette

Using CSS variable tokens for consistency:

- **Chart 1**: hsl(var(--chart-1)) - Primary blue for main data
- **Chart 2**: hsl(var(--chart-2)) - Secondary teal for comparisons
- **Chart 3**: hsl(var(--chart-3)) - Accent orange for highlights
- **Chart 4**: hsl(var(--chart-4)) - Neutral gray for supplementary
- **Chart 5**: hsl(var(--chart-5)) - Purple for additional categories

### Chart Design Principles

- **Minimal Decoration**: Remove chartjunk, focus on data
- **Clear Labels**: All axes labeled with units
- **Responsive**: Charts resize smoothly, maintain readability
- **Tooltips**: Show detailed data on hover
- **Legend**: Clear, positioned to not obscure data
- **Grid Lines**: Subtle, light color, spaced appropriately

### Specific Chart Types

**Donut Chart (Portfolio Allocation)**

- Inner Radius: 60% of outer radius
- Padding Angle: 2 degrees between segments
- Labels: Outside with connecting lines, or in legend
- Center: Display total value or primary metric

**Line Chart (Performance)**

- Line Width: 2px
- Data Points: Hidden on desktop, visible on mobile
- Fill: Optional gradient fill below line
- Axes: X-axis (time) at bottom, Y-axis (value) at left
- Grid: Horizontal lines only for value reference

**Bar Chart (Annual Returns)**

- Bar Spacing: 8px gap
- Corner Radius: 4px on top corners
- Color Coding: Green for positive, red for negative
- Labels: Value displayed on or above bars

## Form Design Standards

### Multi-Step Forms (Risk Assessment)

**Progress Indicator**

- Type: Step dots or progress bar
- Position: Top of form container
- Visual: Current step highlighted, completed steps checkmarked
- Navigation: Allow backward navigation, forward on validation

**Step Layout**

- Title: H2, clear question or section name
- Description: Optional helper text
- Input Area: Single focus per step
- Navigation: Back/Next buttons at bottom
- Validation: Real-time for individual inputs, full on next

### Form Validation

**Inline Validation**

- Trigger: On blur for text inputs, on change for selections
- Success: Green checkmark, subtle border highlight
- Error: Red border, error message below input
- Message: Clear, actionable guidance for correction

**Form-Level Validation**

- Trigger: On submit attempt
- Display: Error summary at top of form
- Focus: Auto-focus first error field
- Persistence: Errors clear on successful correction

## Icon System

### Icon Library

Using **Lucide React** for consistent, modern icons

### Icon Sizing

- **Small**: 16px (h-4 w-4) - Inline with text
- **Medium**: 20px (h-5 w-5) - Standard UI icons
- **Large**: 24px (h-6 w-6) - Emphasized actions
- **XL**: 32px (h-8 w-8) - Feature highlights

### Icon Usage

- **Navigation**: Home, Chart, Settings, User icons
- **Actions**: Plus, Edit, Trash, Save, Download
- **Status**: Check, X, Alert, Info, Warning
- **Financial**: TrendingUp, TrendingDown, DollarSign, PieChart
- **User Feedback**: Checkmark for success, X for error

### Icon Styling

- Stroke Width: 2px (default Lucide)
- Color: Inherit from parent or explicit color class
- Interactive: Same hover/active states as text
- Accessibility: ARIA labels when icon is sole indicator

## Error Handling & User Feedback

### Error States

**Form Errors**

- Inline validation messages
- Field-level error highlighting
- Scroll to first error on submit

**API Errors**

- Toast notification for transient errors
- Error boundary for catastrophic failures
- Retry button for network issues
- Friendly error messages (avoid technical jargon)

**Empty States**

- Illustrative icon or image
- Clear message explaining state
- Call-to-action button to resolve
- Examples: No portfolio yet, no chat history

### Success Feedback

**Toast Notifications**

- Position: Bottom-right
- Duration: 4 seconds (dismissible)
- Animation: Slide in from right
- Content: Icon + message + optional action

**Inline Success**

- Green checkmark on form completion
- Success banner after portfolio generation
- Checkmark animation on save

### Loading Feedback

**Skeleton Loaders**

- Match shape of final content
- Shimmer animation (left to right)
- Gray background with lighter gradient

**Spinners**

- Size matches context (button spinner smaller)
- Position inline with action
- Color matches brand primary

## Performance Considerations

### Optimization Strategies

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: WebP format, responsive images
- **Caching**: React Query caching for API responses
- **Debouncing**: Search and filter inputs debounced (300ms)
- **Virtualization**: For long lists (consider future feature)
- **Bundle Size**: Monitor and optimize package imports

### Perceived Performance

- **Optimistic Updates**: Update UI before API confirmation
- **Skeleton Screens**: Show structure immediately
- **Progressive Enhancement**: Core functionality works, enhancements layer on
- **Instant Feedback**: Acknowledge all user actions within 100ms

## Design Tokens Reference

### Spacing Scale (Tailwind)

- **1 unit** = 4px
- Common: p-2 (8px), p-4 (16px), p-6 (24px), p-8 (32px)
- Gaps: gap-2, gap-4, gap-6 for flex/grid
- Margins: mb-4, mt-6, mx-auto

### Border Radius Scale

- **sm**: 4px - Small elements, tags
- **default**: 6px - Standard inputs, buttons
- **lg**: 8px - Cards, large buttons
- **xl**: 12px - Modal, dialog
- **2xl**: 16px - Hero sections
- **full**: 9999px - Pills, circular buttons

### Shadow Elevation

- **sm**: Subtle - Cards at rest
- **default**: Standard - Elevated cards
- **md**: Medium - Dropdowns, tooltips
- **lg**: Large - Modals, dialogs
- **xl**: Extra large - Overlays
- **2xl**: Maximum - Critical modals

## Brand Voice & Messaging

### Tone of Voice

- **Professional**: Financial credibility and trust
- **Approachable**: Not intimidating, welcoming to beginners
- **Confident**: Clear guidance without being pushy
- **Educational**: Explain concepts without jargon
- **Transparent**: Honest about risks and limitations

### Writing Guidelines

- Use active voice: "Generate your portfolio" not "Your portfolio will be generated"
- Short sentences: Maximum 20 words for body text
- Headings: Clear, descriptive, benefit-focused
- Calls-to-action: Action verbs (Start, Create, Explore, Discover)
- Error messages: Empathetic, solution-oriented
- Financial disclaimers: Required legal language, but clearly separated
