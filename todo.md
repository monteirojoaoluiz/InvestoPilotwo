# InvestoPilot - Future Improvements & Enhancements

## 🚨 Priority 1: Critical Security & Stability

### Security Hardening
- [x] **Rate Limiting for Authentication**
  - Implement express-rate-limit on `/api/auth/*` endpoints
  - Set: 5 failed login attempts per 15 minutes per IP
  - Set: 3 registration attempts per hour per IP
  
- [x] **Password Reset Flow**
  - Add "Forgot Password" link on login modal
  - Generate secure reset tokens (crypto.randomBytes)
  - Send reset email via SendGrid with 1-hour expiration
  - Create reset password page with token validation
  - Enforce same password requirements as registration

### Input Validation & Sanitization
- [x] **Server-Side Validation Enhancement**
  - Add express-validator to all endpoints
  - Validate email format, password strength server-side
  - Sanitize all text inputs (strip HTML, limit length)
  - Add validation for numeric ranges (percentages, amounts)

### Error Handling & Monitoring
- [x] **Global Error Handler**
  - Implement centralized error handler middleware
  - Log errors with winston or pino
  - Avoid leaking sensitive info in error messages
  - Add error tracking (Sentry or similar)

- [x] **React Error Boundaries**
  - Create ErrorBoundary component wrapping main app
  - Add specific boundaries for Dashboard, Assessment, Chat
  - Implement fallback UI with "Report Issue" button
  - Log errors to monitoring service

## 🔧 Priority 2: Core Feature Enhancements

### Authentication & User Management
- [x] **Profile Management Page**
  - Implement password change with current password verification
  - Addeijhcberkuvkerducbcfnirbdekcgunhutufekdvceuu
   email change with verification email to new address
  - Show account creation date, last login timestamp

- [x] **Account Deletion**
  - Add "Delete Account" button in account settings (with warning)
  - Implement confirmation dialog with password re-entry
  - Cascade delete: risk_assessments, portfolios, messages, sessions
  - Send farewell email notification
  - Add 30-day grace period before permanent deletion (optional)

### Portfolio Features
- [ ] **Asset-Level Details**
  - Add ETF detail modal with expense ratio, holdings, description
  - Display top 10 holdings for each ETF

### Risk Assessment Enhancements
- [x] **Expanded Questionnaire**
  - Add questions about: income stability, emergency fund, debt levels
  - Ask about investment experience and knowledge
  - Include behavioral finance questions (market reactions)
  - Add income and net worth ranges


### AI Chat Enhancements
- [x] **Suggested Questions**
  - Display 3-5 common questions users can click
  - Examples: "Explain my allocation", "How risky is this?"
  - Update suggestions based on portfolio state

## 📊 Priority 3: Analytics & Reporting

### Advanced Portfolio Metrics
- [ ] **Additional Performance Metrics**
  - Calculate and display Maximum Drawdown
  - Add Beta calculation (vs S&P 500)
  - Show Alpha (excess return over benchmark)

- [ ] **Benchmark Comparison**
  - Compare portfolio vs S&P 500, Total Bond Market
  - Show outperformance/underperformance chart
  - Display relative strength over time
  - Add custom benchmark selection

- [ ] **Risk Analytics**
  - Value at Risk (VaR) calculation
  - Display portfolio diversification score

## 🎨 Priority 4: User Experience & Design

### Loading & Performance
- [ ] **Skeleton Loaders**
  - Add skeleton screens for dashboard cards during fetch
  - Implement for charts, portfolio data, risk assessment
  - Use shadcn/ui Skeleton component
  - Match skeleton shape to actual content

### Progressive Web App (PWA)
- [ ] **PWA Implementation**
  - Create web app manifest (manifest.json)
  - Add app icons (192x192, 512x512)
  - Configure service worker for offline functionality
  - Add "Add to Home Screen" prompt
  - Test on iOS and Android devices

### Mobile Optimization
- [x] **Critical Mobile UX Fixes**
  - [x] Fix sidebar visibility on mobile (hamburger menu implemented)
  - [x] Resolve dashboard layout overflow issues (responsive padding and grid)
  - [x] Fix chart responsiveness (pie charts now scale properly)
  - [x] Improve form input usability (44px touch targets, better spacing)

- [x] **Touch & Interaction Improvements**
  - [x] Increase minimum touch target sizes to 44px (buttons, inputs, radio buttons)
  - [x] Add proper spacing between interactive elements (min 8px gaps)
  - [x] Implement touch-friendly radio button design (larger circles, better visual feedback)
  - [x] Add visual feedback for touch interactions (active states, touch-manipulation)
  - [x] Optimize keyboard appearance on mobile (16px font-size to prevent zoom)

- [x] **Navigation & Layout**
  - [x] Add mobile hamburger menu with slide-out sidebar
  - [x] Fix dashboard grid layout for mobile (single column, proper spacing)
  - [x] Optimize card layouts for mobile (responsive padding and spacing)
  - [ ] Implement bottom navigation for primary actions (optional)
  - [ ] Add swipe gestures for navigation between dashboard sections

- [x] **Form-Specific Mobile Enhancements**
  - [x] Improve Risk Assessment form mobile experience
    - [x] Larger radio buttons with better spacing and touch targets
    - [x] Progress indicator that's visible on mobile
    - [x] Better question text wrapping and readability
    - [x] Touch-friendly navigation buttons (44px height, full-width)
  - [x] Optimize Auth Modal for mobile
    - [x] Larger input fields and buttons (44px minimum height)
    - [x] Better keyboard handling (16px font-size)
    - [x] Clear visual hierarchy
  - [x] Enhance Portfolio Chat mobile UX
    - [x] Larger input area and send button (44px height)
    - [x] Better message bubble design for mobile
    - [x] Optimized suggested questions layout

- [x] **Chart & Data Visualization**
  - [x] Make all charts fully responsive (pie chart now scales properly)
  - [x] Optimize chart labels and legends for small screens (responsive containers)
  - [ ] Implement touch-friendly chart interactions
  - [ ] Add horizontal scrolling for wide data tables
  - [ ] Consider alternative chart types for mobile (simpler visualizations)

- [x] **Modal & Dialog Improvements**
  - [x] Ensure all dialogs fit within viewport (95vw width, 90vh height, scrollable)
  - [x] Optimize ETF detail modal for mobile viewing
  - [ ] Implement bottom sheet modals for mobile instead of centered dialogs
  - [ ] Add swipe-to-dismiss functionality for modals

- [ ] **Performance & Loading**
  - [ ] Implement skeleton loaders for mobile (faster perceived performance)
  - [ ] Optimize image loading and lazy loading for mobile networks
  - [ ] Add pull-to-refresh functionality
  - [ ] Ensure smooth animations and transitions on mobile devices

- [x] **Accessibility & Testing**
  - [x] Ensure proper viewport meta tags and responsive breakpoints
  - [x] Add mobile-specific accessibility features (44px touch targets, proper spacing)
  - [x] Prevent unwanted zoom on input focus (16px font-size)
  - [x] Add touch feedback and interaction improvements
  - [ ] Test all forms and interactions on actual mobile devices
  - [ ] Test on various screen sizes and orientations

### Animations & Micro-interactions
- [ ] **Page Transitions**
  - Add smooth fade/slide transitions between routes
  - Implement shared element transitions (Framer Motion)
  - Add loading animations for async operations
  - Create success celebration animations

- [ ] **Button Feedback**
  - Add ripple effect on button clicks
  - Implement loading spinners in buttons during async actions
  - Show checkmark animation on successful actions
  - Add subtle scale transforms on hover

- [ ] **Chart Animations**
  - Animate chart data entry (progressive drawing)
  - Add smooth transitions when data updates
  - Implement tooltip fade-in animations
  - Create attention-grabbing animation for significant changes

### Accessibility Enhancements
- [ ] **Keyboard Navigation**
  - Ensure all interactive elements are keyboard accessible
  - Add visible focus indicators (2px outline)
  - Implement skip navigation links
  - Test with keyboard-only navigation

### Theme & Customization
- [ ] **Theme Persistence**
  - Save theme preference to localStorage
  - Sync theme preference to database (user settings)
  - Respect system theme preference on first visit
  - Add smooth theme transition animation

## 🔒 Priority 8: Compliance & Legal

### Data Privacy & GDPR
- [ ] **GDPR Compliance**
  - Implement "Download My Data" feature
  - Add "Right to be Forgotten" (account deletion)

### Financial Regulations & Disclaimers
- [ ] **Investment Disclaimer**
  - Add prominent disclaimer on all portfolio pages
  - Include "Not Financial Advice" notice
  - Link to SEC investor resources
  - Add risk warnings for volatile assets

- [ ] **Audit Trail**
  - Log all portfolio recommendations with reasoning
  - Store historical risk assessments

## 🧹 Technical Debt & Code Quality

### Refactoring
- [ ] **Code Organization**
  - Extract portfolio allocation logic to separate service
  - Create dedicated auth service class
  - Refactor large components into smaller pieces
  - Establish clear folder structure conventions

- [ ] **Shared Code**
  - Move common types to shared folder
  - Extract reusable utility functions
  - Create shared validation schemas
  - Establish component library patterns

## 🔍 Mobile Audit - Issues & Fixes Needed

### Critical Mobile Issues (P0)

#### Dashboard Layout & Width Problems
- [ ] **Dashboard page too wide on mobile**
  - Dashboard container doesn't properly constrain width on phone screens
  - Cards overflow viewport causing horizontal scroll
  - Issue: `App.tsx:251` - Dashboard wrapper needs better width constraints
  - Fix: Add `max-w-[100vw]` and ensure all child elements respect parent width
  
- [ ] **Performance chart causes horizontal overflow**
  - LineChart has `minWidth={300}` which forces horizontal scroll on screens < 300px
  - Issue: `App.tsx:535` - ResponsiveContainer minWidth property
  - Fix: Remove `minWidth={300}` or use conditional rendering for mobile
  - Alternative: Wrap chart in horizontal scrollable container with scroll indicators

- [ ] **Dashboard grid cards spacing issues**
  - Grid cards (`App.tsx:264`) need tighter spacing on mobile
  - Card content has inconsistent padding across breakpoints
  - Fix: Reduce gap from `gap-4` to `gap-3` on mobile, ensure all cards use `p-3 sm:p-4`

#### Radio Buttons Appearing as Ovals Instead of Circles
- [ ] **Radio buttons not circular on mobile**
  - Radio buttons in RiskAssessment form render as ovals instead of circles
  - Issue: `radio-group.tsx:29` - RadioGroupItem uses `h-4 w-4` (only 16px)
  - Root cause: `aspect-square` not enforced properly, width/height mismatch
  - Fix: Increase size to `h-6 w-6` (24px minimum for touch), add `flex-shrink-0`
  - Ensure `.radio-mobile-circle` CSS class properly applies `border-radius: 50%` and equal width/height
  
- [ ] **Radio buttons too small for touch targets**
  - Current size (16px) is below minimum 44x44px touch target guideline
  - Fix: Increase to at least `h-11 w-11` (44px) with proper spacing
  - Add larger tap area using padding on parent label element

### High Priority Mobile Issues (P1)

#### Form & Input Issues
- [ ] **Risk Assessment form mobile layout**
  - Radio button labels wrap awkwardly on small screens
  - Spacing between options too tight for accurate tapping
  - Issue: `RiskAssessment.tsx:358` - Padding needs adjustment
  - Fix: Increase `p-3 sm:p-4` to `p-4 sm:p-5` for better tap spacing

- [ ] **Input field keyboard handling**
  - Modal inputs might trigger zoom on iOS (fixed with 16px font-size, verify)
  - Input fields in dialogs need better focus/scroll behavior
  - Fix: Test and ensure all inputs use `text-base` (16px) on mobile

#### Chat Component Issues
- [ ] **Portfolio chat message bubbles**
  - Message bubbles use `max-w-[80%]` which can be too wide on small screens
  - Issue: `PortfolioChat.tsx:274` - Responsive max-width needed
  - Fix: Use `max-w-[85%] sm:max-w-[80%]` for better mobile readability

- [ ] **Suggested questions overflow**
  - Suggested questions container (`PortfolioChat.tsx:318`) has horizontal scroll
  - Scroll indicators not visible to users
  - Fix: Add visual scroll indicators (fade gradient on edges)
  - Consider vertical stacking on very small screens

- [ ] **Chat input area mobile optimization**
  - Send button and input need better mobile spacing
  - Issue: `PortfolioChat.tsx:336-345` - Gap between input and button
  - Fix: Increase gap to `gap-3` on mobile for easier interaction

#### Modal & Dialog Issues
- [ ] **ETF Detail modal mobile view**
  - Modal uses `max-w-2xl w-[95vw]` which is good but content might overflow
  - Issue: `App.tsx:479` - DialogContent needs scroll testing
  - Fix: Ensure all content within modal is properly wrapped and scrollable
  - Test with long ETF descriptions and holdings lists

- [ ] **Auth modal on small screens**
  - Modal content might be cramped on phones < 375px width
  - Fix: Add more responsive padding, test on iPhone SE size (320px)
  - Consider reducing modal padding to `p-4` on mobile

### Medium Priority Mobile Issues (P2)

#### Landing Page Mobile Experience
- [ ] **Hero section text sizing**
  - Hero title (`text-5xl md:text-6xl`) might be too large on small screens
  - Issue: `LandingPage.tsx:47` - Text wrapping and spacing
  - Fix: Use `text-4xl sm:text-5xl md:text-6xl` for better mobile scaling

- [ ] **Landing page card layouts**
  - Feature cards could have better mobile spacing
  - Fix: Ensure grid uses `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`
  - Add more vertical spacing between cards on mobile

#### Navigation & Header Issues
- [ ] **Header button spacing on mobile**
  - Header buttons might be too close together on small screens
  - Issue: `Header.tsx:34` - Gap between buttons
  - Fix: Stack buttons vertically or reduce button size on very small screens

- [ ] **Sidebar mobile overlay**
  - Sidebar overlay on mobile needs better backdrop blur
  - Consider adding swipe-to-close gesture for mobile
  - Fix: Test sidebar interaction on various mobile devices

#### Chart & Data Visualization
- [ ] **Pie chart sizing on mobile**
  - Pie chart might be too small or too large on different screen sizes
  - Issue: `App.tsx:335-358` - ResponsiveContainer height and width
  - Fix: Use dynamic sizing based on viewport width
  - Consider min/max constraints for optimal viewing

- [ ] **Chart tooltips on mobile**
  - Chart tooltips (Recharts) might be hard to trigger on touch devices
  - Consider replacing hover tooltips with tap/long-press
  - Fix: Add mobile-specific tooltip trigger behavior

- [ ] **Performance chart data labels**
  - X-axis labels on line chart might overlap on mobile
  - Issue: `App.tsx:538-551` - XAxis tickFormatter
  - Fix: Reduce number of ticks shown on mobile or rotate labels

#### Typography & Readability
- [ ] **Dashboard card titles**
  - Some card titles might be too large on small screens
  - Fix: Review all `text-xl sm:text-2xl` and adjust for mobile
  - Ensure consistent responsive text scaling across dashboard

- [ ] **Muted text contrast**
  - `text-muted-foreground` might have insufficient contrast on mobile in bright light
  - Fix: Test color contrast ratios for WCAG AA compliance
  - Consider slightly darker muted colors for mobile

### Low Priority Mobile Issues (P3)

#### Performance & Optimization
- [ ] **Image loading on mobile networks**
  - Hero image in landing page could be optimized for mobile
  - Issue: `LandingPage.tsx:43` - Background image loading
  - Fix: Add responsive image loading with smaller sizes for mobile

- [ ] **Animation performance on older devices**
  - Some animations might be janky on older mobile devices
  - Fix: Add `will-change` CSS property or reduce animations on mobile
  - Test on older iPhone/Android devices

#### Touch Interactions
- [ ] **Active states for touch feedback**
  - Some buttons lack clear active/pressed states on mobile
  - Fix: Ensure all interactive elements have `:active` states
  - Add scale transform on press for better feedback

- [ ] **Long-press context menus**
  - Consider adding long-press actions for cards/items on mobile
  - Could provide quick actions without navigation
  - Fix: Implement using touch event handlers

#### Accessibility on Mobile
- [ ] **Focus indicators on mobile**
  - Focus indicators might not be visible when using keyboard on mobile
  - Fix: Enhance focus styles for mobile browsers
  - Test with mobile screen readers (VoiceOver, TalkBack)

- [ ] **Touch target spacing**
  - Verify all interactive elements have minimum 8px spacing between them
  - Issue: Some buttons and links might be too close
  - Fix: Audit all interactive elements for proper spacing

### Testing & Validation
- [ ] **Cross-device testing**
  - Test on iPhone (various sizes: SE, 12/13, 14 Pro Max)
  - Test on Android (Samsung, Pixel)
  - Test on tablets (iPad, Android tablets)
  - Test in landscape and portrait orientations

- [ ] **Browser compatibility**
  - Test on Safari iOS (main browser)
  - Test on Chrome mobile
  - Test on Firefox mobile
  - Verify PWA functionality on mobile

- [ ] **Performance metrics**
  - Measure and optimize Lighthouse mobile scores
  - Target: 90+ performance score on mobile
  - Check for layout shifts (CLS) on mobile
  - Measure Time to Interactive (TTI) on 3G networks