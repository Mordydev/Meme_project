# Success Points System Documentation

## Overview

The Success Points (SP) system is the core economy of the Success Kid Community Platform, designed to reward user engagement and provide a value bridge between on-platform activity and token rewards. This document outlines the implementation details, key components, API interfaces, and usage patterns.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Points Economy Rules](#points-economy-rules)
3. [Core Components](#core-components)
4. [API Endpoints](#api-endpoints)
5. [Integration Patterns](#integration-patterns)
6. [Security & Protection](#security--protection)
7. [Testing & Validation](#testing--validation)
8. [Operational Considerations](#operational-considerations)

## System Architecture

The Points System follows a layered architecture design:

![Architecture Diagram](../assets/diagrams/points-system-architecture.png)

### Key Layers

1. **API Layer**: HTTP endpoints for points operations
2. **Service Layer**: Business logic for points management
3. **Repository Layer**: Data access for points transactions and redemption
4. **Security Layer**: Protection against exploitation and fraud
5. **Event Layer**: Real-time updates and integrations

### Data Flow

1. User performs activity → 
2. Activity verification → 
3. Cap enforcement → 
4. Transaction processing → 
5. Balance update → 
6. Real-time notification → 
7. Achievement/level triggers

## Points Economy Rules

The Success Points economy operates on a carefully balanced set of rules:

### Earning Points

| Activity | Points | Daily Limit | Description |
|----------|--------|-------------|-------------|
| Account creation | 100 | Once | One-time bonus for new accounts |
| Daily login | 20 | Once per day | Rewards daily platform engagement |
| Content creation | 50 | 4 times (200/day) | Posting new content |
| Quality post bonus | 50-200 | N/A | Staff-awarded bonus for high-quality content |
| Commenting | 15 | 10 times (150/day) | Engaging with other content |
| Receiving comments | 5 | 20 times (100/day) | Having engaging content |
| Upvote received | 5 | 20 times (100/day) | Community recognition |
| Upvote given | 1 | 50 times (50/day) | Participating in curation |
| Profile completion | 100 | Once | One-time bonus for complete profile |
| Wallet connection | 50 | Once per wallet | Connecting verified wallet |
| Streak bonus | 10 × streak days | 100/day max | Consecutive daily activity |
| Referral signup | 500 | N/A | Per unique signup through referral |

### Redeeming Points

- **Conversion Rate**: 100 SP = 1 SKC token
- **Minimum Redemption**: 1,000 SP (10 tokens)
- **Weekly Limit**: 10,000 SP (100 tokens) per user
- **Requirements**: Verified wallet connection
- **Processing Time**: Typically within 24 hours

## Core Components

The implementation consists of several specialized services:

### 1. Points Service (`PointsService`)

Central service managing points operations:
- Point awarding and deduction
- Balance management
- Transaction processing
- Redemption handling

### 2. Cap Enforcement Service (`CapEnforcementService`)

Enforces daily and weekly limits:
- Per-activity daily caps
- Weekly redemption caps
- Special event multipliers
- Cap override management

### 3. Verification Service (`VerificationService`)

Validates legitimate activity:
- Activity verification
- User trust levels
- Rate limiting
- Multi-factor verification

### 4. Anomaly Detection (`AnomalyDetectionService`)

Identifies suspicious patterns:
- Velocity checks
- Volume analysis
- Pattern recognition
- Behavioral profiling

### 5. Redemption Service (`RedemptionService`)

Manages points-to-token conversion:
- Eligibility verification
- Redemption request processing
- Blockchain transaction management
- Status tracking and updates

### 6. Transaction Idempotency (`TransactionIdempotencyService`)

Ensures transactional integrity:
- Duplicate prevention
- Transaction recovery
- Consistent state management
- Client request ID handling

### 7. Analytics Service (`PointsAnalyticsService`)

Provides insights into points economy:
- User metrics
- System-wide metrics
- Activity patterns
- Economy health indicators

## API Endpoints

### User Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/points/balance/:userId` | GET | Get user's points balance |
| `/api/v1/points/history/:userId` | GET | Get user's points transaction history |
| `/api/v1/points/caps/:userId` | GET | Get user's daily caps status |
| `/api/v1/points/redemption/eligibility/:userId` | GET | Check redemption eligibility |

### Transaction Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/points/award` | POST | Award points for activity |
| `/api/v1/points/redemption` | POST | Request points redemption |
| `/api/v1/points/redemption/:id` | GET | Get redemption status |
| `/api/v1/points/redemption/history/:userId` | GET | Get redemption history |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/points/admin/award` | POST | Admin points award |
| `/api/v1/points/admin/deduct` | POST | Admin points deduction |
| `/api/v1/points/admin/stats` | GET | System-wide statistics |
| `/api/v1/points/redemption/stats` | GET | Redemption statistics |
| `/api/v1/points/redemption/flagged` | GET | Get flagged redemptions |
| `/api/v1/points/redemption/flagged/:id/review` | POST | Review flagged redemption |
| `/api/v1/points/rules` | GET | Get points rules |
| `/api/v1/points/events` | GET | Get special events |
| `/api/v1/points/events/:id/toggle` | POST | Toggle special event |

## Integration Patterns

### 1. Activity Integration

To award points for user activity:

```typescript
// 1. Import the event bus
import { eventBus, EventType } from '../lib/event-bus';

// 2. Emit points award event when activity occurs
async function handleContentCreation(userId, content) {
  // Process content creation
  const contentId = await contentService.createContent(userId, content);
  
  // Award points for activity
  eventBus.publish(EventType.AWARD_POINTS, {
    userId,
    amount: 50,  // From points rules
    source: 'content_creation',
    referenceId: contentId,
    description: 'Created new content'
  });
  
  return contentId;
}
```

### 2. Real-time Updates Integration

To receive real-time points updates:

```typescript
// Server-side WebSocket handler
eventBus.subscribe(EventType.POINTS_AWARDED, (event) => {
  // Send WebSocket notification to user
  webSocketService.sendToUser(event.userId, {
    type: 'points.update',
    data: {
      amount: event.amount,
      source: event.source,
      balance: event.balance,
      timestamp: event.timestamp
    }
  });
});
```

### 3. Redemption Flow Integration

To integrate with the redemption flow:

```typescript
// Client-side redemption request
async function redeemPoints(amount) {
  try {
    // Request redemption
    const response = await api.post('/api/v1/points/redemption', {
      amount,
      walletAddress: user.walletAddress
    });
    
    // Handle response
    if (response.data && response.data.redemptionId) {
      // Set up polling for status updates
      startRedemptionStatusPolling(response.data.redemptionId);
      
      // Update UI optimistically
      updatePointsBalance(currentBalance - amount);
      showRedemptionInProgress(response.data);
    }
  } catch (error) {
    // Handle error
    showRedemptionError(error);
  }
}
```

## Security & Protection

The points system implements a multi-layered protection approach:

### 1. Input Validation
- Schema-based validation for all requests
- Type checking and constraints
- Proper error handling

### 2. Rate Limiting
- Per-endpoint rate limits
- Graduated throttling
- IP and user-based limits

### 3. Daily Caps
- Per-activity caps
- System-wide limits
- User-based restrictions

### 4. Anomaly Detection
- Velocity analysis
- Pattern recognition
- Behavioral profiling
- Risk scoring

### 5. Transaction Integrity
- Database transactions
- Idempotency guarantees
- Audit logging
- Recovery mechanisms

### 6. Security Headers
- CSRF protection
- Content-Security-Policy
- Rate-limiting headers
- Request ID tracking

## Testing & Validation

The points system includes comprehensive testing tools:

### Automated Tests
- Unit tests for core logic
- Integration tests for APIs
- End-to-end testing for flows
- Load testing for performance

### Simulation Tool
A points system tester allows simulation of various scenarios:
- Activity generation
- User behavior modeling
- Exploitation attempts
- Performance validation

Run the tester with:
```
npx ts-node -r tsconfig-paths/register src/scripts/run-points-system-test.ts
```

### Manual Testing Guide
1. Create test users with different profiles
2. Perform activities to test point awarding
3. Verify cap enforcement
4. Test redemption flow
5. Attempt common exploitation patterns
6. Verify protection mechanisms

## Operational Considerations

### Monitoring
Key metrics to monitor:
- Transaction volume and latency
- Points awarded per day
- Redemption rate
- Failed transactions
- Flagged activities
- System load during peak times

### Performance Optimization
- Use Redis caching for frequent operations
- Implement database query optimization
- Use batch processing for analytics
- Distribute load across services

### Disaster Recovery
- Regular database backups
- Transaction log maintenance
- Point-in-time recovery capability
- Reconciliation procedures

### Governance
- Regular rules review committee
- Economic balance monitoring
- Exploitation attempt reviews
- System health reporting

## Conclusion

The Success Points system provides a robust framework for rewarding user engagement while maintaining economic balance and security. The modular architecture allows for future extensions and optimizations while ensuring current operational needs are met effectively.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-03-17 | Initial implementation |
| 1.0.1 | 2025-03-17 | Added transaction idempotency |
| 1.0.2 | 2025-03-17 | Enhanced anomaly detection |
| 1.0.3 | 2025-03-17 | Added analytics service |
| 1.0.4 | 2025-03-17 | Improved testing tools |