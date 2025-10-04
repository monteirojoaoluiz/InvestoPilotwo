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