/**
 * Data Factories
 * 
 * Factories for creating test data instances with sensible defaults and customization.
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * Basic factory interface for creating model instances
 */
export interface DataFactory<T> {
  create(overrides?: Partial<T>): T;
  createMany(count: number, overrides?: Partial<T>): T[];
  sequence<K extends keyof T>(field: K, generator: SequenceGenerator<T[K]>): DataFactory<T>;
  association<K extends keyof T>(field: K, factory: DataFactory<any>): DataFactory<T>;
}

/**
 * Type for sequence generator functions
 */
export type SequenceGenerator<T> = (index: number) => T;

/**
 * Type for factory definition functions
 */
export type FactoryDefinition<T> = {
  [K in keyof T]: T[K] | (() => T[K]);
};

/**
 * Creates a factory for generating model instances
 * 
 * @param definition Factory definition with default values
 * @returns A factory instance
 */
export function createFactory<T>(definition: FactoryDefinition<T>): DataFactory<T> {
  // Track sequence generators
  const sequenceGenerators = new Map<keyof T, SequenceGenerator<any>>();
  let sequenceCounter = 0;
  
  // Track associations
  const associations = new Map<keyof T, DataFactory<any>>();
  
  const factory: DataFactory<T> = {
    /**
     * Create a single model instance
     * 
     * @param overrides Properties to override
     * @returns A model instance
     */
    create(overrides = {}): T {
      // Start with a fresh instance
      const instance = {} as T;
      
      // Apply default values from definition
      for (const [key, value] of Object.entries(definition)) {
        const k = key as keyof T;
        
        // Check if there's a sequence generator for this field
        if (sequenceGenerators.has(k)) {
          const generator = sequenceGenerators.get(k)!;
          instance[k] = generator(sequenceCounter);
        }
        // Check if there's an association for this field
        else if (associations.has(k)) {
          const associatedFactory = associations.get(k)!;
          instance[k] = associatedFactory.create();
        }
        // Otherwise use the default value
        else {
          instance[k] = typeof value === 'function' ? (value as () => T[keyof T])() : value;
        }
      }
      
      // Increment sequence counter after creating an instance
      sequenceCounter++;
      
      // Apply overrides
      for (const [key, value] of Object.entries(overrides)) {
        (instance as any)[key] = value;
      }
      
      return instance;
    },
    
    /**
     * Create multiple model instances
     * 
     * @param count Number of instances to create
     * @param overrides Properties to override in all instances
     * @returns An array of model instances
     */
    createMany(count, overrides = {}): T[] {
      return Array.from({ length: count }).map(() => factory.create(overrides));
    },
    
    /**
     * Define a sequence generator for a field
     * 
     * @param field Field to generate values for
     * @param generator Function to generate sequential values
     * @returns The factory instance for chaining
     */
    sequence<K extends keyof T>(field: K, generator: SequenceGenerator<T[K]>): DataFactory<T> {
      sequenceGenerators.set(field, generator);
      return factory;
    },
    
    /**
     * Define an association with another factory
     * 
     * @param field Field to generate associated values for
     * @param associatedFactory Factory to create associated instances
     * @returns The factory instance for chaining
     */
    association<K extends keyof T>(field: K, associatedFactory: DataFactory<any>): DataFactory<T> {
      associations.set(field, associatedFactory);
      return factory;
    }
  };
  
  return factory;
}

// Export factory instances for common models
export * from './user';
export * from './points';
export * from './content';
export * from './wallet';

// Default export for convenient imports
export default {
  createFactory,
};
