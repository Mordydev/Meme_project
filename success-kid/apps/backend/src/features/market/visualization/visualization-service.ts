/**
 * Visualization service for market data charts
 */
import { ChartData, ChartDataset, ChartOptions, ChartAnnotation, TimePeriod } from '../types';
import { IPriceService } from '../price/price-service';
import { IMarketCapService } from '../marketcap/marketcap-service';
import { IMilestoneService } from '../milestones/milestone-service';
import { ITransactionService } from '../transactions/transaction-service';
import { ICacheService } from '../caching/cache-service';
import { logger } from '../../../lib/logger';

/**
 * Visualization service interface
 */
export interface IVisualizationService {
  getPriceChart(symbol: string, period: TimePeriod): Promise<ChartData>;
  getMarketCapChart(symbol: string, period: TimePeriod): Promise<ChartData>;
  getVolumeChart(symbol: string, period: TimePeriod): Promise<ChartData>;
  getMilestoneProgress(): Promise<ChartData>;
  getComparisonChart(symbols: string[], period: TimePeriod): Promise<ChartData>;
  getMarketMetricsChart(symbol: string, metrics: string[]): Promise<ChartData>;
}

/**
 * Visualization service implementation
 */
export class VisualizationService implements IVisualizationService {
  /**
   * Create a new visualization service
   * @param priceService Price service
   * @param marketCapService Market cap service
   * @param milestoneService Milestone service
   * @param transactionService Transaction service
   * @param cacheService Cache service
   */
  constructor(
    private priceService: IPriceService,
    private marketCapService: IMarketCapService,
    private milestoneService: IMilestoneService,
    private transactionService: ITransactionService,
    private cacheService: ICacheService
  ) {}
  
  /**
   * Get price chart data
   * @param symbol Token symbol
   * @param period Time period
   * @returns Chart data
   */
  async getPriceChart(symbol: string, period: TimePeriod): Promise<ChartData> {
    const cacheKey = `chart:price:${symbol}:${period}`;
    
    return this.cacheService.getWithFetch<ChartData>(
      cacheKey,
      async () => {
        // Get price data
        const priceData = await this.priceService.getPriceHistory(symbol, period);
        
        // Format for charting
        const labels = priceData.map(data => 
          this.formatTimestamp(data.timestamp, period)
        );
        
        const priceValues = priceData.map(data => data.price);
        
        // Add moving averages for certain periods
        let datasets: ChartDataset[] = [{
          label: 'Price',
          data: priceValues,
          borderColor: '#1E88E5',
          backgroundColor: 'rgba(30, 136, 229, 0.1)',
          fill: true
        }];
        
        if (['1w', '1m', 'all'].includes(period)) {
          const sma7 = this.calculateSMA(priceValues, 7);
          
          datasets.push({
            label: '7-day MA',
            data: sma7,
            borderColor: '#4CAF50',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            fill: false
          });
        }
        
        // Add milestone annotations
        let annotations: ChartAnnotation[] = [];
        if (period === '1m' || period === 'all') {
          const milestones = await this.milestoneService.getMilestones();
          annotations = await this.createMilestoneAnnotations(milestones, priceData);
        }
        
        return {
          title: `${symbol} Price Chart`,
          labels,
          datasets,
          annotations,
          options: this.getChartOptions('price', period)
        };
      },
      {
        ttl: this.getCacheTTLForPeriod(period),
        staleWhileRevalidate: true,
        staleTtl: this.getCacheTTLForPeriod(period) * 2
      }
    );
  }
  
  /**
   * Get market cap chart data
   * @param symbol Token symbol
   * @param period Time period
   * @returns Chart data
   */
  async getMarketCapChart(symbol: string, period: TimePeriod): Promise<ChartData> {
    const cacheKey = `chart:marketcap:${symbol}:${period}`;
    
    return this.cacheService.getWithFetch<ChartData>(
      cacheKey,
      async () => {
        // Get market cap data
        const marketCapData = await this.marketCapService.getHistoricalMarketCap(symbol, period);
        
        // Format for charting
        const labels = marketCapData.map(data => 
          this.formatTimestamp(data.timestamp, period)
        );
        
        const marketCapValues = marketCapData.map(data => 
          parseFloat(data.marketCap) / 1000000
        ); // Convert to millions for display
        
        const datasets: ChartDataset[] = [{
          label: 'Market Cap (Millions USD)',
          data: marketCapValues,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true
        }];
        
        // Add milestone annotations
        let annotations: ChartAnnotation[] = [];
        if (period === '1m' || period === 'all') {
          const milestones = await this.milestoneService.getMilestones();
          annotations = await this.createMilestoneAnnotations(milestones, marketCapData);
        }
        
        return {
          title: `${symbol} Market Cap Chart`,
          labels,
          datasets,
          annotations,
          options: this.getChartOptions('marketcap', period)
        };
      },
      {
        ttl: this.getCacheTTLForPeriod(period),
        staleWhileRevalidate: true,
        staleTtl: this.getCacheTTLForPeriod(period) * 2
      }
    );
  }
  
  /**
   * Get volume chart data
   * @param symbol Token symbol
   * @param period Time period
   * @returns Chart data
   */
  async getVolumeChart(symbol: string, period: TimePeriod): Promise<ChartData> {
    const cacheKey = `chart:volume:${symbol}:${period}`;
    
    return this.cacheService.getWithFetch<ChartData>(
      cacheKey,
      async () => {
        // Get price data which includes volume
        const priceData = await this.priceService.getPriceHistory(symbol, period);
        
        // Format for charting
        const labels = priceData.map(data => 
          this.formatTimestamp(data.timestamp, period)
        );
        
        // Extract volume data
        const volumeValues = priceData.map(data => data.volume || 0);
        
        // Create datasets
        const datasets: ChartDataset[] = [{
          label: 'Volume',
          data: volumeValues,
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.3)',
          fill: true
        }];
        
        return {
          title: `${symbol} Volume Chart`,
          labels,
          datasets,
          options: this.getChartOptions('volume', period)
        };
      },
      {
        ttl: this.getCacheTTLForPeriod(period),
        staleWhileRevalidate: true,
        staleTtl: this.getCacheTTLForPeriod(period) * 2
      }
    );
  }
  
  /**
   * Get milestone progress chart
   * @returns Chart data
   */
  async getMilestoneProgress(): Promise<ChartData> {
    const cacheKey = 'chart:milestones:progress';
    
    return this.cacheService.getWithFetch<ChartData>(
      cacheKey,
      async () => {
        // Get all milestones
        const milestones = await this.milestoneService.getMilestones();
        
        // Get current market cap
        const marketCap = await this.marketCapService.getMarketCap('SKC');
        
        // Filter to market cap milestones
        const marketCapMilestones = milestones.filter(m => m.type === 'marketCap');
        
        // Create labels and datasets
        const labels = marketCapMilestones.map(m => `$${parseInt(m.targetValue).toLocaleString()}`);
        
        // Calculate progress for each milestone
        const progressValues: number[] = [];
        for (const milestone of marketCapMilestones) {
          const progress = await this.milestoneService.getMilestoneProgress(milestone.id);
          progressValues.push(progress.percentComplete);
        }
        
        // Create datasets
        const datasets: ChartDataset[] = [{
          label: 'Progress',
          data: progressValues,
          borderColor: '#FFC107',
          backgroundColor: 'rgba(255, 193, 7, 0.5)',
          fill: true
        }];
        
        return {
          title: 'Market Cap Milestone Progress',
          labels,
          datasets,
          options: {
            scales: {
              y: {
                min: 0,
                max: 100,
                title: {
                  display: true,
                  text: 'Progress (%)'
                }
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: (context: any) => {
                    return `Progress: ${context.raw.toFixed(1)}%`;
                  }
                }
              }
            }
          }
        };
      },
      {
        ttl: 300, // Cache for 5 minutes
        staleWhileRevalidate: true,
        staleTtl: 900 // Stale data valid for 15 minutes
      }
    );
  }
  
  /**
   * Get comparison chart for multiple tokens
   * @param symbols Token symbols
   * @param period Time period
   * @returns Chart data
   */
  async getComparisonChart(symbols: string[], period: TimePeriod): Promise<ChartData> {
    const cacheKey = `chart:comparison:${symbols.join('-')}:${period}`;
    
    return this.cacheService.getWithFetch<ChartData>(
      cacheKey,
      async () => {
        // Color palette for different tokens
        const colors = [
          { border: '#1E88E5', background: 'rgba(30, 136, 229, 0.1)' },
          { border: '#4CAF50', background: 'rgba(76, 175, 80, 0.1)' },
          { border: '#FF9800', background: 'rgba(255, 152, 0, 0.1)' },
          { border: '#E91E63', background: 'rgba(233, 30, 99, 0.1)' },
          { border: '#9C27B0', background: 'rgba(156, 39, 176, 0.1)' }
        ];
        
        // Get price data for each symbol and normalize to percentage change
        const priceDatasets: ChartDataset[] = [];
        let labels: string[] = [];
        
        for (let i = 0; i < symbols.length; i++) {
          const symbol = symbols[i];
          const color = colors[i % colors.length];
          
          try {
            // Get price data
            const priceData = await this.priceService.getPriceHistory(symbol, period);
            
            if (priceData.length === 0) continue;
            
            // Use first symbol's timestamps for labels
            if (labels.length === 0) {
              labels = priceData.map(data => 
                this.formatTimestamp(data.timestamp, period)
              );
            }
            
            // Calculate percentage change from first price
            const basePrice = priceData[0].price;
            const percentageChanges = priceData.map(data => 
              ((data.price / basePrice) - 1) * 100
            );
            
            // Add to datasets
            priceDatasets.push({
              label: symbol,
              data: percentageChanges,
              borderColor: color.border,
              backgroundColor: color.background,
              fill: false
            });
          } catch (error) {
            logger.error(`Failed to get price data for ${symbol}`, { error: error.message });
          }
        }
        
        return {
          title: 'Token Price Comparison (% Change)',
          labels,
          datasets: priceDatasets,
          options: {
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'Change (%)'
                }
              }
            }
          }
        };
      },
      {
        ttl: this.getCacheTTLForPeriod(period),
        staleWhileRevalidate: true,
        staleTtl: this.getCacheTTLForPeriod(period) * 2
      }
    );
  }
  
  /**
   * Get chart with multiple market metrics
   * @param symbol Token symbol
   * @param metrics Market metrics to include
   * @returns Chart data
   */
  async getMarketMetricsChart(symbol: string, metrics: string[]): Promise<ChartData> {
    const cacheKey = `chart:metrics:${symbol}:${metrics.join('-')}`;
    
    return this.cacheService.getWithFetch<ChartData>(
      cacheKey,
      async () => {
        // We'll use 1 week period for metrics chart
        const period: TimePeriod = '1w';
        
        // Get price data
        const priceData = await this.priceService.getPriceHistory(symbol, period);
        
        // Format timestamps for labels
        const labels = priceData.map(data => 
          this.formatTimestamp(data.timestamp, period)
        );
        
        // Create datasets based on requested metrics
        const datasets: ChartDataset[] = [];
        
        for (const metric of metrics) {
          switch (metric) {
            case 'price': {
              const priceValues = priceData.map(data => data.price);
              datasets.push({
                label: 'Price (USD)',
                data: priceValues,
                borderColor: '#1E88E5',
                backgroundColor: 'transparent',
                fill: false
              });
              break;
            }
            case 'volume': {
              const volumeValues = priceData.map(data => data.volume || 0);
              datasets.push({
                label: 'Volume',
                data: volumeValues,
                borderColor: '#FF9800',
                backgroundColor: 'transparent',
                fill: false
              });
              break;
            }
            case 'volatility': {
              const volatility = this.calculateVolatility(priceData.map(data => data.price), 7);
              datasets.push({
                label: 'Volatility (%)',
                data: volatility,
                borderColor: '#F44336',
                backgroundColor: 'transparent',
                fill: false
              });
              break;
            }
            case 'rsi': {
              const rsi = this.calculateRSI(priceData.map(data => data.price), 14);
              datasets.push({
                label: 'RSI',
                data: rsi,
                borderColor: '#9C27B0',
                backgroundColor: 'transparent',
                fill: false
              });
              break;
            }
            default:
              logger.warn(`Unsupported metric: ${metric}`);
          }
        }
        
        return {
          title: `${symbol} Market Metrics`,
          labels,
          datasets,
          options: {
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
              }
            }
          }
        };
      },
      {
        ttl: 300, // Cache for 5 minutes
        staleWhileRevalidate: true,
        staleTtl: 900 // Stale data valid for 15 minutes
      }
    );
  }
  
  /**
   * Format timestamp for chart labels
   * @param timestamp Date to format
   * @param period Time period
   * @returns Formatted timestamp
   */
  private formatTimestamp(timestamp: Date, period: TimePeriod): string {
    // Format based on period
    switch (period) {
      case '1h':
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1d':
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1w':
        return timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '1m':
        return timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case 'all':
        return timestamp.toLocaleDateString([], { year: 'numeric', month: 'short' });
      default:
        return timestamp.toLocaleString();
    }
  }
  
  /**
   * Calculate Simple Moving Average (SMA)
   * @param values Array of values
   * @param period SMA period
   * @returns Array of SMA values
   */
  private calculateSMA(values: number[], period: number): number[] {
    const sma: number[] = [];
    
    // Fill with nulls for the first (period-1) points
    for (let i = 0; i < period - 1; i++) {
      sma.push(NaN);
    }
    
    // Calculate SMA for the rest of the points
    for (let i = period - 1; i < values.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += values[i - j];
      }
      sma.push(sum / period);
    }
    
    return sma;
  }
  
  /**
   * Calculate Relative Strength Index (RSI)
   * @param values Array of values
   * @param period RSI period
   * @returns Array of RSI values
   */
  private calculateRSI(values: number[], period: number): number[] {
    if (values.length < period + 1) {
      return Array(values.length).fill(NaN);
    }
    
    const rsi: number[] = [];
    
    // Fill with nulls for the first period points
    for (let i = 0; i < period; i++) {
      rsi.push(NaN);
    }
    
    // Calculate initial gains and losses
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = values[i] - values[i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }
    
    // Average gains and losses
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate RSI for the rest of the points
    for (let i = period + 1; i < values.length; i++) {
      const change = values[i] - values[i - 1];
      
      // Wilder's smoothing
      avgGain = ((avgGain * (period - 1)) + (change > 0 ? change : 0)) / period;
      avgLoss = ((avgLoss * (period - 1)) + (change < 0 ? -change : 0)) / period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
    
    return rsi;
  }
  
  /**
   * Calculate volatility
   * @param values Array of values
   * @param period Volatility period
   * @returns Array of volatility values
   */
  private calculateVolatility(values: number[], period: number): number[] {
    const volatility: number[] = [];
    
    // Fill with nulls for the first (period-1) points
    for (let i = 0; i < period - 1; i++) {
      volatility.push(NaN);
    }
    
    // Calculate volatility for the rest of the points
    for (let i = period - 1; i < values.length; i++) {
      const windowValues = values.slice(i - period + 1, i + 1);
      const mean = windowValues.reduce((sum, val) => sum + val, 0) / period;
      
      // Calculate standard deviation as percentage of mean
      const variance = windowValues.reduce((sum, val) => {
        const diff = val - mean;
        return sum + (diff * diff);
      }, 0) / period;
      
      const stdDev = Math.sqrt(variance);
      const volatilityPct = (stdDev / mean) * 100;
      
      volatility.push(volatilityPct);
    }
    
    return volatility;
  }
  
  /**
   * Create milestone annotations for charts
   * @param milestones List of milestone objects
   * @param dataPoints Data points for chart
   * @returns Chart annotations
   */
  private async createMilestoneAnnotations(
    milestones: any[],
    dataPoints: any[]
  ): Promise<ChartAnnotation[]> {
    const annotations: ChartAnnotation[] = [];
    
    // Find achieved milestones
    const achievedMilestones = milestones.filter(m => m.achieved && m.achievedAt);
    
    for (const milestone of achievedMilestones) {
      // Find closest data point to milestone achievement date
      const achievedAt = new Date(milestone.achievedAt);
      let closestIndex = 0;
      let minDiff = Infinity;
      
      for (let i = 0; i < dataPoints.length; i++) {
        const diff = Math.abs(dataPoints[i].timestamp.getTime() - achievedAt.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }
      
      // Skip if no close match
      if (minDiff > 7 * 24 * 60 * 60 * 1000) { // More than 7 days difference
        continue;
      }
      
      // Create annotation
      annotations.push({
        type: 'line',
        mode: 'vertical',
        scaleID: 'x',
        value: closestIndex,
        borderColor: '#4CAF50',
        label: {
          content: milestone.name,
          enabled: true
        }
      });
    }
    
    return annotations;
  }
  
  /**
   * Get chart options for specific chart type
   * @param chartType Chart type
   * @param period Time period
   * @returns Chart options
   */
  private getChartOptions(chartType: string, period?: TimePeriod): ChartOptions {
    const baseOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: true,
      scales: {
        x: {
          grid: {
            display: true,
            drawBorder: true,
            drawOnChartArea: true,
            drawTicks: true,
          }
        },
        y: {
          grid: {
            display: true,
            drawBorder: true,
            drawOnChartArea: true,
            drawTicks: true,
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      }
    };
    
    // Customize based on chart type
    switch (chartType) {
      case 'price':
        baseOptions.scales!.y = {
          ...baseOptions.scales!.y,
          title: {
            display: true,
            text: 'Price (USD)'
          }
        };
        break;
      case 'marketcap':
        baseOptions.scales!.y = {
          ...baseOptions.scales!.y,
          title: {
            display: true,
            text: 'Market Cap (Millions USD)'
          }
        };
        break;
      case 'volume':
        baseOptions.scales!.y = {
          ...baseOptions.scales!.y,
          title: {
            display: true,
            text: 'Volume (USD)'
          }
        };
        break;
    }
    
    return baseOptions;
  }
  
  /**
   * Get appropriate cache TTL for a time period
   * @param period Time period
   * @returns Cache TTL in seconds
   */
  private getCacheTTLForPeriod(period: TimePeriod): number {
    switch (period) {
      case '1h': return 60; // 1 minute
      case '1d': return 300; // 5 minutes
      case '1w': return 900; // 15 minutes
      case '1m': return 3600; // 1 hour
      case 'all': return 3600; // 1 hour
      default: return 300; // 5 minutes
    }
  }
}
