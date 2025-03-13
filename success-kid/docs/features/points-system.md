# Points System Documentation

The Success Points (SP) system is a core feature of the Success Kid Community Platform, incentivizing engagement through a token-based reward mechanism.

## Overview

Success Points (SP) serve as an on-platform utility token that users earn through various engagement activities. These points can be redeemed for SKC tokens, creating tangible value from platform participation.

## Point Earning Activities

| Activity | Points (SP) | Daily Limit | Rationale |
|----------|--------|-----------------|-----------|
| **Account Creation** | 100 | Once | Welcome bonus to kickstart engagement |
| **Daily Login** | 20 | Once per day | Encourages regular visits |
| **Creating a Post** | 50 | Max 200/day | Core content creation |
| **Quality Post Bonus** | 50-200 | Staff awarded | Rewards exceptional contributions |
| **Commenting** | 15 | Max 150/day | Encourages conversation |
| **Receiving Comment** | 5 | Max 100/day | Rewards engaging content |
| **Upvote Received** | 5 | Max 100/day | Community validation |
| **Upvote Given** | 1 | Max 50/day | Participation in curation |
| **Profile Completion** | 100 | Once | Encourages complete profiles |
| **Wallet Connection** | 50 | Once per wallet | Basic integration reward |
| **Streak Bonus** | 10 × streak days (max 100) | Daily | Rewards consistency |
| **Referral Signup** | 500 | Per unique referral | Rewards community growth |

## Points to Token Conversion

Success Points can be redeemed for SKC tokens at a fixed rate:

- **Conversion Rate**: 100 SP = 1 SKC
- **Minimum Redemption**: 1,000 SP (10 SKC)
- **Weekly Redemption Cap**: 10,000 SP (100 SKC) per user
- **Requirements**: Connected wallet required for redemption
- **Processing**: Weekly processing window

## Technical Implementation

### Data Model

```
user_points
├── id (PK)
├── user_id (FK → users.id)
├── amount
├── source
├── reference_id
├── created_at
└── description
```

### Key Components

1. **Points Service**: Handles awarding and redeeming points
2. **Points Repository**: Manages data persistence
3. **Daily Limits Service**: Enforces daily caps
4. **Redemption Queue**: Processes token conversions
5. **Anti-Fraud System**: Prevents exploitation

### API Endpoints

#### Award Points

```
POST /api/v1/points/award
```

Request:
```json
{
  "data": {
    "amount": 50,
    "source": "content_creation",
    "referenceId": "post_123"
  }
}
```

Response:
```json
{
  "data": {
    "success": true,
    "amount": 50,
    "newBalance": 1050,
    "transaction": {
      "id": "tx_123",
      "created_at": "2025-03-12T12:00:00Z"
    }
  },
  "meta": {
    "timestamp": "2025-03-12T12:00:00Z"
  }
}
```

#### Get Points Balance

```
GET /api/v1/points/balance
```

Response:
```json
{
  "data": {
    "balance": 1050,
    "transactions": [
      {
        "id": "tx_123",
        "amount": 50,
        "source": "content_creation",
        "created_at": "2025-03-12T12:00:00Z"
      }
    ],
    "today": {
      "earned": 150,
      "limits": {
        "content_creation": {
          "used": 100,
          "limit": 200,
          "remaining": 100
        }
      }
    }
  },
  "meta": {
    "timestamp": "2025-03-12T12:00:00Z"
  }
}
```

#### Redeem Points

```
POST /api/v1/points/redeem
```

Request:
```json
{
  "data": {
    "amount": 1000
  }
}
```

Response:
```json
{
  "data": {
    "success": true,
    "requestId": "req_123",
    "pointsAmount": 1000,
    "tokenAmount": 10,
    "status": "pending",
    "estimatedProcessingTime": "2025-03-15T00:00:00Z"
  },
  "meta": {
    "timestamp": "2025-03-12T12:00:00Z"
  }
}
```

### Anti-Exploitation Measures

The points system includes multiple layers of protection:

1. **Activity Caps**: Daily limits on each point-earning activity
2. **Rate Limiting**: Throttling of point-earning actions
3. **Validation Rules**: Business logic to verify legitimate actions
4. **Pattern Detection**: Algorithms to identify suspicious behavior
5. **Manual Review**: Staff review for suspicious activities
6. **Rollback Capability**: Ability to reverse fraudulent transactions

## UI Components

### Points Display

![Points Display](https://placeholder.com/ui/points-display.png)

- Located in the top navigation
- Shows current points balance
- Indicator for new points earned
- Animation for points changes

### Points History

![Points History](https://placeholder.com/ui/points-history.png)

- Accessible from profile or points display
- Lists recent transactions
- Filters by activity type
- Shows daily and weekly summaries

### Redemption Interface

![Redemption Interface](https://placeholder.com/ui/redemption.png)

- Accessible from points display
- Shows conversion preview
- Selectable amount with slider or input
- Wallet connection requirement
- Clear confirmation steps

## User Flows

### Earning Points Flow

1. User performs point-eligible activity (creates post, comments, etc.)
2. System validates action against rules and daily caps
3. Points are awarded and added to user's balance
4. Real-time notification shows points earned
5. Points history is updated
6. Leaderboard positions may update

### Redemption Flow

1. User navigates to redemption interface
2. System checks eligibility (connected wallet, minimum balance)
3. User selects amount to redeem
4. System validates against redemption caps
5. User confirms redemption
6. Request is queued for processing
7. Points are deducted from balance
8. Tokens are sent during next processing window
9. User receives confirmation notification
10. Transaction appears in redemption history

## Error Handling

| Error Scenario | System Response | User Message |
|----------------|-----------------|--------------|
| **Daily Limit Reached** | Block additional points for that activity | "You've reached your daily limit for this activity. Try again tomorrow!" |
| **Redemption Below Minimum** | Reject redemption request | "Minimum redemption amount is 1,000 SP (10 SKC). Keep earning!" |
| **Redemption Exceeds Cap** | Limit redemption to cap | "Weekly redemption limit is 10,000 SP (100 SKC). Adjust your amount." |
| **No Wallet Connected** | Require wallet connection | "Please connect your wallet to redeem points for tokens." |
| **Insufficient Balance** | Reject redemption request | "You don't have enough points for this redemption." |
| **Suspicious Activity** | Flag for review, potentially hold points | "Your recent activity requires review. Points may be temporarily held." |

## Points System Dashboard (Admin)

Administrators have access to a points system dashboard that provides:

- Global points statistics
- User leaderboards
- Redemption queue management
- Suspicious activity flagging
- Manual points adjustment tools
- System configuration settings

## Best Practices

### For Developers

1. **Always Use the Points Service**: Never modify points directly in the database
2. **Validate Actions**: Ensure point-earning actions meet requirements
3. **Handle Race Conditions**: Use transactions for critical operations
4. **Log Everything**: Maintain comprehensive audit trails
5. **Implement Idempotency**: Prevent duplicate point awards
6. **Error Handling**: Gracefully handle and report errors

### For Designers

1. **Clear Feedback**: Provide visible feedback for point changes
2. **Value Transparency**: Clearly show point values for activities
3. **Progressive Disclosure**: Layer complex details for new users
4. **Accessible Design**: Ensure points UI is accessible to all users
5. **Mobile Optimization**: Design points interactions for all devices

## Future Enhancements

Planned enhancements to the points system include:

1. **Enhanced Bonuses**: Additional multipliers for consistent engagement
2. **Community Challenges**: Time-limited group goals with bonus rewards
3. **Points Gifting**: Ability to gift points to other users
4. **Advanced Analytics**: Detailed insights into points earning patterns
5. **Variable Redemption Rates**: Special redemption events with better rates
6. **Achievement System Integration**: Deeper integration with achievements

## Related Documentation

- [API Documentation](http://localhost:3001/documentation)
- [Frontend Components](http://localhost:6006/?path=/docs/features-points)
- [Authentication Integration](./authentication.md)
- [Wallet Integration](./wallet-integration.md)
