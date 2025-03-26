/**
 * Recharts Lodash Resolver
 * 
 * This file resolves the lodash functions used by Recharts to use the correct imports
 * from the main lodash package instead of individual modules.
 */

const lodash = require('lodash');

// Export the lodash functions that Recharts needs
module.exports = lodash;
module.exports.default = lodash;

// Ensure specific methods are available both as named exports and properties
module.exports.isFunction = lodash.isFunction;
module.exports.isNil = lodash.isNil;
module.exports.isNaN = lodash.isNaN;
module.exports.max = lodash.max;
