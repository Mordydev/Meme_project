# Success Points System

This module implements the Success Points system, the core engagement incentive mechanism for the Success Kid Community Platform. It allows users to earn, track, and redeem points for platform activities.

## Core Components

### PointsService

The central service for managing points, with features including:

- Awarding points for user activities
- Deducting points for redemptions
- Tracking points balances and transaction history
- Enforcing daily and weekly caps
- Transferring points between users
- Managing activity verification

### PointsVerifier

Verification system that validates point-earning activities:

- Strategy pattern for different activity types
- Content quality scoring
- Duplicate detection
- Suspicious activity detection
- Quality-based point adjustments

### RedemptionService

Handles points-to-token conversion:

- Points redemption request handling
- Transaction processing
- Weekly redemption cap enforcement
- Redemption history tracking
- Blockchain transaction management

## Points Sources

The system recognizes various point-earning activities, including:

- `content_creation`: Creating content (50 points, daily cap: 200)
- `comment`: Commenting on content (15 points, daily cap: 150)
- `reaction_received`: Receiving likes/reactions (5 points, daily cap: 100)
- `daily_login`: Daily login bonus (20 points, once per day)
- `streak_bonus`: Consecutive day login bonus (varies by streak length)
- `achievement`: Unlocking achievements (varies by achievement)
- `referral`: Referring new users (500 points per successful referral)
- `profile_completion`: Completing profile (100 points, one-time)
- `wallet_connection`: Connecting wallet (50 points, one-time)

## Redemption Rules

- Conversion rate: 100 SP = 1 SKC
- Minimum redemption: 1000 SP (10 SKC)
- Weekly cap: 10,000 SP (100 SKC) per user
- Wallet connection required

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/points/balance` | GET | Get user's current balance and recent transactions |
| `/api/v1/points/transactions` | GET | Get transaction history with pagination |
| `/api/v1/points/award` | POST | Award points to user |
| `/api/v1/points/redeem` | POST | Redeem points for tokens |
| `/api/v1/points/redemptions` | GET | Get redemption history |

## Usage Examples

### Awarding Points

```typescript
// Award points for content creation
const result = await pointsService.awardPoints({
  userId: 'user_123',
  amount: 50,
  source: 'content_creation',
  referenceId: 'post_123',
  description: 'Created a new post'
});

// Check result
if (result.success) {
  console.log(`Awarded ${result.amount} points. New balance: ${result.total}`);
} else {
  console.log('Points not awarded. Possible cap limit or verification failure.');
}
```

### Redeeming Points

```typescript
// Request redemption
const redemption = await redemptionService.requestRedemption({
  userId: 'user_123',
  pointsAmount: 1000,
  walletAddress: '0x1234567890abcdef'
});

console.log(`Redemption requested: ${redemption.id}`);
console.log(`Status: ${redemption.status}`);
console.log(`Points amount: ${redemption.pointsAmount}`);
console.log(`Token amount: ${redemption.tokenAmount}`);
```

## Anti-Exploitation Measures

The system implements several protections against gaming or exploitation:

1. **Daily caps**: Limits on points earned per activity type
2. **Verification strategies**: Activity-specific verification rules
3. **Quality scoring**: Rewards higher quality contributions with bonus points
4. **Pattern detection**: Identifies suspicious activity patterns
5. **Graduated responses**: Different actions based on confidence in suspicious activity
6. **Transaction integrity**: Atomic database operations ensure data consistency

## Scheduled Jobs

The system includes scheduled jobs for background processing:

- **Redemption Processing**: Daily job that processes pending redemption requests, converting points to tokens

## Error Handling

The module uses specialized error types for different failure scenarios:

- `ValidationError`: Invalid input data
- `InsufficientPointsError`: Not enough points for operation
- `PointsCapExceededError`: Daily or weekly cap exceeded
- `SuspiciousActivityError`: Suspicious activity detected
- `RedemptionFailedError`: Token redemption failed
