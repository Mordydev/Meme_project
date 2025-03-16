/**
 * Chart Model
 * 
 * This module defines the data models for chart visualizations.
 */

/**
 * Chart data model
 */
export interface ChartData {
  title: string;
  labels: string[];
  datasets: ChartDataset[];
  options?: ChartOptions;
  annotations?: ChartAnnotation[];
}

/**
 * Chart dataset model
 */
export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
  tension?: number;
  borderDash?: number[];
  type?: string;
  yAxisID?: string;
  borderWidth?: number;
}

/**
 * Chart options model
 */
export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  indexAxis?: string;
  scales?: {
    x?: ChartAxisOptions;
    y?: ChartAxisOptions;
    [key: string]: ChartAxisOptions;
  };
  plugins?: {
    tooltip?: ChartTooltipOptions;
    legend?: ChartLegendOptions;
    title?: ChartTitleOptions;
  };
}

/**
 * Chart axis options
 */
export interface ChartAxisOptions {
  type?: string;
  display?: boolean;
  position?: string;
  title?: {
    display?: boolean;
    text?: string;
  };
  beginAtZero?: boolean;
  grid?: {
    display?: boolean;
    color?: string;
    borderDash?: number[];
    drawOnChartArea?: boolean;
  };
  max?: number;
}

/**
 * Chart tooltip options
 */
export interface ChartTooltipOptions {
  mode?: string;
  intersect?: boolean;
  callbacks?: {
    label?: (context: any) => string;
  };
}

/**
 * Chart legend options
 */
export interface ChartLegendOptions {
  display?: boolean;
  position?: string;
}

/**
 * Chart title options
 */
export interface ChartTitleOptions {
  display?: boolean;
  text?: string;
  padding?: {
    top?: number;
    bottom?: number;
  };
}

/**
 * Chart annotation model
 */
export interface ChartAnnotation {
  type: string;
  mode: string;
  scaleID: string;
  value: string | number;
  borderColor: string;
  borderDash?: number[];
  label?: {
    content: string;
    enabled: boolean;
    position?: string;
  };
}

/**
 * Chart configuration model
 */
export interface ChartConfig {
  type: string;
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options: ChartOptions;
}
