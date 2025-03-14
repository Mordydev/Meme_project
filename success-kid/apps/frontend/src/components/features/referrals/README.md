# Referral System

The Referral System enables users to invite friends to the Success Kid Community Platform, track their referrals, and earn rewards for successful conversions.

## Overview

The referral system consists of the following key components:

1. **Referral Code Generation & Management** - Creating and managing unique referral codes for users
2. **Referral Dashboard & Analytics** - Visualizing referral performance metrics 
3. **Social Sharing Integration** - Providing multiple channels for sharing referral links
4. **Referee Landing Experience** - Customized landing page for referred users
5. **Reward Distribution System** - Tracking and awarding points for successful referrals
6. **Campaign & Promotion Integration** - Special time-limited referral campaigns with bonus rewards

## Components

### ReferralCodeDisplay

Displays the user's referral code and link with copy and regeneration functionality.

```jsx
<ReferralCodeDisplay 
  referralCode="SUCCESS4U2"
  referralLink="https://successkid.io/join?ref=SUCCESS4U2"
  onRegenerateCode={handleRegenerate}
  isLoading={false}
/>
```

### SocialSharing

Provides options to share referral links across multiple social platforms with customizable messages.

```jsx
<SocialSharing 
  referralLink="https://successkid.io/join?ref=SUCCESS4U2"
  defaultMessage="Join me on the Success Kid platform!"
  availableChannels={['twitter', 'facebook', 'telegram', 'whatsapp', 'email', 'copy']}
  onShare={(channel) => console.log(`Shared via ${channel}`)}
/>
```

### ReferralDashboard

Displays referral performance metrics and visualization of referral activity.

```jsx
<ReferralDashboard />
```

### ReferralsList

Shows a list of referred users with their status and points generated.

```jsx
<ReferralsList 
  onUserClick={(userId) => console.log(`Clicked user ${userId}`)}
/>
```

### CampaignSelector

Displays available referral campaigns and allows generating campaign-specific referral links.

```jsx
<CampaignSelector />
```

### QRCodeGenerator

Generates a QR code for the referral link that can be downloaded or shared.

```jsx
<QRCodeGenerator 
  referralLink="https://successkid.io/join?ref=SUCCESS4U2"
/>
```

## State Management

The referral system uses Zustand for state management, with the following key stores:

- `useReferralStore` - Main store for referral data and actions
- `useReferralData` - Custom hook for accessing and managing referral data

## API Endpoints

### Referral Code Management
- `GET /api/v1/referrals/me` - Get user's referral code and statistics
- `POST /api/v1/referrals/code` - Generate a new referral code

### Analytics
- `GET /api/v1/referrals/analytics` - Get referral performance data
- `GET /api/v1/referrals/users` - Get list of referred users

### Campaigns
- `GET /api/v1/referrals/campaigns` - Get available referral campaigns
- `POST /api/v1/referrals/campaigns/link` - Generate campaign-specific referral link

### Validation
- `GET /api/v1/referrals/validate/:code` - Validate a referral code

### Tracking
- `POST /api/v1/referrals/share` - Record sharing activity

## Flow Architecture

### Referral Creation Flow
1. User accesses referral interface → Presented with personal referral link
2. User customizes referral message → Optional personalization for sharing
3. User selects sharing method → Social media, email, direct link, or QR code
4. User completes sharing → Confirmation with tracking information
5. User monitors referral status → Can track pending and converted referrals

### Referee Onboarding Flow
1. New user clicks referral link → Arrives at customized landing page
2. User sees referrer information → Context for the platform invitation
3. User completes registration → Referral code automatically applied
4. User receives welcome with context → Clear indication of referral benefits
5. User completes initial actions → Triggers rewards for both parties

## Integration Points

- **Profile Page** - Includes ReferralSection component to provide quick access to referral functionality
- **Referrals Page** - Dedicated page with full referral dashboard and management
- **Registration Flow** - Captures and validates referral codes during signup
- **Points System** - Integrates with reward distribution for successful referrals

## Testing

Unit and integration tests for referral components focus on:

- Proper rendering of referral code and links
- Functionality of copy and sharing features
- Correct handling of campaign selection and tracking
- Proper display of referral statistics and analytics
- Validation of referral codes during registration

## Future Enhancements

Potential future improvements for the referral system:

- Multi-level referral tracking (nested referrals)
- Advanced rewards based on referee activity
- A/B testing for different referral messaging
- Webhook integrations for external referral tracking
- Enhanced referral fraud prevention
