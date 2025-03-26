// This file provides Lodash functions needed by Recharts

// isFunction
export function isFunction(value) {
  return typeof value === 'function';
}

// max
export function max(array) {
  if (!array || array.length === 0) {
    return undefined;
  }
  
  return Math.max(...array.filter(val => !isNaN(val)));
}

// isNil
export function isNil(value) {
  return value === null || value === undefined;
}

// isNaN
export function isNaN(value) {
  return Number.isNaN(value);
}
