# Points-to-Token Redemption Flow

## Overview

The Points-to-Token Redemption Flow enables users to convert their earned Success Points (SP) into SKC tokens, providing tangible value for platform engagement. This document describes the implementation details, components, and user flows.

## Key Components

### 1. `PointsRedemptionFlow`

The main container component that orchestrates the redemption process. It integrates:
- Eligibility verification
- Conversion calculator
- Transaction history
- Redemption confirmation modal
- Transaction status tracking

**Usage:**
```tsx
<PointsRedemptionFlow />
```

### 2. `EligibilityVerification`

Verifies if a user meets redemption requirements and displays helpful guidance.

**Requirements:**
- Wallet connection
- Minimum points balance

**Usage:**
```tsx
<EligibilityVerification
  onStatusChange={(isEligible) => console.log('Eligibility status:', isEligible)}
  showDetails={true}
/>
```

### 3. `PointsConversionCalculator`

Provides an intuitive interface for selecting redemption amounts with real-time conversion preview.

**Features:**
- Amount input and slider
- Preset selection options
- Real-time token conversion preview
- Validation for minimum/maximum amounts and balance limits

**Usage:**
```tsx
<PointsConversionCalculator
  pointsBalance={5000}
  minRedemption={1000}
  maxRedemption={10000}
  conversionRate={100}
  onAmountChange={(amount) => console.log('Selected amount:', amount)}
  onSubmit={(amount) => console.log('Submitting amount:', amount)}
/>
```

### 4. `RedemptionConfirmationModal`

Multi-step modal for reviewing and confirming redemption transactions.

**Steps:**
1. Transaction Summary
2. Terms and Conditions
3. Processing
4. Completion Confirmation or Error

**Usage:**
```tsx
<RedemptionConfirmationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  data={{
    pointsAmount: 1000,
    tokenAmount: 10,
    recipientAddress: "wallet-address",
    conversionRate: 100
  }}
  onConfirm={() => processRedemption()}
/>
```

### 5. `TransactionStatusTracker`

Displays real-time status updates for redemption transactions.

**Features:**
- Processing step visualization
- Transaction details
- Status updates
- Error handling guidance

**Usage:**
```tsx
<TransactionStatusTracker
  transactionId="tx123"
  onStatusChange={(status) => console.log('Status changed:', status)}
  autoRefresh={true}
/>
```

### 6. `RedemptionHistory`

Displays the user's redemption transaction history.

**Features:**
- Status-based filtering
- Detailed transaction information
- Expandable transaction details
- Status-based visual differentiation

**Usage:**
```tsx
<RedemptionHistory
  transactions={transactionList}
  isLoading={false}
  onRefresh={() => fetchTransactions()}
/>
```

### 7. `MiniRedemptionWidget`

Compact redemption widget for dashboard integration.

**Features:**
- Balance display
- Quick redemption options
- Simplified conversion preview
- Link to full redemption flow

**Usage:**
```tsx
<MiniRedemptionWidget
  onFullRedemptionClick={() => navigateToRedemption()}
/>
```

## User Flows

### Primary Redemption Flow

1. **Eligibility Check**
   - User views redemption requirements
   - System verifies wallet connection and minimum balance
   - If not eligible, guidance is provided to meet requirements

2. **Amount Selection**
   - User enters or selects redemption amount
   - System validates against minimum/maximum limits and available balance
   - Real-time conversion preview shows token amount

3. **Transaction Confirmation**
   - User reviews transaction details
   - Accepts terms and conditions
   - Confirms the transaction

4. **Processing**
   - System processes the redemption request
   - User sees real-time status updates
   - Transaction status transitions from pending to processing to completed

5. **Completion**
   - User receives confirmation of successful redemption
   - Transaction appears in redemption history
   - Points balance is updated

### Error Recovery Flows

1. **Eligibility Error**
   - User sees specific requirements not met (wallet, balance)
   - System provides direct action options (connect wallet)
   - Guidance on how to meet other requirements

2. **Validation Error**
   - User enters invalid amount (too low, too high, exceeds balance)
   - System provides immediate feedback with specific error messages
   - Input field visually indicates error state

3. **Transaction Error**
   - If redemption process fails, user receives error explanation
   - System provides retry option or guidance
   - Points are not deducted for failed transactions

## Technical Details

### State Management

The redemption flow uses Zustand for state management with three key aspects:

1. **User State:**
   - Points balance
   - Wallet connection status
   - Eligibility status
   - Redemption history

2. **Transaction State:**
   - Points amount to redeem
   - Token amount to receive
   - Transaction status
   - Processing steps

3. **UI State:**
   - Current flow step
   - Modal visibility
   - Input validation state
   - Loading/processing states

### API Integration

The redemption flow integrates with the following API endpoints:

1. **GET /api/points/redemption/eligibility**
   - Check if user is eligible for redemption
   - Get redemption limits and requirements

2. **POST /api/points/redemption/transactions**
   - Initiate redemption transaction
   - Process points-to-token conversion

3. **GET /api/points/redemption/transactions/:id**
   - Get transaction status and details
   - Monitor processing progress

4. **GET /api/points/redemption/transactions**
   - Get transaction history
   - Filter by status, date, etc.

### Accessibility

The redemption flow includes comprehensive accessibility features:

- Proper focus management during multi-step processes
- Clear error messaging with ARIA attributes
- Reduced motion support for animations
- Keyboard navigation throughout all interfaces
- Screen reader-friendly status announcements
- Sufficient color contrast for all states

## Design Considerations

- **Mobile-First Approach:** All components are designed for optimal mobile usage first, then enhanced for larger screens.
- **Progressive Disclosure:** Complex information is revealed gradually to avoid overwhelming users.
- **Consistent Feedback:** Visual and textual feedback is provided for all actions.
- **Error Prevention:** Validation and confirmation steps help prevent user errors.
- **Transparent Process:** All steps and requirements are clearly communicated.

## Future Enhancements

Potential areas for enhancement include:

1. Support for multiple wallet providers beyond Phantom
2. Enhanced transaction analytics and insights
3. Batch redemption capabilities for power users
4. Special redemption events with bonus tokens
5. Integration with other platform features (achievements, leaderboards)

## Usage Guidelines

When implementing the redemption flow:

- Always provide clear eligibility requirements
- Maintain consistent conversion rates across the platform
- Ensure transaction history is easily accessible
- Provide helpful guidance for error recovery
- Consider different user expertise levels in your instructions