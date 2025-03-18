/**
 * Optimistic Update Hook
 * 
 * Provides optimistic UI updates with automatic rollback on failure
 * for real-time interactive experiences.
 */
'use client';

import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Update status
 */
export type UpdateStatus = 'pending' | 'success' | 'error' | 'idle';

/**
 * Optimistic update options
 */
export interface OptimisticUpdateOptions<T> {
  /** Initial state */
  initialState: T;
  
  /** Function to check if updates should be applied */
  shouldApply?: (state: T, update: Partial<T>) => boolean;
  
  /** Function to roll back a specific update */
  rollbackUpdate?: (state: T, update: Partial<T>, id: string) => T;
  
  /** Maximum number of pending updates before forcing sync */
  maxPendingUpdates?: number;
  
  /** Pending update timeout in milliseconds */
  pendingTimeout?: number;
  
  /** Auto-sync interval in milliseconds (0 to disable) */
  autoSyncInterval?: number;
  
  /** Callback when sync is complete */
  onSyncComplete?: (state: T) => void;
}

/**
 * Optimistic update entry
 */
interface UpdateEntry<T> {
  /** Update ID */
  id: string;
  
  /** Update data */
  update: Partial<T>;
  
  /** Update status */
  status: UpdateStatus;
  
  /** When update was created */
  timestamp: number;
  
  /** Error message if any */
  error?: string;
  
  /** Retry count */
  retryCount: number;
}

/**
 * Hook for handling optimistic UI updates
 * @param options Hook options
 * @returns Hook methods and state
 */
export function useOptimisticUpdate<T>(
  options: OptimisticUpdateOptions<T>
) {
  // Current state
  const [state, setState] = useState<T>(options.initialState);
  
  // Track all updates
  const [updates, setUpdates] = useState<UpdateEntry<T>[]>([]);
  
  // Track overall status
  const [status, setStatus] = useState<UpdateStatus>('idle');
  
  // Auto-sync interval
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Default options
  const {
    shouldApply = () => true,
    rollbackUpdate = (state, update) => {
      // Simple rollback by removing update (works for additive updates)
      const newState = { ...state };
      
      // Remove each property from the update
      Object.keys(update).forEach(key => {
        delete newState[key as keyof T];
      });
      
      return newState;
    },
    maxPendingUpdates = 10,
    pendingTimeout = 10000,
    autoSyncInterval = 0,
    onSyncComplete
  } = options;
  
  /**
   * Apply an optimistic update to the state
   * @param update Partial update to apply
   * @param syncFn Function to persist the update
   * @returns Update result with ID
   */
  const applyUpdate = useCallback(async (
    update: Partial<T>,
    syncFn: (update: Partial<T>) => Promise<any>
  ) => {
    // Skip if update shouldn't be applied
    if (!shouldApply(state, update)) {
      return { applied: false, id: '' };
    }
    
    // Generate update ID
    const updateId = uuidv4();
    
    // Create update entry
    const entry: UpdateEntry<T> = {
      id: updateId,
      update,
      status: 'pending',
      timestamp: Date.now(),
      retryCount: 0
    };
    
    // Apply update optimistically
    setState(currentState => ({ ...currentState, ...update }));
    
    // Add to updates list
    setUpdates(currentUpdates => [...currentUpdates, entry]);
    
    // Set status if this is the first pending update
    if (updates.filter(u => u.status === 'pending').length === 0) {
      setStatus('pending');
    }
    
    try {
      // Sync update with the server
      const result = await syncFn(update);
      
      // Mark update as successful
      setUpdates(currentUpdates => 
        currentUpdates.map(u => 
          u.id === updateId 
            ? { ...u, status: 'success' } 
            : u
        )
      );
      
      // Check if all updates are resolved
      const allResolved = updates
        .filter(u => u.id !== updateId)
        .every(u => u.status !== 'pending');
        
      if (allResolved) {
        setStatus('success');
      }
      
      // Call sync complete callback
      if (onSyncComplete) {
        onSyncComplete(state);
      }
      
      return { applied: true, result, id: updateId };
    } catch (error) {
      console.error('Failed to sync update', error);
      
      // Mark update as failed
      setUpdates(currentUpdates => 
        currentUpdates.map(u => 
          u.id === updateId 
            ? { 
                ...u, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Unknown error' 
              } 
            : u
        )
      );
      
      // Roll back the update
      setState(currentState => rollbackUpdate(currentState, update, updateId));
      
      // Set status if all pending updates are now resolved
      const allResolved = updates
        .filter(u => u.id !== updateId)
        .every(u => u.status !== 'pending');
        
      if (allResolved) {
        setStatus('error');
      }
      
      return {
        applied: false,
        error,
        id: updateId
      };
    }
  }, [state, updates, shouldApply, rollbackUpdate, onSyncComplete]);
  
  /**
   * Retry a failed update
   * @param updateId Update ID to retry
   * @param syncFn Function to persist the update
   * @returns Whether retry was successful
   */
  const retryUpdate = useCallback(async (
    updateId: string,
    syncFn: (update: Partial<T>) => Promise<any>
  ) => {
    // Find the update
    const updateEntry = updates.find(u => u.id === updateId);
    
    if (!updateEntry || updateEntry.status !== 'error') {
      return false;
    }
    
    // Mark as pending
    setUpdates(currentUpdates => 
      currentUpdates.map(u => 
        u.id === updateId 
          ? { ...u, status: 'pending', retryCount: u.retryCount + 1 } 
          : u
      )
    );
    
    // Re-apply the update
    setState(currentState => ({ ...currentState, ...updateEntry.update }));
    
    // Set status to pending if it was idle/error
    if (status !== 'pending') {
      setStatus('pending');
    }
    
    try {
      // Sync update with the server
      const result = await syncFn(updateEntry.update);
      
      // Mark update as successful
      setUpdates(currentUpdates => 
        currentUpdates.map(u => 
          u.id === updateId 
            ? { ...u, status: 'success' } 
            : u
        )
      );
      
      // Check if all updates are resolved
      const allResolved = updates
        .filter(u => u.id !== updateId)
        .every(u => u.status !== 'pending');
        
      if (allResolved) {
        setStatus('success');
      }
      
      // Call sync complete callback
      if (onSyncComplete) {
        onSyncComplete(state);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to retry update', error);
      
      // Mark update as failed again
      setUpdates(currentUpdates => 
        currentUpdates.map(u => 
          u.id === updateId 
            ? { 
                ...u, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Unknown error' 
              } 
            : u
        )
      );
      
      // Roll back the update
      setState(currentState => rollbackUpdate(currentState, updateEntry.update, updateId));
      
      // Set status if all pending updates are now resolved
      const allResolved = updates
        .filter(u => u.id !== updateId)
        .every(u => u.status !== 'pending');
        
      if (allResolved) {
        setStatus('error');
      }
      
      return false;
    }
  }, [state, updates, status, rollbackUpdate, onSyncComplete]);
  
  /**
   * Discard a failed update
   * @param updateId Update ID to discard
   */
  const discardUpdate = useCallback((updateId: string) => {
    // Find the update
    const updateEntry = updates.find(u => u.id === updateId);
    
    if (!updateEntry) {
      return false;
    }
    
    // If it was successful or pending, roll it back
    if (updateEntry.status === 'success' || updateEntry.status === 'pending') {
      setState(currentState => rollbackUpdate(currentState, updateEntry.update, updateId));
    }
    
    // Remove from updates list
    setUpdates(currentUpdates => currentUpdates.filter(u => u.id !== updateId));
    
    // Update status based on remaining updates
    const pendingUpdates = updates.filter(u => u.id !== updateId && u.status === 'pending');
    const errorUpdates = updates.filter(u => u.id !== updateId && u.status === 'error');
    
    if (pendingUpdates.length > 0) {
      setStatus('pending');
    } else if (errorUpdates.length > 0) {
      setStatus('error');
    } else {
      setStatus('idle');
    }
    
    return true;
  }, [updates, rollbackUpdate]);
  
  /**
   * Set up auto-sync interval
   */
  useState(() => {
    // Skip if auto-sync is disabled
    if (autoSyncInterval <= 0) {
      return;
    }
    
    // Set up interval
    syncIntervalRef.current = setInterval(() => {
      // Find pending updates that have been pending too long
      const now = Date.now();
      const timedOutUpdates = updates.filter(
        u => u.status === 'pending' && now - u.timestamp > pendingTimeout
      );
      
      // Mark timed out updates as errors
      if (timedOutUpdates.length > 0) {
        setUpdates(currentUpdates => 
          currentUpdates.map(u => 
            timedOutUpdates.some(tu => tu.id === u.id)
              ? { ...u, status: 'error', error: 'Update timed out' }
              : u
          )
        );
        
        // Roll back the updates
        timedOutUpdates.forEach(update => {
          setState(currentState => 
            rollbackUpdate(currentState, update.update, update.id)
          );
        });
      }
    }, autoSyncInterval);
    
    // Clean up interval
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);
  
  /**
   * Reset the state
   * @param newState New state to set
   */
  const resetState = useCallback((newState: T = options.initialState) => {
    setState(newState);
    setUpdates([]);
    setStatus('idle');
  }, [options.initialState]);
  
  /**
   * Get pending updates that should be synced
   */
  const getPendingUpdates = useCallback(() => {
    return updates.filter(u => u.status === 'pending');
  }, [updates]);
  
  /**
   * Get failed updates that could be retried
   */
  const getFailedUpdates = useCallback(() => {
    return updates.filter(u => u.status === 'error');
  }, [updates]);
  
  return {
    // Current state with optimistic updates
    state,
    
    // Updates
    updates,
    pendingUpdates: getPendingUpdates(),
    failedUpdates: getFailedUpdates(),
    
    // Status
    status,
    
    // Actions
    applyUpdate,
    retryUpdate,
    discardUpdate,
    resetState
  };
}
