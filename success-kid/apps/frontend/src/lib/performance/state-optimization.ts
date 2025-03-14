'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { shallow } from 'zustand/shallow';
import performanceMonitor from './metrics';

/**
 * State optimization types
 */
export interface UseSelectorOptions {
  equalityFn?: (a: any, b: any) => boolean;
  memoize?: boolean;
}

export interface StateNormalization<T> {
  entities: Record<string, T>;
  ids: string[];
}

/**
 * Optimized selector hook
 */
export function useOptimizedSelector<T, S>(
  store: any,
  selector: (state: S) => T,
  options: UseSelectorOptions = {}
): T {
  const selectorRef = useRef(selector);
  const prevValueRef = useRef<T | undefined>(undefined);
  const equalityFn = options.equalityFn || shallow;
  const shouldMemoize = options.memoize !== false;
  
  // Stabilize selector reference if memoization is enabled
  const stableSelector = useCallback((state: S) => {
    const startTime = performance.now();
    const selectedValue = selectorRef.current(state);
    const endTime = performance.now();
    
    // Track selector performance
    performanceMonitor.trackEvent('selector', 'execution', endTime - startTime);
    
    return selectedValue;
  }, []);
  
  // Use the selector with the store
  const value = useStore(store, stableSelector, equalityFn);
  
  // Memoize the value if needed
  if (shouldMemoize) {
    const prevValue = prevValueRef.current;
    
    if (prevValue !== undefined && equalityFn(prevValue, value)) {
      prevValueRef.current = prevValue;
      return prevValue;
    }
    
    prevValueRef.current = value;
  }
  
  return value;
}

/**
 * Context with selector pattern for optimized context usage
 */
export function createSelectorContext<T>(initialState: T) {
  const Context = createContext<T>(initialState);
  
  function Provider({ children, value }: { children: React.ReactNode, value: T }) {
    // Track context updates
    const updateCountRef = useRef(0);
    
    // Increment update counter on each render
    updateCountRef.current += 1;
    
    // Track context updates periodically
    React.useEffect(() => {
      performanceMonitor.trackEvent('context', 'updates', updateCountRef.current);
      
      // Reset counter
      return () => {
        updateCountRef.current = 0;
      };
    }, []);
    
    return (
      <Context.Provider value={value}>
        {children}
      </Context.Provider>
    );
  }
  
  /**
   * Hook to select specific state from context
   */
  function useContextSelector<K>(selector: (state: T) => K, equalityFn: (a: K, b: K) => boolean = (a, b) => a === b) {
    const context = useContext(Context);
    const selectorRef = useRef(selector);
    const prevSelectedRef = useRef<K | undefined>(undefined);
    const prevContextRef = useRef<T | null>(null);
    
    // Update selector reference without causing re-renders
    selectorRef.current = selector;
    
    // Compute the selected value, with performance tracking
    const selected = useMemo(() => {
      const startTime = performance.now();
      
      // Apply selector to get value
      const selectedValue = selectorRef.current(context);
      
      // Track selector performance
      const duration = performance.now() - startTime;
      performanceMonitor.trackEvent('contextSelector', 'execution', duration);
      
      // If context hasn't changed, we can return previous value
      if (
        prevContextRef.current === context && 
        prevSelectedRef.current !== undefined && 
        equalityFn(prevSelectedRef.current, selectedValue)
      ) {
        return prevSelectedRef.current;
      }
      
      // Update refs for next comparison
      prevContextRef.current = context;
      prevSelectedRef.current = selectedValue;
      
      return selectedValue;
    }, [context, equalityFn]);
    
    return selected;
  }
  
  return {
    Provider,
    useContext: () => useContext(Context),
    useContextSelector
  };
}

/**
 * Normalize an array of objects for efficient state management
 */
export function normalizeState<T extends { id: string }>(items: T[]): StateNormalization<T> {
  return {
    entities: items.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, T>),
    ids: items.map(item => item.id)
  };
}

/**
 * Immutable update functions for normalized state
 */
export const normalizedStateOperations = {
  /**
   * Add a single entity to normalized state
   */
  addOne: <T extends { id: string }>(
    state: StateNormalization<T>,
    entity: T
  ): StateNormalization<T> => {
    return {
      entities: {
        ...state.entities,
        [entity.id]: entity
      },
      ids: state.ids.includes(entity.id)
        ? state.ids
        : [...state.ids, entity.id]
    };
  },
  
  /**
   * Add multiple entities to normalized state
   */
  addMany: <T extends { id: string }>(
    state: StateNormalization<T>,
    entities: T[]
  ): StateNormalization<T> => {
    const newEntities = { ...state.entities };
    const newIds = [...state.ids];
    
    entities.forEach(entity => {
      newEntities[entity.id] = entity;
      if (!newIds.includes(entity.id)) {
        newIds.push(entity.id);
      }
    });
    
    return {
      entities: newEntities,
      ids: newIds
    };
  },
  
  /**
   * Update a single entity in normalized state
   */
  updateOne: <T extends { id: string }>(
    state: StateNormalization<T>,
    update: { id: string; changes: Partial<T> }
  ): StateNormalization<T> => {
    const entity = state.entities[update.id];
    if (!entity) return state;
    
    return {
      ...state,
      entities: {
        ...state.entities,
        [update.id]: {
          ...entity,
          ...update.changes
        }
      }
    };
  },
  
  /**
   * Update multiple entities in normalized state
   */
  updateMany: <T extends { id: string }>(
    state: StateNormalization<T>,
    updates: Array<{ id: string; changes: Partial<T> }>
  ): StateNormalization<T> => {
    const newEntities = { ...state.entities };
    let hasChanges = false;
    
    updates.forEach(update => {
      const entity = newEntities[update.id];
      if (entity) {
        newEntities[update.id] = { ...entity, ...update.changes };
        hasChanges = true;
      }
    });
    
    return hasChanges
      ? { ...state, entities: newEntities }
      : state;
  },
  
  /**
   * Remove a single entity from normalized state
   */
  removeOne: <T extends { id: string }>(
    state: StateNormalization<T>,
    id: string
  ): StateNormalization<T> => {
    const { [id]: removed, ...newEntities } = state.entities;
    
    return {
      entities: newEntities,
      ids: state.ids.filter(itemId => itemId !== id)
    };
  },
  
  /**
   * Remove multiple entities from normalized state
   */
  removeMany: <T extends { id: string }>(
    state: StateNormalization<T>,
    ids: string[]
  ): StateNormalization<T> => {
    const newEntities = { ...state.entities };
    let hasChanges = false;
    
    ids.forEach(id => {
      if (id in newEntities) {
        delete newEntities[id];
        hasChanges = true;
      }
    });
    
    return hasChanges
      ? {
          entities: newEntities,
          ids: state.ids.filter(id => !ids.includes(id))
        }
      : state;
  }
};

/**
 * Helper function to create derived state from multiple selectors
 */
export function createDerivedState<S, R>(
  selectors: ((state: S) => any)[],
  resultFn: (...args: any[]) => R
): (state: S) => R {
  const startTimeRef = { current: 0 };
  
  return (state: S) => {
    startTimeRef.current = performance.now();
    
    // Apply all selectors
    const selectedValues = selectors.map(selector => selector(state));
    
    // Apply the result function
    const result = resultFn(...selectedValues);
    
    // Track performance
    const duration = performance.now() - startTimeRef.current;
    performanceMonitor.trackEvent('derivedState', 'calculation', duration);
    
    return result;
  };
}

/**
 * Hook to efficiently derive values from state
 */
export function useDerivedState<S, R>(
  store: any,
  selectors: ((state: S) => any)[],
  resultFn: (...args: any[]) => R,
  equalityFn: (a: R, b: R) => boolean = (a, b) => a === b
): R {
  // Create memoized selectors
  const memoizedSelectors = useMemo(() => selectors, []);
  
  // Create stable result function
  const stableResultFn = useCallback(resultFn, []);
  
  // Create a derived selector
  const derivedSelector = useMemo(() => {
    return createDerivedState<S, R>(memoizedSelectors, stableResultFn);
  }, [memoizedSelectors, stableResultFn]);
  
  // Use the derived selector
  return useOptimizedSelector(store, derivedSelector, { equalityFn });
}

/**
 * Hook to batch state updates for better performance
 */
export function useBatchedUpdates<T>(
  initialState: T,
  batchTime: number = 100
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdatesRef = useRef<Partial<T> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const batchedSetState = useCallback((updates: Partial<T>) => {
    // Start performance tracking
    const startTime = performance.now();
    
    // Merge with any pending updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates
    };
    
    // If no timer is active, set one up
    if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        // Apply all pending updates at once
        if (pendingUpdatesRef.current) {
          setState(prev => ({
            ...prev,
            ...pendingUpdatesRef.current
          }));
          
          // Clear pending updates
          pendingUpdatesRef.current = null;
        }
        
        // Clear timer reference
        timerRef.current = null;
        
        // Track performance
        const duration = performance.now() - startTime;
        performanceMonitor.trackEvent('batchedUpdates', 'applied', duration);
      }, batchTime);
    }
  }, [batchTime]);
  
  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  return [state, batchedSetState];
}

/**
 * Create an optimized reducer for complex state
 */
export function createOptimizedReducer<S, A extends { type: string; payload?: any }>(
  handlers: Record<string, (state: S, action: A) => S>,
  initialState: S
): [React.Reducer<S, A>, S] {
  const reducer = (state: S, action: A): S => {
    // Start performance timing
    const startTime = performance.now();
    
    // Find the appropriate handler
    const handler = handlers[action.type];
    
    if (!handler) {
      // If no handler is found, return the state unchanged
      return state;
    }
    
    // Apply the handler
    const newState = handler(state, action);
    
    // Track performance
    const duration = performance.now() - startTime;
    performanceMonitor.trackEvent('reducer', action.type, duration);
    
    return newState;
  };
  
  return [reducer, initialState];
}

/**
 * Memoized state access with performance tracking
 */
export function useTrackState<T, K>(obj: T, selector: (obj: T) => K): K {
  // Start performance timing
  const startTime = performance.now();
  
  // Apply the selector
  const selectedValue = selector(obj);
  
  // Track performance
  React.useEffect(() => {
    const duration = performance.now() - startTime;
    performanceMonitor.trackEvent('stateAccess', 'selection', duration);
  }, []);
  
  return selectedValue;
}

/**
 * Create a debounced state setter
 */
export function useDebouncedState<T>(
  initialState: T,
  delay: number = 300
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSetState = useCallback((newValue: T) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      setState(newValue);
      timeoutRef.current = null;
      
      // Track state update
      performanceMonitor.trackEvent('debouncedState', 'update', 0);
    }, delay);
  }, [delay]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return [state, debouncedSetState];
}

/**
 * Create immutable update utilities for better performance
 */
export const immutableUpdates = {
  /**
   * Update an item in an array
   */
  updateItemInArray<T>(array: T[], itemId: string | number, updateItemCallback: (item: T) => T): T[] {
    const startTime = performance.now();
    
    const updatedItems = array.map(item => {
      if ((item as any).id !== itemId) {
        return item;
      }
      
      // Return a new object with the updated values
      return updateItemCallback(item);
    });
    
    // Track performance
    const duration = performance.now() - startTime;
    performanceMonitor.trackEvent('immutableUpdate', 'updateItemInArray', duration);
    
    return updatedItems;
  },
  
  /**
   * Add an item to an array
   */
  addItemToArray<T>(array: T[], item: T): T[] {
    // Track performance
    const startTime = performance.now();
    const result = [...array, item];
    
    const duration = performance.now() - startTime;
    performanceMonitor.trackEvent('immutableUpdate', 'addItemToArray', duration);
    
    return result;
  },
  
  /**
   * Remove an item from an array
   */
  removeItemFromArray<T>(array: T[], itemId: string | number): T[] {
    // Track performance
    const startTime = performance.now();
    
    const result = array.filter(item => (item as any).id !== itemId);
    
    const duration = performance.now() - startTime;
    performanceMonitor.trackEvent('immutableUpdate', 'removeItemFromArray', duration);
    
    return result;
  },
  
  /**
   * Update a nested property in an object
   */
  updateNestedObject<T>(obj: T, path: string[], value: any): T {
    // Track performance
    const startTime = performance.now();
    
    if (path.length === 0) return obj;
    
    const [first, ...rest] = path;
    const result = { ...obj };
    
    if (rest.length === 0) {
      // Base case: update the property directly
      (result as any)[first] = value;
    } else {
      // Recursive case: update the nested object
      (result as any)[first] = this.updateNestedObject(
        (obj as any)[first] || {},
        rest,
        value
      );
    }
    
    const duration = performance.now() - startTime;
    performanceMonitor.trackEvent('immutableUpdate', 'updateNestedObject', duration);
    
    return result;
  }
};
