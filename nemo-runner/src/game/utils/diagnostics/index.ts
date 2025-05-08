import { DeviceBenchmark, BenchmarkResult, getDeviceBenchmark, runDeviceBenchmark } from './DeviceBenchmark';
import { PerformanceLogger, PerformanceReport, PerformanceEvent, getPerformanceLogger, startPerformanceLogging, stopPerformanceLogging } from './PerformanceLogger';

// Export all diagnostic types and functions
export {
  // Device benchmarking
  DeviceBenchmark,
  BenchmarkResult,
  getDeviceBenchmark,
  runDeviceBenchmark,
  
  // Performance logging
  PerformanceLogger,
  PerformanceReport,
  PerformanceEvent,
  getPerformanceLogger,
  startPerformanceLogging,
  stopPerformanceLogging
};

/**
 * Initialize performance diagnostics systems
 * This will automatically start performance logging
 */
export function initPerformanceDiagnostics(options?: {
  enableLogging?: boolean,
  sampleInterval?: number
}): void {
  // Start performance logging if requested
  if (options?.enableLogging !== false) {
    startPerformanceLogging(options?.sampleInterval);
    console.log('Performance diagnostics: Logging initialized');
  }
}

/**
 * Run a quick benchmark to determine appropriate quality settings
 * Returns a promise that resolves when the benchmark is complete
 */
export function quickBenchmark(
  progressCallback?: (progress: number, stage: string) => void
): Promise<BenchmarkResult> {
  return runDeviceBenchmark(progressCallback, 10000); // Shorter 10 second benchmark
}

/**
 * Run a full benchmark with detailed analysis
 * Returns a promise that resolves when the benchmark is complete
 */
export function fullBenchmark(
  progressCallback?: (progress: number, stage: string) => void
): Promise<BenchmarkResult> {
  return runDeviceBenchmark(progressCallback, 20000); // Full 20 second benchmark
}