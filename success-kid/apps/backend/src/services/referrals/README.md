# Referral System Implementation

## Overview

The Referral System enables users to invite others to the Success Kid Community Platform, tracks these referrals, and rewards users for successful conversions. The system includes features for referral code generation, tracking, verification, rewards distribution, and time-limited promotional campaigns.

## Architecture

The Referral System follows a layered architecture:

1. **API Layer**: REST endpoints for client interaction
2. **Service Layer**: Business logic implementation
3. **Repository Layer**: Data access abstraction
4. **Database Layer**: Data storage with PostgreSQL

## Core Components

### 1. Referral Code Management

- Generation of unique, user-friendly referral codes
- Support for custom codes
- Validation and verification of codes
- Multiple code types (standard, custom, campaign)

### 2. Referral Tracking

- Tracking referral link visits with privacy-conscious data collection
- Recording conversion events when referred users register
- Attribution of new users to referrers
- Analytics for referral performance

### 3. Reward System

- Distribution of rewards for successful referrals
- Multiple reward types based on referred user actions
- Idempotent reward processing
- Reward history and statistics

### 4. Verification and Abuse Prevention

- Multi-signal detection of potentially fraudulent referrals
- Self-referral prevention
- Confidence scoring for referral legitimacy
- Manual review system for edge cases

### 5. Campaign Management

- Time-limited referral campaigns with enhanced rewards
- Campaign-specific tracking and analytics
- Customizable eligibility criteria and reward multipliers
- Campaign performance reporting

## Data Models

The implementation includes the following key data models:

1. **ReferralCode**: A unique code associated with a user for tracking referrals
2. **ReferralTracking**: Records referral link visits and conversions
3. **ReferralReward**: Represents rewards earned through successful referrals
4. **ReferralCampaign**: Defines time-limited referral promotion with special rewards

## API Endpoints

### Referral Codes

- `GET /api/v1/referrals/code` - Get the user's referral code
- `POST /api/v1/referrals/code/custom` - Create a custom referral code
- `GET /api/v1/referrals/code/:code/validate` - Validate a referral code
- `POST /api/v1/referrals/track` - Track a referral link visit

### User Referrals

- `GET /api/v1/referrals/stats` - Get user's referral statistics
- `GET /api/v1/referrals/conversions` - Get user's referral conversions
- `GET /api/v1/referrals/rewards` - Get user's reward history
- `POST /api/v1/referrals/process-reward` - Process a referral reward (admin only)
- `GET /api/v1/referrals/network` - Get user's referral network
- `GET /api/v1/referrals/was-referred` - Check if user was referred

### Campaigns

- `POST /api/v1/referrals/campaigns` - Create a new campaign (admin only)
- `PATCH /api/v1/referrals/campaigns/:id` - Update a campaign (admin only)
- `GET /api/v1/referrals/campaigns` - Get campaigns (admin only)
- `GET /api/v1/referrals/campaigns/active` - Get active campaigns
- `GET /api/v1/referrals/campaigns/:id/performance` - Get campaign performance (admin only)
- `POST /api/v1/referrals/campaigns/:id/code` - Generate a campaign code for the user
- `POST /api/v1/referrals/campaigns/:id/activate` - Activate a campaign (admin only)
- `POST /api/v1/referrals/campaigns/:id/cancel` - Cancel a campaign (admin only)

## Integration Points

The Referral System integrates with several other system components:

1. **User Authentication**: For user identification and registration events
2. **Points System**: For awarding points to referrers
3. **Wallet Connection**: For triggering wallet-connection rewards
4. **Event Bus**: For publishing referral events
5. **WebSockets**: For real-time notifications of referral activities

## Security Considerations

The implementation includes various security measures:

1. **Privacy Protection**: IP addresses are hashed before storage
2. **Rate Limiting**: Prevents abuse of tracking and code generation
3. **Fraud Detection**: Multi-factor verification of referral legitimacy
4. **Reward Validation**: Ensures rewards are only processed once
5. **Admin-Only Actions**: Restricted access for sensitive operations

## Configuration

The Referral System is highly configurable through the `referral-config.ts` file, allowing adjustment of:

1. Code generation parameters
2. Reward amounts
3. Campaign limits
4. Verification thresholds
5. Rate limiting parameters

## Database Schema

The implementation includes migrations for the following tables:

1. `referral_codes`: Stores user referral codes
2. `referral_tracking`: Tracks referral visits and conversions
3. `referral_rewards`: Records rewards earned through referrals
4. `referral_campaigns`: Defines time-limited referral campaigns

## Future Enhancements

Potential future enhancements for the Referral System:

1. **Advanced Analytics**: More detailed referral performance reporting
2. **Enhanced Verification**: Machine learning-based fraud detection
3. **Multi-tier Rewards**: More sophisticated multi-level reward distribution
4. **A/B Testing**: Campaign performance comparison
5. **Enhanced Integration**: Deeper integration with gamification components

## Usage Examples

### Tracking a Referral Visit

```javascript
// Frontend code
async function trackReferralVisit(code, visitorData) {
  try {
    const response = await fetch('/api/v1/referrals/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        visitorData: {
          visitor_id: getVisitorId(), // From cookie or storage
          ip_address: '', // Will be set by server for security
          user_agent: navigator.userAgent,
          landing_page: window.location.href,
          utm_source: getUtmParam('utm_source'),
          utm_medium: getUtmParam('utm_medium'),
          utm_campaign: getUtmParam('utm_campaign')
        }
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error tracking referral:', error);
  }
}
```

### Getting a User's Referral Code

```javascript
// Frontend code
async function getUserReferralCode() {
  try {
    const response = await fetch('/api/v1/referrals/code', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting referral code:', error);
  }
}
```
