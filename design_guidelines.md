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