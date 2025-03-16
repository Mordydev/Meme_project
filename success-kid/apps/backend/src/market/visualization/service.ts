/**
 * Visualization Service
 * 
 * Service for generating formatted data for frontend visualizations.
 */
import { logger } from '../../lib/logger';
import { marketDataCache } from '../common/cache-service';
import { priceService } from '../price/service';
import { marketCapService } from '../marketcap/service';
import { transactionFeedService } from '../transactions/service';
import { milestoneService } from '../milestones/service';
import { TimePeriod, DataResolution } from '../../models/entities/market/price.model';
import { ChartData, ChartOptions, ChartDataset, ChartAnnotation } from '../../models/entities/market/chart.model';
import { MilestoneType, Milestone } from '../../models/entities/market/milestone.model';
import BigNumber from 'bignumber.js';

/**
 * Service for generating data visualization formats
 */
export class VisualizationService {
  // Cache TTLs for different data types (in seconds)
  private readonly CHART_CACHE_TTL = 300; // 5 minutes for chart data
  
  // Chart color palettes
  private readonly CHART_COLORS = {
    primary: '#1E88E5',   // Primary blue
    secondary: '#FFC107', // Secondary gold
    success: '#4CAF50',   // Success green
    danger: '#F44336',    // Danger red
    light: '#F5F7FA',     // Light gray
    dark: '#212121'       // Dark gray
  };
  
  /**
   * Get price chart data
   * 
   * @param symbol Token symbol
   * @param period Time period
   * @param resolution Optional data resolution
   * @returns Chart data for price
   */
  async getPriceChart(
    symbol = 'SKC',
    period = TimePeriod.DAY_1,
    resolution?: DataResolution
  ): Promise<ChartData> {
    const cacheKey = `chart:price:${symbol}:${period}:${resolution || 'auto'}`;
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // Get price data
          const priceData = await priceService.getHistoricalPrices(
            symbol,
            period,
            resolution
          );
          
          if (priceData.length === 0) {
            return this.getEmptyChart('Price Chart', 'No data available');
          }
          
          // Format for charting
          const labels = priceData.map(data => 
            this.formatTimestamp(data.timestamp, period)
          );
          
          const priceValues = priceData.map(data => data.price);
          
          // Add moving averages for certain periods
          const datasets: ChartDataset[] = [{
            label: 'Price',
            data: priceValues,
            borderColor: this.CHART_COLORS.primary,
            backgroundColor: `${this.CHART_COLORS.primary}20`, // 20% opacity
            fill: true,
            tension: 0.1
          }];
          
          if (['1w', '1m', 'all'].includes(period)) {
            // Calculate simple moving average (7 periods)
            const sma7 = this.calculateSMA(priceValues, 7);
            
            datasets.push({
              label: '7-period MA',
              data: sma7,
              borderColor: this.CHART_COLORS.success,
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              fill: false,
              tension: 0.1
            });
          }
          
          // Add milestone annotations
          let annotations: ChartAnnotation[] = [];
          if (period === TimePeriod.MONTH_1 || period === TimePeriod.ALL) {
            // Get achieved milestones
            const milestones = await milestoneService.getMilestones(symbol);
            const achievedMilestones = milestones.filter(
              m => m.achieved && m.achievedAt && m.type === MilestoneType.MARKET_CAP
            );
            
            // Create annotations
            annotations = this.createMilestoneAnnotations(
              achievedMilestones,
              priceData.map(p => p.timestamp)
            );
          }
          
          // Chart options
          const options: ChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { display: false }
              },
              y: {
                beginAtZero: false,
                grid: { 
                  color: `${this.CHART_COLORS.dark}10`, // 10% opacity
                  borderDash: [5, 5]
                }
              }
            },
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false
              },
              legend: {
                position: 'top'
              }
            }
          };
          
          return {
            title: `${symbol} Price Chart`,
            labels,
            datasets,
            annotations,
            options
          };
        },
        { ttl: this.CHART_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error generating price chart', { symbol, period, error });
      return this.getEmptyChart('Price Chart', 'Error generating chart');
    }
  }
  
  /**
   * Get market cap chart data
   * 
   * @param symbol Token symbol
   * @param period Time period
   * @param resolution Optional data resolution
   * @returns Chart data for market cap
   */
  async getMarketCapChart(
    symbol = 'SKC',
    period = TimePeriod.DAY_1,
    resolution?: DataResolution
  ): Promise<ChartData> {
    const cacheKey = `chart:marketcap:${symbol}:${period}:${resolution || 'auto'}`;
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // Get market cap data
          const marketCapData = await marketCapService.getHistoricalMarketCap(
            symbol,
            period,
            resolution
          );
          
          if (marketCapData.length === 0) {
            return this.getEmptyChart('Market Cap Chart', 'No data available');
          }
          
          // Format for charting
          const labels = marketCapData.map(data => 
            this.formatTimestamp(data.timestamp, period)
          );
          
          // Format market cap values for display
          const marketCapValues = marketCapData.map(data => {
            const mcap = new BigNumber(data.marketCap);
            // Convert to millions for display
            return mcap.dividedBy(1000000).toNumber();
          });
          
          const datasets: ChartDataset[] = [{
            label: 'Market Cap (million USD)',
            data: marketCapValues,
            borderColor: this.CHART_COLORS.secondary,
            backgroundColor: `${this.CHART_COLORS.secondary}20`, // 20% opacity
            fill: true,
            tension: 0.1
          }];
          
          // Add milestone annotations
          const milestones = await milestoneService.getMilestones(symbol);
          
          // Create vertical lines for milestones
          const annotations: ChartAnnotation[] = [];
          
          for (const milestone of milestones) {
            // Add current milestone as horizontal line
            if (!milestone.achieved && milestone.type === MilestoneType.MARKET_CAP) {
              const mcapValue = new BigNumber(milestone.targetValue).dividedBy(1000000).toNumber();
              
              annotations.push({
                type: 'line',
                mode: 'horizontal',
                scaleID: 'y',
                value: mcapValue,
                borderColor: this.CHART_COLORS.success,
                borderDash: [5, 5],
                label: {
                  content: milestone.name,
                  enabled: true,
                  position: 'right'
                }
              });
            }
            
            // Add achieved milestones as vertical lines
            if (milestone.achieved && milestone.achievedAt && milestone.type === MilestoneType.MARKET_CAP) {
              // Find closest data point to milestone date
              const achievedAt = new Date(milestone.achievedAt);
              let closestIndex = -1;
              let minDiff = Infinity;
              
              marketCapData.forEach((dataPoint, index) => {
                const diff = Math.abs(dataPoint.timestamp.getTime() - achievedAt.getTime());
                if (diff < minDiff) {
                  minDiff = diff;
                  closestIndex = index;
                }
              });
              
              if (closestIndex !== -1) {
                annotations.push({
                  type: 'line',
                  mode: 'vertical',
                  scaleID: 'x',
                  value: labels[closestIndex],
                  borderColor: this.CHART_COLORS.success,
                  label: {
                    content: milestone.name,
                    enabled: true,
                    position: 'top'
                  }
                });
              }
            }
          }
          
          // Chart options
          const options: ChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { display: false }
              },
              y: {
                beginAtZero: false,
                grid: { 
                  color: `${this.CHART_COLORS.dark}10`, // 10% opacity
                  borderDash: [5, 5]
                }
              }
            },
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  label: (context) => {
                    return `Market Cap: $${context.raw}M`;
                  }
                }
              },
              legend: {
                position: 'top'
              }
            }
          };
          
          return {
            title: `${symbol} Market Cap Chart`,
            labels,
            datasets,
            annotations,
            options
          };
        },
        { ttl: this.CHART_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error generating market cap chart', { symbol, period, error });
      return this.getEmptyChart('Market Cap Chart', 'Error generating chart');
    }
  }
  
  /**
   * Get volume chart data
   * 
   * @param symbol Token symbol
   * @param period Time period
   * @param resolution Optional data resolution
   * @returns Chart data for volume
   */
  async getVolumeChart(
    symbol = 'SKC',
    period = TimePeriod.DAY_1,
    resolution?: DataResolution
  ): Promise<ChartData> {
    const cacheKey = `chart:volume:${symbol}:${period}:${resolution || 'auto'}`;
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // Get price data with volume
          const priceData = await priceService.getHistoricalPrices(
            symbol,
            period,
            resolution
          );
          
          if (priceData.length === 0) {
            return this.getEmptyChart('Volume Chart', 'No data available');
          }
          
          // Format for charting
          const labels = priceData.map(data => 
            this.formatTimestamp(data.timestamp, period)
          );
          
          // Prepare volume data (might be undefined for some points)
          const volumeValues = priceData.map(data => data.volume || 0);
          
          const datasets: ChartDataset[] = [{
            label: 'Volume',
            data: volumeValues,
            borderColor: this.CHART_COLORS.primary,
            backgroundColor: `${this.CHART_COLORS.primary}40`, // 40% opacity
            fill: true,
            type: 'bar'
          }];
          
          // Chart options
          const options: ChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { display: false }
              },
              y: {
                beginAtZero: true,
                grid: { 
                  color: `${this.CHART_COLORS.dark}10`, // 10% opacity
                  borderDash: [5, 5]
                }
              }
            },
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false
              },
              legend: {
                position: 'top'
              }
            }
          };
          
          return {
            title: `${symbol} Volume Chart`,
            labels,
            datasets,
            options
          };
        },
        { ttl: this.CHART_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error generating volume chart', { symbol, period, error });
      return this.getEmptyChart('Volume Chart', 'Error generating chart');
    }
  }
  
  /**
   * Get milestone progress chart data
   * 
   * @param symbol Token symbol
   * @returns Chart data for milestone progress
   */
  async getMilestoneProgressChart(symbol = 'SKC'): Promise<ChartData> {
    const cacheKey = `chart:milestone:${symbol}`;
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // Get all milestones
          const milestones = await milestoneService.getMilestones(symbol);
          
          // Filter to market cap milestones
          const marketCapMilestones = milestones.filter(
            m => m.type === MilestoneType.MARKET_CAP
          );
          
          if (marketCapMilestones.length === 0) {
            return this.getEmptyChart('Milestone Progress', 'No milestones defined');
          }
          
          // Sort milestones by target value
          marketCapMilestones.sort((a, b) => {
            return new BigNumber(a.targetValue).comparedTo(b.targetValue);
          });
          
          // Get current market cap
          const marketCapData = await marketCapService.getMarketCap(symbol);
          const currentMarketCap = new BigNumber(marketCapData.marketCap);
          
          // Generate labels and data
          const labels = marketCapMilestones.map(m => m.name);
          
          // Calculate progress for each milestone
          const progressData = marketCapMilestones.map(milestone => {
            const target = new BigNumber(milestone.targetValue);
            
            if (milestone.achieved) {
              return 100; // 100% if achieved
            }
            
            if (currentMarketCap.isGreaterThanOrEqualTo(target)) {
              return 100; // 100% if current market cap >= target
            }
            
            // Calculate percentage
            return Math.min(
              100,
              currentMarketCap.dividedBy(target).multipliedBy(100).toNumber()
            );
          });
          
          // Build datasets
          const datasets: ChartDataset[] = [{
            label: 'Progress (%)',
            data: progressData,
            backgroundColor: progressData.map(value => 
              value >= 100 ? this.CHART_COLORS.success : this.CHART_COLORS.primary
            ),
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1
          }];
          
          // Chart options
          const options: ChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bar chart
            scales: {
              x: {
                beginAtZero: true,
                max: 100,
                grid: { 
                  color: `${this.CHART_COLORS.dark}10` // 10% opacity
                }
              },
              y: {
                grid: { display: false }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    return `Progress: ${context.raw.toFixed(1)}%`;
                  }
                }
              },
              legend: {
                display: false
              }
            }
          };
          
          return {
            title: 'Milestone Progress',
            labels,
            datasets,
            options
          };
        },
        { ttl: this.CHART_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error generating milestone progress chart', { symbol, error });
      return this.getEmptyChart('Milestone Progress', 'Error generating chart');
    }
  }
  
  /**
   * Get comparison chart for multiple tokens
   * 
   * @param symbols Array of token symbols
   * @param period Time period
   * @returns Chart data for token comparison
   */
  async getComparisonChart(
    symbols: string[],
    period = TimePeriod.DAY_1
  ): Promise<ChartData> {
    // Limit number of symbols
    if (symbols.length === 0) {
      return this.getEmptyChart('Comparison Chart', 'No symbols provided');
    }
    
    if (symbols.length > 5) {
      symbols = symbols.slice(0, 5); // Limit to 5 tokens
    }
    
    const cacheKey = `chart:comparison:${symbols.join(',')}:${period}`;
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // Color palette for multiple lines
          const colors = [
            this.CHART_COLORS.primary,
            this.CHART_COLORS.secondary,
            this.CHART_COLORS.success,
            this.CHART_COLORS.danger,
            '#9C27B0' // Purple
          ];
          
          // Get all tokens' price data
          const allPriceData: Record<string, any[]> = {};
          const allLabels: Record<string, string[]> = {};
          
          // Collect data for all symbols
          for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const priceData = await priceService.getHistoricalPrices(symbol, period);
            
            if (priceData.length === 0) continue;
            
            // Store price data and labels
            allPriceData[symbol] = priceData;
            allLabels[symbol] = priceData.map(data => 
              this.formatTimestamp(data.timestamp, period)
            );
          }
          
          // If no data found for any symbol
          if (Object.keys(allPriceData).length === 0) {
            return this.getEmptyChart('Comparison Chart', 'No data available');
          }
          
          // Normalize data to percentage change from first data point
          const datasets: ChartDataset[] = [];
          
          for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const priceData = allPriceData[symbol];
            
            if (!priceData || priceData.length === 0) continue;
            
            // Calculate percentage change from first price
            const firstPrice = priceData[0].price;
            const normalizedData = priceData.map(data => {
              return ((data.price - firstPrice) / firstPrice) * 100;
            });
            
            // Add dataset
            datasets.push({
              label: symbol,
              data: normalizedData,
              borderColor: colors[i % colors.length],
              backgroundColor: 'transparent',
              fill: false,
              tension: 0.1
            });
          }
          
          // Use the first symbol's labels as reference
          const referenceSymbol = symbols[0];
          const labels = allLabels[referenceSymbol] || [];
          
          // Chart options
          const options: ChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { display: false }
              },
              y: {
                grid: { 
                  color: `${this.CHART_COLORS.dark}10` // 10% opacity
                }
              }
            },
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  label: (context) => {
                    return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
                  }
                }
              },
              legend: {
                position: 'top'
              }
            }
          };
          
          return {
            title: 'Price Comparison (% Change)',
            labels,
            datasets,
            options
          };
        },
        { ttl: this.CHART_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error generating comparison chart', { symbols, period, error });
      return this.getEmptyChart('Comparison Chart', 'Error generating chart');
    }
  }
  
  /**
   * Get market metrics chart
   * 
   * @param symbol Token symbol
   * @param metrics Array of metrics to include
   * @returns Chart data for market metrics
   */
  async getMarketMetricsChart(
    symbol = 'SKC',
    metrics: string[] = ['price', 'volume', 'marketCap']
  ): Promise<ChartData> {
    // Validate metrics
    const validMetrics = metrics.filter(m => 
      ['price', 'volume', 'marketCap'].includes(m)
    );
    
    if (validMetrics.length === 0) {
      return this.getEmptyChart('Market Metrics', 'No valid metrics provided');
    }
    
    const cacheKey = `chart:metrics:${symbol}:${validMetrics.join(',')}`;
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // Get price data (base dataset)
          const priceData = await priceService.getHistoricalPrices(
            symbol,
            TimePeriod.WEEK_1
          );
          
          if (priceData.length === 0) {
            return this.getEmptyChart('Market Metrics', 'No data available');
          }
          
          // Format for charting
          const labels = priceData.map(data => 
            this.formatTimestamp(data.timestamp, TimePeriod.WEEK_1)
          );
          
          const datasets: ChartDataset[] = [];
          
          // Add selected metrics
          if (validMetrics.includes('price')) {
            datasets.push({
              label: 'Price (USD)',
              data: priceData.map(data => data.price),
              borderColor: this.CHART_COLORS.primary,
              backgroundColor: 'transparent',
              yAxisID: 'price',
              fill: false,
              tension: 0.1
            });
          }
          
          if (validMetrics.includes('volume')) {
            datasets.push({
              label: 'Volume',
              data: priceData.map(data => data.volume || 0),
              borderColor: this.CHART_COLORS.secondary,
              backgroundColor: `${this.CHART_COLORS.secondary}20`, // 20% opacity
              yAxisID: 'volume',
              type: 'bar',
              fill: true
            });
          }
          
          if (validMetrics.includes('marketCap')) {
            // Get market cap data
            const marketCapData = await marketCapService.getHistoricalMarketCap(
              symbol,
              TimePeriod.WEEK_1
            );
            
            if (marketCapData.length > 0) {
              // Reformat to match price data dates
              const marketCapValues: number[] = new Array(priceData.length).fill(null);
              
              // Match dates as closely as possible
              priceData.forEach((pricePoint, index) => {
                let closestIndex = -1;
                let minDiff = Infinity;
                
                marketCapData.forEach((mcapPoint, mcapIndex) => {
                  const diff = Math.abs(
                    pricePoint.timestamp.getTime() - mcapPoint.timestamp.getTime()
                  );
                  
                  if (diff < minDiff) {
                    minDiff = diff;
                    closestIndex = mcapIndex;
                  }
                });
                
                if (closestIndex !== -1) {
                  // Convert to millions for better display
                  marketCapValues[index] = new BigNumber(marketCapData[closestIndex].marketCap)
                    .dividedBy(1000000)
                    .toNumber();
                }
              });
              
              datasets.push({
                label: 'Market Cap (million USD)',
                data: marketCapValues,
                borderColor: this.CHART_COLORS.success,
                backgroundColor: 'transparent',
                yAxisID: 'marketCap',
                borderDash: [5, 5],
                fill: false,
                tension: 0.1
              });
            }
          }
          
          // Chart options with multiple y-axes
          const options: ChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { display: false }
              },
              price: {
                type: 'linear',
                display: validMetrics.includes('price'),
                position: 'left',
                title: {
                  display: true,
                  text: 'Price (USD)'
                },
                grid: { 
                  color: `${this.CHART_COLORS.primary}10` // 10% opacity
                }
              },
              volume: {
                type: 'linear',
                display: validMetrics.includes('volume'),
                position: 'right',
                title: {
                  display: true,
                  text: 'Volume'
                },
                grid: {
                  drawOnChartArea: false // Only draw grid lines for this axis
                }
              },
              marketCap: {
                type: 'linear',
                display: validMetrics.includes('marketCap'),
                position: 'right',
                title: {
                  display: true,
                  text: 'Market Cap (million USD)'
                },
                grid: {
                  drawOnChartArea: false // Only draw grid lines for this axis
                }
              }
            },
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false
              },
              legend: {
                position: 'top'
              }
            }
          };
          
          return {
            title: `${symbol} Market Metrics`,
            labels,
            datasets,
            options
          };
        },
        { ttl: this.CHART_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error generating market metrics chart', { 
        symbol, 
        metrics,
        error 
      });
      return this.getEmptyChart('Market Metrics', 'Error generating chart');
    }
  }
  
  /**
   * Get empty chart data for error states
   * 
   * @param title Chart title
   * @param message Error message
   * @returns Empty chart data
   */
  private getEmptyChart(title: string, message: string): ChartData {
    return {
      title,
      labels: [],
      datasets: [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: message,
            padding: {
              top: 10,
              bottom: 30
            }
          }
        }
      }
    };
  }
  
  /**
   * Format timestamp for display
   * 
   * @param timestamp Date to format
   * @param period Time period
   * @returns Formatted timestamp string
   */
  private formatTimestamp(timestamp: Date, period: TimePeriod): string {
    const date = new Date(timestamp);
    
    switch (period) {
      case TimePeriod.HOUR_1:
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case TimePeriod.DAY_1:
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case TimePeriod.WEEK_1:
        return date.toLocaleDateString([], { 
          weekday: 'short',
          month: 'numeric',
          day: 'numeric'
        });
      case TimePeriod.MONTH_1:
        return date.toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric' 
        });
      case TimePeriod.ALL:
        return date.toLocaleDateString([], { 
          year: 'numeric',
          month: 'short', 
          day: 'numeric' 
        });
      default:
        return date.toLocaleString();
    }
  }
  
  /**
   * Calculate Simple Moving Average
   * 
   * @param data Array of values
   * @param window Window size
   * @returns SMA values array (same length as input)
   */
  private calculateSMA(data: number[], window: number): number[] {
    const result: number[] = [];
    
    // Fill initial values with null (no SMA possible until window size reached)
    for (let i = 0; i < window - 1; i++) {
      result.push(null);
    }
    
    // Calculate SMA for rest of array
    for (let i = window - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < window; j++) {
        sum += data[i - j];
      }
      result.push(sum / window);
    }
    
    return result;
  }
  
  /**
   * Create milestone annotations for charts
   * 
   * @param milestones Achieved milestones
   * @param timestamps Array of timestamps in chart
   * @returns Chart annotations
   */
  private createMilestoneAnnotations(
    milestones: Milestone[],
    timestamps: Date[]
  ): ChartAnnotation[] {
    const annotations: ChartAnnotation[] = [];
    
    for (const milestone of milestones) {
      if (!milestone.achievedAt) continue;
      
      // Find closest data point to milestone date
      const achievedAt = new Date(milestone.achievedAt);
      let closestIndex = -1;
      let minDiff = Infinity;
      
      timestamps.forEach((timestamp, index) => {
        const diff = Math.abs(timestamp.getTime() - achievedAt.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = index;
        }
      });
      
      if (closestIndex !== -1) {
        annotations.push({
          type: 'line',
          mode: 'vertical',
          scaleID: 'x',
          value: closestIndex,
          borderColor: this.CHART_COLORS.success,
          label: {
            content: milestone.name,
            enabled: true,
            position: 'top'
          }
        });
      }
    }
    
    return annotations;
  }
}

// Export singleton instance
export const visualizationService = new VisualizationService();
