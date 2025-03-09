/**
 * Dependency audit utilities for analyzing and optimizing dependencies
 * These are primarily used during the build process
 */

// Map of known large dependencies and alternatives
const LARGE_DEPENDENCIES = {
  'moment': {
    size: '~329KB',
    alternatives: ['date-fns', 'dayjs', 'luxon'],
    notes: 'Very large date manipulation library. Consider lighter alternatives.'
  },
  'lodash': {
    size: '~526KB',
    alternatives: ['lodash-es (with tree-shaking)', 'remeda', 'individual lodash functions'],
    notes: 'Import specific functions or use lodash-es with tree-shaking for better optimization.'
  },
  'react-bootstrap': {
    size: '~190KB',
    alternatives: ['@headlessui/react', 'shadcn/ui with Tailwind'],
    notes: 'Consider more lightweight alternatives that leverage your existing Tailwind setup.'
  },
  'chart.js': {
    size: '~165KB',
    alternatives: ['lightweight-charts', 'recharts', 'uPlot'],
    notes: 'Full featured but large. Consider more focused charting libraries if only using basic charts.'
  },
  '@material-ui/core': {
    size: '~310KB',
    alternatives: ['@mui/material (with tree-shaking)', 'shadcn/ui'],
    notes: 'Very large UI library. Use with proper tree-shaking or consider alternatives.'
  }
};

/**
 * Analyzes package.json dependencies for potential size issues
 * @param {Object} packageJson The package.json contents as an object
 * @return {Array} List of potential dependency issues
 */
function auditDependencies(packageJson) {
  const issues = [];
  const deps = { 
    ...packageJson.dependencies,
    ...packageJson.devDependencies 
  };
  
  // Check for known large dependencies
  Object.keys(deps).forEach(dep => {
    // Check exact package name
    if (LARGE_DEPENDENCIES[dep]) {
      issues.push({
        package: dep,
        version: deps[dep],
        size: LARGE_DEPENDENCIES[dep].size,
        alternatives: LARGE_DEPENDENCIES[dep].alternatives,
        notes: LARGE_DEPENDENCIES[dep].notes,
        severity: 'warning'
      });
    }
    
    // Check for packages containing the name (e.g. "firebase/app" -> "firebase")
    Object.keys(LARGE_DEPENDENCIES).forEach(largeDep => {
      if (dep.includes(largeDep) && dep !== largeDep) {
        issues.push({
          package: dep,
          relatedTo: largeDep,
          version: deps[dep],
          notes: `Sub-package of ${largeDep}. Check if you're using efficiently.`,
          severity: 'info'
        });
      }
    });
  });
  
  // Check for duplicate concerns (multiple packages solving the same problem)
  const concernGroups = {
    'styling': ['styled-components', 'emotion', '@emotion/react', '@emotion/styled', 'sass', 'less'],
    'state-management': ['redux', 'mobx', 'recoil', 'zustand', 'jotai', 'valtio'],
    'routing': ['react-router', 'react-router-dom', 'next/router', '@tanstack/react-router'],
    'form-handling': ['formik', 'react-hook-form', 'final-form', 'react-final-form'],
    'data-fetching': ['swr', 'react-query', '@tanstack/react-query', 'apollo-client', '@apollo/client'],
    'ui-frameworks': ['@material-ui/core', '@mui/material', 'antd', 'react-bootstrap', 'chakra-ui']
  };
  
  Object.entries(concernGroups).forEach(([concern, libraries]) => {
    const found = libraries.filter(lib => deps[lib]);
    
    if (found.length > 1) {
      issues.push({
        concern,
        duplicates: found.map(lib => ({ package: lib, version: deps[lib] })),
        notes: `Multiple libraries addressing ${concern}. Consider standardizing on one solution.`,
        severity: 'warning'
      });
    }
  });
  
  // Check for potentially unused dependencies
  // This is just a heuristic - would need project scanning for accuracy
  const potentiallyUnused = [];
  Object.keys(packageJson.devDependencies || {}).forEach(dep => {
    // Commonly installed but unused dev dependencies
    if (['@types/node', '@types/react', '@types/react-dom', 'eslint-config-prettier'].includes(dep)) {
      // These are probably used, just flagging as examples
      potentiallyUnused.push(dep);
    }
  });
  
  if (potentiallyUnused.length > 0) {
    issues.push({
      concern: 'potentially-unused',
      packages: potentiallyUnused,
      notes: 'These dependencies might not be directly used. Verify and consider removing.',
      severity: 'info'
    });
  }
  
  return issues;
}

/**
 * Checks for version mismatch between peer dependencies and installed packages
 * @param {Object} packageJson The package.json contents as an object
 * @param {Object} installedDeps Map of installed dependencies (from package-lock or node_modules)
 * @return {Array} List of version mismatches
 */
function checkVersionMismatches(packageJson, installedDeps) {
  const mismatches = [];
  const semver = require('semver'); // Assuming semver is available
  
  Object.keys(installedDeps).forEach(dep => {
    if (installedDeps[dep].peerDependencies) {
      Object.entries(installedDeps[dep].peerDependencies).forEach(([peerDep, versionRange]) => {
        const installedVersion = installedDeps[peerDep]?.version;
        
        if (installedVersion && !semver.satisfies(installedVersion, versionRange)) {
          mismatches.push({
            package: dep,
            peerDependency: peerDep,
            expectedVersion: versionRange,
            actualVersion: installedVersion,
            severity: 'warning'
          });
        }
      });
    }
  });
  
  return mismatches;
}

/**
 * Identifies suspicious dependency patterns
 * @param {Object} packageJson The package.json contents
 * @return {Array} List of suspicious patterns
 */
function findSuspiciousPatterns(packageJson) {
  const suspicious = [];
  const deps = { 
    ...packageJson.dependencies,
    ...packageJson.devDependencies 
  };
  
  // Look for exact versions that could be replaced with range
  Object.entries(deps).forEach(([dep, version]) => {
    if (
      /^\d+\.\d+\.\d+$/.test(version) && // Exact version like "2.3.4"
      !dep.startsWith('@types/') && // Ignore types
      !dep.startsWith('@wildnout/') // Ignore internal packages
    ) {
      suspicious.push({
        package: dep,
        version,
        issue: 'exact-version',
        suggestion: `Consider using ^${version} to allow compatible updates`,
        severity: 'info'
      });
    }
  });
  
  // Look for duplicate dependencies and dev dependencies
  Object.keys(packageJson.dependencies || {}).forEach(dep => {
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      suspicious.push({
        package: dep,
        issue: 'duplicate-declaration',
        inDependencies: packageJson.dependencies[dep],
        inDevDependencies: packageJson.devDependencies[dep],
        suggestion: 'Package declared in both dependencies and devDependencies',
        severity: 'warning'
      });
    }
  });
  
  return suspicious;
}

/**
 * Visualizes dependency tree and sizes
 * @param {Object} packageJson The package.json contents
 * @param {Object} options Configuration options
 * @return {Object} Visualization data
 */
function visualizeDependencies(packageJson, options = {}) {
  // This would ideally use something like `npm ls --json` output
  // For now, we'll create a simplified structure
  const deps = packageJson.dependencies || {};
  
  const visualization = {
    name: packageJson.name,
    version: packageJson.version,
    dependencies: Object.keys(deps).map(dep => ({
      name: dep,
      version: deps[dep],
      // In a real implementation, we would recursively build the tree
      // and include size information from actual node_modules analysis
      size: '(unknown)', // Placeholder
      children: []
    }))
  };
  
  return visualization;
}

module.exports = {
  auditDependencies,
  checkVersionMismatches,
  findSuspiciousPatterns,
  visualizeDependencies,
  LARGE_DEPENDENCIES
};
