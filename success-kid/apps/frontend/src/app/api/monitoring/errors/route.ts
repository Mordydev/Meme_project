import { NextRequest, NextResponse } from 'next/server';
import { ErrorSeverity } from '../../../../lib/errors';

/**
 * API route to handle error logging from the client
 * 
 * @route POST /api/monitoring/errors
 * @access Public
 */
export async function POST(request: NextRequest) {
  try {
    // Parse error event from request
    const errorEvent = await request.json();
    
    // Validate basic error event structure
    if (!errorEvent.id || !errorEvent.message || !errorEvent.code) {
      return NextResponse.json(
        { error: 'Invalid error event format' },
        { status: 400 }
      );
    }
    
    // Log the error (in a real implementation, we'd send to a logging service)
    const logLevel = getLogLevelFromSeverity(errorEvent.severity);
    console[logLevel](
      `[CLIENT ERROR] ${errorEvent.code}: ${errorEvent.message}`,
      {
        id: errorEvent.id,
        timestamp: new Date(errorEvent.timestamp).toISOString(),
        severity: errorEvent.severity,
        context: errorEvent.context,
        status: errorEvent.status,
        isRecoverable: errorEvent.isRecoverable,
        isClientError: errorEvent.isClientError
      }
    );
    
    // In production, we would forward this to a logging service like Datadog, New Relic, etc.
    if (process.env.NODE_ENV === 'production') {
      await forwardToLoggingService(errorEvent);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing client error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process error' },
      { status: 500 }
    );
  }
}

/**
 * Map error severity to log level
 */
function getLogLevelFromSeverity(severity: ErrorSeverity): 'error' | 'warn' | 'info' | 'debug' {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.ERROR:
      return 'error';
    case ErrorSeverity.WARNING:
      return 'warn';
    case ErrorSeverity.INFO:
      return 'info';
    default:
      return 'debug';
  }
}

/**
 * Forward error to external logging service
 * This is a placeholder function that would be implemented with a real logging service
 */
async function forwardToLoggingService(errorEvent: any): Promise<void> {
  // This would be implemented with a real logging service integration
  // For example, sending to Datadog, New Relic, etc.
  
  // For now, just simulate async operation
  await new Promise(resolve => setTimeout(resolve, 10));
}
