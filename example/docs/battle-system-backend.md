# Battle System Backend Documentation

## Overview

The Battle System is a core feature of the Wild 'n Out Meme Coin Platform, enabling users to engage in competitive content creation challenges based on the show's format. This document details the technical implementation of the battle system backend.

## Core Components

### 1. Battle Lifecycle Management

Battles follow a clear state machine pattern with the following states:

- **Draft**: Initial creation state, not visible to users
- **Scheduled**: Published but not yet active, visible in upcoming battles
- **Open**: Active for submissions
- **Voting**: Closed for submissions, open for voting
- **Completed**: All phases concluded, results calculated and published

Transitions between states are strictly controlled and validated based on:
- Current state
- Timing constraints
- System validation rules

### 2. Entry Submission System

Handles user submissions to battles with:
- Comprehensive content validation against battle rules
- Media type validation and content safety checks
- Rate limiting to prevent spam
- User submission limits enforcement

### 3. Voting and Results System

Manages the battle voting and results process:
- Secure voting with duplicate prevention
- Fair ranking algorithm with multi-level tie-breaking
- Results calculation and publication
- Achievement and notification triggering

## Data Models

### Battle Model

```typescript
interface BattleModel {
  id: string;
  title: string;
  description: string;
  battleType: 'wildStyle' | 'pickUpKillIt' | 'rAndBeef' | 'tournament';
  rules: {
    prompt: string;
    mediaTypes: string[];
    maxDuration?: number;
    minLength?: number;
    maxLength?: number;
    additionalRules?: string[];
  };
  status: 'draft' | 'scheduled' | 'open' | 'voting' | 'completed';
  creatorId: string;
  startTime: Date;
  endTime: Date;
  votingStartTime: Date;
  votingEndTime: Date;
  participantCount: number;
  entryCount: number;
  voteCount: number;
  featured: boolean;
  exampleEntries: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Entry Model

```typescript
interface EntryModel {
  id: string;
  battleId: string;
  userId: string;
  content: {
    type: 'text' | 'image' | 'audio' | 'video' | 'mixed';
    body?: string;
    mediaUrl?: string;
    additionalMedia?: string[];
  };
  metadata: {
    deviceInfo?: string;
    creationTime?: number;
    tags?: string[];
  };
  moderation: {
    status: 'pending' | 'approved' | 'rejected';
    reviewerId?: string;
    reviewedAt?: Date;
    reason?: string;
  };
  metrics: {
    viewCount: number;
    voteCount: number;
    commentCount: number;
    shareCount: number;
  };
  rank?: number;
  submissionTime: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Vote Model

```typescript
interface VoteModel {
  id: string;
  entryId: string;
  battleId: string;
  voterId: string;
  createdAt: Date;
}
```

## Key Implementation Patterns

### 1. State Machine Pattern

The Battle System uses a state machine pattern to manage battle lifecycle transitions:

```typescript
type BattleStatusTransition = {
  from: BattleModel['status'][];
  to: BattleModel['status'];
  isValid: (battle: BattleModel) => boolean;
  executeTransition: (battle: BattleModel) => Promise<void>;
};
```

State transitions are only permitted between defined states and under specific conditions. This ensures battles progress through their lifecycle consistently and predictably.

### 2. Transaction-Based Operations

All critical operations use a transaction manager to ensure data consistency:

```typescript
return this.transactionManager.execute(async (transaction) => {
  // Multiple database operations that must succeed or fail together
  // ...
});
```

This pattern ensures that complex operations involving multiple database changes either complete fully or roll back completely, maintaining data integrity.

### 3. Event-Driven Interactions

The system uses an event-driven architecture for cross-component communication:

```typescript
// Emit events for important state changes
await this.eventEmitter.emit(EventType.BATTLE_COMPLETED, {
  battleId,
  winnerId: winner.userId,
  timestamp: new Date().toISOString()
});
```

Components can subscribe to these events to perform related actions without tight coupling.

### 4. Enhanced Validation

Comprehensive validation is applied to all inputs:

```typescript
if (rules.mediaTypes && !rules.mediaTypes.includes(content.type)) {
  throw new ValidationError(`Content type "${content.type}" is not allowed for this battle`, {
    allowedTypes: rules.mediaTypes
  });
}
```

This ensures data integrity and security throughout the system.

## API Endpoints

### Battle Management

- `POST /api/battles` - Create a new battle
- `GET /api/battles` - List available battles
- `GET /api/battles/:id` - Get battle details
- `PUT /api/battles/:id/status` - Update battle status

### Entry Submission

- `POST /api/battles/:id/entries` - Submit an entry to a battle
- `GET /api/battles/:id/entries` - Get entries for a battle

### Voting

- `POST /api/battles/entries/:entryId/vote` - Vote for an entry
- `GET /api/battles/:id/results` - Get battle results

## Scheduled Jobs

The system includes scheduled jobs to automate battle lifecycle management:

- `processBattleStatusUpdates()` - Checks for battles that need status updates based on current time

This ensures battles transition through their lifecycle even without manual intervention.

## Error Handling

Comprehensive error handling is implemented throughout the battle system:

- Validation errors with detailed error messages
- Transaction rollbacks for failed operations
- Structured error responses for all API endpoints

## Security Considerations

- Rate limiting for voting and submission operations
- Proper authentication and authorization checks
- Input validation to prevent injection attacks
- Content moderation for submitted entries

## Testing Strategy

- Unit tests for core business logic
- Integration tests for API endpoints
- Load testing for high-volume scenarios (voting, submission spikes)
- Edge case testing for unusual battle scenarios
