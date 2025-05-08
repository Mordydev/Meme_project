import React, { useState, useEffect } from 'react';
import styles from '../../styles/GameUI.module.css';
import { getDeviceBenchmark, runDeviceBenchmark, getPerformanceLogger } from '../../game/utils/diagnostics';
import eventBus from '../../game/core/EventSystem';
import { getQualityAdjuster } from '../../game/utils/QualityAdjuster';
import { getPerformanceMonitor } from '../../game/utils/PerformanceMonitor';

interface PerformanceDebugUIProps {
  visible: boolean;
}

/**
 * Performance debugging UI component for testing and tuning game performance
 */
const PerformanceDebugUI: React.FC<PerformanceDebugUIProps> = ({ visible }) => {
  const [metrics, setMetrics] = useState<any>({
    fps: '0',
    frameTime: '0',
    longFrames: '0'
  });
  
  const [quality, setQuality] = useState<string>('medium');
  const [benchmarkProgress, setBenchmarkProgress] = useState<number>(0);
  const [benchmarkStage, setBenchmarkStage] = useState<string>('');
  const [benchmarkRunning, setBenchmarkRunning] = useState<boolean>(false);
  const [benchmarkResults, setBenchmarkResults] = useState<string>('');
  
  // Listen for performance updates
  useEffect(() => {
    const handlePerformanceUpdate = (data: { metrics: any }) => {
      setMetrics({
        fps: data.metrics.fps.toFixed(1),
        frameTime: data.metrics.averageFrameTime.toFixed(1),
        longFrames: data.metrics.longFrames
      });
    };
    
    const handleQualityChange = (data: { quality: string }) => {
      setQuality(data.quality);
    };
    
    // Set initial quality
    try {
      const initialQuality = getQualityAdjuster().getQuality();
      setQuality(initialQuality);
    } catch (error) {
      console.error('Error getting initial quality:', error);
    }
    
    // Subscribe to events
    eventBus.on('performance-update', handlePerformanceUpdate);
    eventBus.on('performance-quality-change', handleQualityChange);
    
    // Cleanup
    return () => {
      eventBus.off('performance-update', handlePerformanceUpdate);
      eventBus.off('performance-quality-change', handleQualityChange);
    };
  }, []);
  
  // Run benchmark
  const handleRunBenchmark = async () => {
    setBenchmarkRunning(true);
    setBenchmarkProgress(0);
    setBenchmarkStage('Starting...');
    setBenchmarkResults('');
    
    try {
      const result = await runDeviceBenchmark((progress, stage) => {
        setBenchmarkProgress(progress);
        setBenchmarkStage(stage);
      });
      
      // Format results
      const formattedResults = `
        Benchmark Results:
        - Baseline FPS: ${result.metrics.initialFps.toFixed(1)}
        - Stress Test FPS: ${result.metrics.stressTestFps.toFixed(1)}
        - Recovery FPS: ${result.metrics.recoveryFps.toFixed(1)}
        - Long Frames: ${result.metrics.longFramesCount}
        - Recommended Quality: ${result.metrics.finalRecommendedQuality}
        ${result.testInfo.bottlenecks.length > 0 ? `- Bottlenecks: ${result.testInfo.bottlenecks.join(', ')}` : ''}
      `;
      
      setBenchmarkResults(formattedResults);
    } catch (error) {
      console.error('Benchmark error:', error);
      setBenchmarkResults('Benchmark failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setBenchmarkRunning(false);
      setBenchmarkProgress(100);
      setBenchmarkStage('Complete');
    }
  };
  
  // Get performance log
  const handleGetPerformanceLog = () => {
    try {
      const logger = getPerformanceLogger();
      const report = logger.getReport();
      
      // Format report summary
      const formattedReport = `
        Performance Report:
        - Average FPS: ${report.averageFps.toFixed(1)}
        - Min FPS: ${report.minFps.toFixed(1)}
        - Quality Changes: ${report.qualityChanges}
        - Warnings: ${report.warningCount}
        - Severe Issues: ${report.severeIssueCount}
        ${report.recommendations.length > 0 ? `- Recommendations: ${report.recommendations.join(', ')}` : ''}
      `;
      
      setBenchmarkResults(formattedReport);
    } catch (error) {
      console.error('Error getting performance log:', error);
      setBenchmarkResults('Error getting performance log: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // Set quality level
  const handleSetQuality = (quality: string) => {
    try {
      getQualityAdjuster().setQuality(quality as any);
      setQuality(quality);
    } catch (error) {
      console.error('Error setting quality:', error);
    }
  };
  
  // Toggle auto quality adjustment
  const handleToggleAutoQuality = () => {
    try {
      const performanceMonitor = getPerformanceMonitor();
      const currentState = performanceMonitor.getAutoAdjustQuality();
      performanceMonitor.setAutoAdjustQuality(!currentState);
      
      // Add message to benchmark results area
      setBenchmarkResults(`Auto quality adjustment ${!currentState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling auto quality:', error);
      setBenchmarkResults('Error toggling auto quality: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  if (!visible) return null;
  
  return (
    <div className={styles.performanceDebugUI}>
      <h3>Performance Debug</h3>
      
      <div className={styles.metricsSection}>
        <div className={styles.metricRow}>
          <span>FPS:</span>
          <span className={Number(metrics.fps) < 30 ? styles.badMetric : styles.goodMetric}>
            {metrics.fps}
          </span>
        </div>
        
        <div className={styles.metricRow}>
          <span>Frame Time:</span>
          <span className={Number(metrics.frameTime) > 33 ? styles.badMetric : styles.goodMetric}>
            {metrics.frameTime} ms
          </span>
        </div>
        
        <div className={styles.metricRow}>
          <span>Long Frames:</span>
          <span className={Number(metrics.longFrames) > 0 ? styles.badMetric : styles.goodMetric}>
            {metrics.longFrames}
          </span>
        </div>
        
        <div className={styles.metricRow}>
          <span>Quality:</span>
          <span className={styles.qualityValue}>{quality}</span>
        </div>
      </div>
      
      <div className={styles.qualityControls}>
        <button
          className={quality === 'low' ? styles.activeQualityButton : styles.qualityButton}
          onClick={() => handleSetQuality('low')}
        >
          Low
        </button>
        <button
          className={quality === 'medium' ? styles.activeQualityButton : styles.qualityButton}
          onClick={() => handleSetQuality('medium')}
        >
          Medium
        </button>
        <button
          className={quality === 'high' ? styles.activeQualityButton : styles.qualityButton}
          onClick={() => handleSetQuality('high')}
        >
          High
        </button>
        <button
          className={quality === 'ultra' ? styles.activeQualityButton : styles.qualityButton}
          onClick={() => handleSetQuality('ultra')}
        >
          Ultra
        </button>
      </div>
      
      <div className={styles.benchmarkControls}>
        <button
          className={styles.benchmarkButton}
          onClick={handleRunBenchmark}
          disabled={benchmarkRunning}
        >
          {benchmarkRunning ? 'Running...' : 'Run Benchmark'}
        </button>
        
        <button
          className={styles.benchmarkButton}
          onClick={handleGetPerformanceLog}
        >
          Get Performance Log
        </button>
        
        <button
          className={styles.benchmarkButton}
          onClick={handleToggleAutoQuality}
        >
          Toggle Auto Quality
        </button>
      </div>
      
      {benchmarkRunning && (
        <div className={styles.benchmarkProgress}>
          <div className={styles.progressLabel}>
            {benchmarkStage} ({benchmarkProgress}%)
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${benchmarkProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {benchmarkResults && (
        <div className={styles.benchmarkResults}>
          <pre>{benchmarkResults}</pre>
        </div>
      )}
    </div>
  );
};

export default PerformanceDebugUI;