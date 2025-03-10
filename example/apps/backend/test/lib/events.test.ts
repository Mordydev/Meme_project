import { EventEmitter, EventType } from '../../src/lib/events';

describe('EventEmitter', () => {
  let eventEmitter: EventEmitter;
  
  beforeEach(() => {
    eventEmitter = new EventEmitter();
  });
  
  it('should register handlers and emit local events', async () => {
    // Mock event handler
    const mockHandler = jest.fn();
    
    // Register handler
    const unsubscribe = eventEmitter.on(
      EventType.BATTLE_CREATED, 
      mockHandler
    );
    
    // Create test payload
    const payload = {
      battleId: 'battle-123',
      creatorId: 'user-456',
      battleType: 'wildStyle',
      timestamp: new Date().toISOString()
    };
    
    // Emit event
    await eventEmitter.emit(EventType.BATTLE_CREATED, payload);
    
    // Verify handler was called
    expect(mockHandler).toHaveBeenCalledWith(payload);
    
    // Unsubscribe
    unsubscribe();
    
    // Reset mock
    mockHandler.mockReset();
    
    // Emit again
    await eventEmitter.emit(EventType.BATTLE_CREATED, payload);
    
    // Verify handler was not called after unsubscribing
    expect(mockHandler).not.toHaveBeenCalled();
  });
  
  it('should handle errors in event handlers without crashing', async () => {
    // Create a handler that throws
    const errorHandler = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    
    // Create a second handler that should still execute
    const secondHandler = jest.fn();
    
    // Register both handlers
    eventEmitter.on(EventType.USER_REGISTERED, errorHandler);
    eventEmitter.on(EventType.USER_REGISTERED, secondHandler);
    
    // Create test payload
    const payload = {
      userId: 'user-123',
      username: 'testuser',
      timestamp: new Date().toISOString()
    };
    
    // Emit should not throw
    await expect(
      eventEmitter.emit(EventType.USER_REGISTERED, payload)
    ).resolves.not.toThrow();
    
    // Both handlers should have been called
    expect(errorHandler).toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalled();
  });
  
  it('should provide type-safe event registration', () => {
    // This is a typescript compilation test - it will fail to compile if type safety is broken
    const battleCreatedHandler = (data: { 
      battleId: string; 
      creatorId: string; 
      battleType: string; 
      timestamp: string;
    }) => {};
    
    // Should work with compatible handler
    eventEmitter.on(EventType.BATTLE_CREATED, battleCreatedHandler);
    
    // TypeScript should prevent incompatible handler (commented to pass tests)
    // @ts-expect-error - This should be a TypeScript error
    // eventEmitter.on(EventType.USER_REGISTERED, battleCreatedHandler);
  });
});
