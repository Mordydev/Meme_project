/**
 * Tree shaking utilities for identifying and resolving issues 
 * that prevent effective tree shaking during bundling
 */

// Common packages that need special handling for tree shaking
const TREE_SHAKABLE_PACKAGES = {
  'lodash': {
    problem: 'Default import prevents tree shaking',
    badImport: "import _ from 'lodash'",
    goodImport: "import { map, filter } from 'lodash'",
    alternateImport: "import map from 'lodash/map'",
    note: 'Import specific functions instead of the entire library'
  },
  'date-fns': {
    problem: 'Default import prevents tree shaking',
    badImport: "import * as dateFns from 'date-fns'",
    goodImport: "import { format, parse } from 'date-fns'",
    note: 'Import only the specific functions you need'
  },
  '@mui/material': {
    problem: 'Default import includes all components',
    badImport: "import Material from '@mui/material'",
    goodImport: "import { Button, TextField } from '@mui/material'",
    note: 'Import individual components to enable tree shaking'
  },
  '@mui/icons-material': {
    problem: 'Default import includes all icons',
    badImport: "import Icons from '@mui/icons-material'",
    goodImport: "import { Home, Settings } from '@mui/icons-material'",
    alternateImport: "import Home from '@mui/icons-material/Home'",
    note: 'Import individual icons or use specific path imports'
  },
  'rxjs': {
    problem: 'Importing from root prevents tree shaking',
    badImport: "import { Subject } from 'rxjs'",
    goodImport: "import { Subject } from 'rxjs/Subject'",
    note: 'Import from specific submodules for better tree shaking'
  }
};

/**
 * Check a source file for potential tree shaking issues
 * @param {string} sourceCode The source code content
 * @param {string} filePath The file path (for reporting)
 * @return {Array} List of potential tree shaking issues
 */
function analyzeTreeShakingIssues(sourceCode, filePath) {
  const issues = [];
  
  // Check for problematic import patterns
  Object.entries(TREE_SHAKABLE_PACKAGES).forEach(([packageName, info]) => {
    // Check for default import
    const defaultImportRegex = new RegExp(`import\\s+[^{]*\\s+from\\s+['"]${packageName}['"]`);
    if (defaultImportRegex.test(sourceCode)) {
      issues.push({
        file: filePath,
        package: packageName,
        issue: 'non-tree-shakable-import',
        problem: info.problem,
        suggestion: info.goodImport,
        alternate: info.alternateImport,
        note: info.note,
        severity: 'warning'
      });
    }
    
    // Check for namespace import
    const namespaceImportRegex = new RegExp(`import\\s+\\*\\s+as\\s+\\w+\\s+from\\s+['"]${packageName}['"]`);
    if (namespaceImportRegex.test(sourceCode)) {
      issues.push({
        file: filePath,
        package: packageName,
        issue: 'namespace-import-prevents-tree-shaking',
        problem: 'Namespace import prevents tree shaking',
        suggestion: info.goodImport,
        note: info.note,
        severity: 'warning'
      });
    }
  });
  
  // Check for dynamic imports without webpackChunkName
  const dynamicImportRegex = /import\(\s*['"][^'"]+['"][^)]*\)/g;
  let match;
  while ((match = dynamicImportRegex.exec(sourceCode)) !== null) {
    const importStatement = match[0];
    if (!importStatement.includes('webpackChunkName')) {
      issues.push({
        file: filePath,
        issue: 'unnamed-dynamic-import',
        problem: 'Dynamic import without webpackChunkName',
        example: importStatement,
        suggestion: "import(/* webpackChunkName: \"feature-name\" */ './path/to/module')",
        note: 'Named chunks help with debugging and can be optimized better',
        severity: 'info'
      });
    }
  }
  
  // Check for side-effectful imports
  const sideEffectImportRegex = /import\s+['"][^'"]+['"]\s*;?/g;
  while ((match = sideEffectImportRegex.exec(sourceCode)) !== null) {
    issues.push({
      file: filePath,
      issue: 'side-effect-import',
      problem: 'Side-effect import might include unused code',
      example: match[0],
      suggestion: 'Make sure this import is necessary and the module has "sideEffects" properly configured',
      note: 'Side-effect imports can prevent proper tree shaking',
      severity: 'info'
    });
  }
  
  return issues;
}

/**
 * Create proper sideEffects configuration for package.json
 * @param {Array} sourceFiles List of source files with their content
 * @return {Object} Recommended sideEffects configuration
 */
function generateSideEffectsConfig(sourceFiles) {
  // Files that likely have side effects
  const sideEffectPatterns = [
    '**/*.css',
    '**/*.scss',
    '**/*.sass',
    '**/*.less',
    '**/polyfills.js',
    '**/global.js',
    '**/register.js'
  ];
  
  // Additional files with detected side effects
  const additionalFiles = [];
  
  sourceFiles.forEach(file => {
    // Crude detection of files with likely side effects
    if (
      file.content.includes('document.addEventListener') ||
      file.content.includes('window.addEventListener') ||
      file.content.includes('Object.defineProperty(global') ||
      file.content.includes('registerServiceWorker')
    ) {
      additionalFiles.push(file.path);
    }
  });
  
  return {
    recommended: additionalFiles.length > 0 
      ? [...sideEffectPatterns, ...additionalFiles]
      : sideEffectPatterns,
    strictMode: false, // Safe default
    explanation: `
- Set "sideEffects": false in package.json for maximum tree shaking
- Or use an array of patterns to specify files with side effects
- CSS and other style imports always have side effects
- Be careful with strictMode, as it can break styles and global code
`
  };
}

/**
 * Suggest improvements to webpack configuration for tree shaking
 * @return {Object} Recommended webpack configuration changes
 */
function getWebpackTreeShakingRecommendations() {
  return {
    optimization: {
      usedExports: true,
      sideEffects: true,
      providedExports: true,
    },
    resolve: {
      mainFields: ['browser', 'module', 'main'],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          include: /node_modules/,
          sideEffects: false
        }
      ],
    },
    explanation: `
- usedExports: Marks code as used/unused based on usage
- sideEffects: Enables elimination of whole modules
- providedExports: Helps determine what modules export
- mainFields: Prefer ESM versions of packages using the "module" field
- node_modules rule: Consider modules side-effect free if not in package.json
`
  };
}

/**
 * Create a report on potential tree shaking improvements
 * @param {Object} bundleStats Webpack bundle stats object
 * @return {Object} Tree shaking improvement report
 */
function createTreeShakingReport(bundleStats) {
  // This would use actual bundle stats in a real implementation
  const largeBundleThreshold = 50000; // 50KB
  
  const report = {
    unusedExports: [],
    largeModules: [],
    sideEffectIssues: [],
    recommendations: []
  };
  
  // Look for unusually large modules that might have tree shaking issues
  if (bundleStats && bundleStats.modules) {
    bundleStats.modules.forEach(module => {
      if (module.size > largeBundleThreshold) {
        report.largeModules.push({
          name: module.name,
          size: module.size,
          reason: 'Large module size may indicate tree shaking issues'
        });
      }
    });
  }
  
  // Common recommendations
  report.recommendations = [
    'Ensure all dependencies support ES modules (check package.json "module" field)',
    'Use specific imports instead of default or namespace imports',
    'Set "sideEffects": false in package.json if your code has no side effects',
    'Use production mode builds which enable more aggressive optimizations',
    'Update webpack config with recommended tree shaking settings'
  ];
  
  return report;
}

module.exports = {
  TREE_SHAKABLE_PACKAGES,
  analyzeTreeShakingIssues,
  generateSideEffectsConfig,
  getWebpackTreeShakingRecommendations,
  createTreeShakingReport
};
