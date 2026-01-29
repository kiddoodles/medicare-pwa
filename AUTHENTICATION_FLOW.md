# MediCare Companion - Authentication & Onboarding Flow

## Overview
The application now features a comprehensive authentication and onboarding system that collects detailed patient information.

## Authentication Flow

### 1. Splash Screen (`/`)
- Displays app logo and branding
- 2-second loading animation
- Automatically redirects to:
  - `/signin` if not authenticated
  - `/onboarding` if authenticated but onboarding not completed
  - `/dashboard` if authenticated and onboarding completed

### 2. Sign In Page (`/signin`)
- Username and password fields
- Link to Sign Up page
- Redirects to dashboard after successful login
- Shows error messages for invalid credentials

### 3. Sign Up Page (`/signup`)
- Create new account with username and password
- Username validation (letters, numbers, underscores only, min 3 chars)
- Password validation (min 6 characters)
- Password confirmation
- Link to Sign In page
- Automatically redirects to onboarding after successful signup

## Onboarding Flow

### Step 1: Personal Information
Collects:
- **Full Name** (required)
- **Age** (required, 1-120)
- **Gender** (required)
  - Male
  - Female
  - Other
  - Prefer not to say

### Step 2: Medical Information
Collects:
- **Email Address** (required) - for medication reminders
- **Medical Condition** (required) - primary health condition
  - Hypertension (High Blood Pressure)
  - Diabetes Type 2
  - Heart Disease
  - Asthma
  - Depression
  - Arthritis
  - GERD (Acid Reflux)
  - Thyroid Disorder
  - High Cholesterol
  - COPD
  - Other

**Medication Suggestions Feature:**
- Based on selected condition, displays commonly prescribed medications
- Examples:
  - Hypertension → Lisinopril, Amlodipine, Losartan
  - Diabetes → Metformin, Insulin
  - Heart Disease → Aspirin, Atorvastatin, Metoprolol
- Users can add these medications after completing onboarding

### Step 3: Terms & Consent
Displays:
- Terms and Conditions including:
  - Accurate health information requirement
  - Personal health management usage
  - Healthcare professional consultation disclaimer
  - Secure data storage
  - Medication reminders consent
- Privacy policy highlights
- Medical disclaimer

Requires:
- **Consent Checkbox** (required) - must accept to proceed

## Data Storage

All collected information is stored in the `profiles` table:
- `full_name` - Patient's full name
- `date_of_birth` - Calculated from age
- `email` - Contact email
- `medical_history` - Selected medical condition
- `onboarding_completed` - Boolean flag

## User Experience Features

1. **Progress Indicators**: Visual progress dots showing current step
2. **Validation**: Real-time validation with helpful error messages
3. **Navigation**: Back button available on steps 2 and 3
4. **Responsive Design**: Works seamlessly on mobile and desktop
5. **Accessibility**: Proper labels, ARIA attributes, keyboard navigation

## Security Features

1. **Username-based Authentication**: No email verification required
2. **Password Requirements**: Minimum 6 characters
3. **Secure Storage**: All data encrypted in Supabase
4. **Role-based Access**: First user becomes admin automatically
5. **Session Management**: Automatic session handling via Supabase Auth

## Next Steps After Onboarding

After completing onboarding, users are redirected to the dashboard where they can:
1. Add medications (including suggested ones from onboarding)
2. Set up medication reminders
3. Track adherence
4. View analytics
5. Maintain health journal
6. Manage profile settings
