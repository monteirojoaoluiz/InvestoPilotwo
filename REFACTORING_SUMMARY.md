# Risk Assessment Component Refactoring

## Overview

The RiskAssessment component has been split into smaller, more manageable components to improve maintainability and reusability.

## New Component Structure

### Directory: `client/src/components/risk-assessment/`

#### 1. **types.ts**

- Defines shared TypeScript types: `AssessmentAnswers`, `RadioOption`, `Question`
- Used across all risk assessment components

#### 2. **questions.ts**

- Contains the `QUESTIONS` array with all 14 assessment questions
- Exports `OPTION_SHORTCUTS` for keyboard navigation
- Centralizes questionnaire configuration

#### 3. **AssessmentProgress.tsx**

- Displays the assessment progress header
- Shows current step counter (e.g., "Step 3 of 14")
- Renders progress bar visualization

#### 4. **QuestionCard.tsx**

- Renders individual question with options
- Handles both radio button and checkbox question types
- Supports keyboard shortcuts for quick selection
- Accepts `children` prop for embedding navigation buttons

#### 5. **NavigationButtons.tsx**

- Contains Previous/Next navigation buttons
- Handles button states (disabled, loading)
- Shows appropriate text ("Next", "Complete Profile", "Saving...")

#### 6. **ProfileConfirmDialog.tsx**

- Shows confirmation dialog when user has existing profile
- Displays current profile using `ProfileDisplay` component
- Offers "Keep Current Profile" or "Modify Profile" options

#### 7. **index.ts**

- Barrel export file for cleaner imports
- Re-exports all components, types, and constants

### Standalone Component

#### **ProfileDisplay.tsx** (in `client/src/components/`)

- Reusable component for displaying investor profile
- Shows risk tolerance, risk capacity, investment horizon, etc.
- Used in both Dashboard and ProfileConfirmDialog
- Consistent styling with color-coded sections

## Main RiskAssessment Component

The main `RiskAssessment.tsx` component is now much simpler:

- Manages state and business logic
- Orchestrates smaller components
- Handles keyboard navigation
- Checks for existing profile and shows confirmation dialog
- Submits assessment data to API

## Benefits

1. **Improved Maintainability**: Each component has a single responsibility
2. **Better Reusability**: `ProfileDisplay` can be used anywhere
3. **Easier Testing**: Smaller components are easier to test in isolation
4. **Better Organization**: Related code is grouped in dedicated directory
5. **Cleaner Imports**: Barrel exports make imports simpler
6. **Reduced File Size**: Main component went from 642 lines to ~150 lines

## Usage Examples

```tsx
// Import from main component
import RiskAssessment from "./components/RiskAssessment";

// Use in your app
<RiskAssessment onComplete={handleComplete} />

// Import ProfileDisplay separately
import ProfileDisplay from "./components/ProfileDisplay";

// Use ProfileDisplay anywhere
<ProfileDisplay investorProfile={profile} />
```

## Features Added

### Profile Modification Confirmation

When a user navigates to the investor profile page and already has an existing profile:

1. A dialog appears showing their current profile
2. User can choose to "Keep Current Profile" or "Modify Profile"
3. If they choose to modify, the assessment form loads
4. If they keep current, they remain on the page without the form

This prevents accidental overwrites and gives users visibility into their existing settings.
