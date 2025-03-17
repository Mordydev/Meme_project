/**
 * Redemption WebSocket Handlers
 * 
 * Handlers for redemption-related WebSocket messages.
 */
import WebSocket from 'ws';
import { WebSocketMessage } from '../websocket-types';
import { logger } from '../../lib/logger';
import { RedemptionService } from '../../redemption/services/redemption-service';

/**
 * Handle redemption-related WebSocket messages
 * 
 * @param message WebSocket message
 * @param ws WebSocket connection
 * @param userId User ID associated with the connection
 * @param redemptionService Redemption service
 * @returns True if message was handled
 */
export async function handleRedemptionMessages(
  message: WebSocketMessage,
  ws: WebSocket,
  userId: string,
  redemptionService: RedemptionService
): Promise<boolean> {
  // Only handle redemption-related messages
  if (!message.type.startsWith('redemption.')) {
    return false;
  }

  try {
    switch (message.type) {
      case 'redemption.check_eligibility':
        await handleCheckEligibility(ws, userId, redemptionService);
        break;
      
      case 'redemption.get_conversion_rate':
        await handleGetConversionRate(ws, redemptionService);
        break;
        
      default:
        // Unknown redemption message type
        return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Error handling redemption WebSocket message', {
      messageType: message.type,
      userId,
      error
    });
    
    // Send error response
    ws.send(JSON.stringify({
      type: 'error',
      correlationId: message.correlationId,
      data: {
        message: 'Failed to process redemption request',
        code: 'REDEMPTION_ERROR'
      }
    }));
    
    return true;
  }
}

/**
 * Handle check eligibility message
 * 
 * @param ws WebSocket connection
 * @param userId User ID
 * @param redemptionService Redemption service
 */
async function handleCheckEligibility(
  ws: WebSocket,
  userId: string,
  redemptionService: RedemptionService
): Promise<void> {
  const eligibility = await redemptionService.checkEligibility(userId);
  
  ws.send(JSON.stringify({
    type: 'redemption.eligibility',
    data: eligibility
  }));
}

/**
 * Handle get conversion rate message
 * 
 * @param ws WebSocket connection
 * @param redemptionService Redemption service
 */
async function handleGetConversionRate(
  ws: WebSocket,
  redemptionService: RedemptionService
): Promise<void> {
  const rate = redemptionService.getConversionRate();
  const limits = redemptionService.getRedemptionLimits();
  
  ws.send(JSON.stringify({
    type: 'redemption.conversion_rate',
    data: {
      conversionRate: rate,
      pointsToToken: `${rate} SP = 1 SKC`,
      limits: {
        minimum: limits.minimum,
        weekly: limits.weekly
      }
    }
  }));
}
