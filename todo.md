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
- [ ] **Touch Gestures**
  - Add swipe to navigate between dashboard sections
  - Add touch-friendly button sizes (min 44x44px)
  - Optimize tap targets spacing

- [ ] **Mobile-Specific Features**
  - Bottom sheet for mobile modals instead of center dialog
  - Implement native-like navigation transitions
  - Add haptic feedback for important actions (if supported)
  - Optimize chart touch interactions

- [ ] **Responsive Charts**
  - Improve chart readability on small screens
  - Add pinch-to-zoom for line charts
  - Implement horizontal scrolling for dense data
  - Show abbreviated labels on mobile

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