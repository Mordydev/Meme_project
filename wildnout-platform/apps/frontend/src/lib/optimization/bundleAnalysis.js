/**
 * Bundle analysis utility functions
 * These are primarily used during build time to optimize bundle size
 */

// Track bundled modules and their sizes
const trackModuleSizes = (stats) => {
  const modulesBySize = [];
  
  if (stats && stats.modules) {
    stats.modules.forEach(module => {
      if (module.size > 0) {
        modulesBySize.push({
          name: module.name,
          size: module.size,
          sizeFormatted: formatSize(module.size),
        });
      }
    });
  }
  
  // Sort by size (largest first)
  modulesBySize.sort((a, b) => b.size - a.size);
  
  return modulesBySize;
};

// Format byte size to human-readable format
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

// Create size report for bundles
const createSizeReport = (assets) => {
  const report = {
    totalSize: 0,
    totalSizeFormatted: '0 B',
    assets: [],
  };
  
  if (assets && Array.isArray(assets)) {
    assets.forEach(asset => {
      if (asset.size) {
        report.totalSize += asset.size;
        report.assets.push({
          name: asset.name,
          size: asset.size,
          sizeFormatted: formatSize(asset.size),
        });
      }
    });
    
    // Sort by size (largest first)
    report.assets.sort((a, b) => b.size - a.size);
    report.totalSizeFormatted = formatSize(report.totalSize);
  }
  
  return report;
};

// Identify duplicate modules
const findDuplicates = (stats) => {
  const moduleMap = {};
  const duplicates = [];
  
  if (stats && stats.modules) {
    stats.modules.forEach(module => {
      const moduleId = module.identifier || module.id;
      
      if (moduleId) {
        const moduleName = module.name.split('node_modules/').pop();
        
        if (moduleName && moduleName.includes('node_modules')) {
          const packageName = moduleName.split('/')[0];
          
          if (!moduleMap[packageName]) {
            moduleMap[packageName] = [];
          }
          
          moduleMap[packageName].push({
            id: moduleId,
            name: module.name,
            size: module.size,
          });
        }
      }
    });
    
    // Find packages with multiple instances
    Object.keys(moduleMap).forEach(packageName => {
      if (moduleMap[packageName].length > 1) {
        duplicates.push({
          package: packageName,
          instances: moduleMap[packageName].length,
          totalSize: moduleMap[packageName].reduce((sum, module) => sum + module.size, 0),
          modules: moduleMap[packageName],
        });
      }
    });
    
    // Sort by total size
    duplicates.sort((a, b) => b.totalSize - a.totalSize);
  }
  
  return duplicates;
};

// Suggest code splitting opportunities
const suggestCodeSplitting = (stats) => {
  const suggestions = [];
  
  if (stats && stats.chunks) {
    stats.chunks.forEach(chunk => {
      const chunkSize = chunk.size || 0;
      
      // Look for large chunks that could be split
      if (chunkSize > 500000) { // 500KB threshold
        suggestions.push({
          chunkId: chunk.id,
          chunkName: chunk.names?.join(', ') || `chunk-${chunk.id}`,
          size: chunkSize,
          sizeFormatted: formatSize(chunkSize),
          reason: 'Large chunk size, consider splitting',
        });
      }
      
      // Look for chunks with many modules
      if (chunk.modules && chunk.modules.length > 50) {
        suggestions.push({
          chunkId: chunk.id,
          chunkName: chunk.names?.join(', ') || `chunk-${chunk.id}`,
          moduleCount: chunk.modules.length,
          size: chunkSize,
          sizeFormatted: formatSize(chunkSize),
          reason: 'High module count, consider more granular splitting',
        });
      }
    });
  }
  
  return suggestions;
};

// Identify potential tree-shaking issues
const findTreeShakingIssues = (stats) => {
  const issues = [];
  
  if (stats && stats.modules) {
    stats.modules.forEach(module => {
      // Look for large modules that are likely not being tree-shaken
      if (
        module.size > 100000 && // 100KB
        module.name.includes('node_modules') &&
        !module.name.includes('esm/')
      ) {
        issues.push({
          moduleName: module.name,
          size: module.size,
          sizeFormatted: formatSize(module.size),
          suggestion: 'Check if this module supports tree-shaking or has a smaller alternative',
        });
      }
    });
  }
  
  return issues;
};

module.exports = {
  trackModuleSizes,
  formatSize,
  createSizeReport,
  findDuplicates,
  suggestCodeSplitting,
  findTreeShakingIssues,
};
