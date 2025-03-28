/**
 * Monitoring Dashboards
 * 
 * Templates for creating monitoring dashboards.
 */

/**
 * Dashboard panel type
 */
export type PanelType = 'graph' | 'gauge' | 'stat' | 'table' | 'text';

/**
 * Dashboard panel interface
 */
export interface DashboardPanel {
  title: string;
  type: PanelType;
  description?: string;
  metrics: string[];
  options?: any;
}

/**
 * Dashboard template interface
 */
export interface DashboardTemplate {
  title: string;
  description: string;
  panels: DashboardPanel[];
  variables?: Record<string, any>;
  annotations?: any[];
}

/**
 * API performance dashboard template
 */
export const apiPerformanceDashboard: DashboardTemplate = {
  title: 'API Performance Dashboard',
  description: 'Overview of API performance metrics',
  panels: [
    {
      title: 'Request Rate',
      type: 'graph',
      description: 'Requests per second',
      metrics: ['rate(http_requests_total[1m])'],
      options: {
        legend: true,
        alertThresholds: true
      }
    },
    {
      title: 'Response Time',
      type: 'graph',
      description: 'P95 response time in seconds',
      metrics: ['histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le))'],
      options: {
        legend: true,
        alertThresholds: true
      }
    },
    {
      title: 'Error Rate',
      type: 'graph',
      description: 'Percentage of requests resulting in errors',
      metrics: [
        'sum(rate(http_requests_total{status=~"5.."}[1m])) / sum(rate(http_requests_total[1m])) * 100'
      ],
      options: {
        legend: true,
        alertThresholds: true,
        thresholds: [
          { value: 1, color: 'yellow', line: true },
          { value: 5, color: 'red', line: true }
        ]
      }
    },
    {
      title: 'Response Codes',
      type: 'graph',
      description: 'HTTP response codes',
      metrics: ['sum(rate(http_requests_total[1m])) by (status)'],
      options: {
        stack: true,
        legend: true
      }
    }
  ],
  variables: {
    interval: {
      type: 'interval',
      options: ['1m', '5m', '10m', '30m', '1h', '3h', '6h', '12h', '1d']
    },
    endpoint: {
      type: 'query',
      query: 'label_values(http_requests_total, route)'
    }
  },
  annotations: [
    {
      name: 'Deployments',
      datasource: 'prometheus',
      expr: 'changes(app_version[1m]) > 0'
    }
  ]
};

/**
 * System resources dashboard template
 */
export const systemResourcesDashboard: DashboardTemplate = {
  title: 'System Resources Dashboard',
  description: 'Overview of system resource usage',
  panels: [
    {
      title: 'CPU Usage',
      type: 'graph',
      description: 'CPU usage percentage',
      metrics: ['process_cpu_user_seconds_total', 'process_cpu_system_seconds_total'],
      options: {
        legend: true,
        alertThresholds: true,
        thresholds: [
          { value: 70, color: 'yellow', line: true },
          { value: 90, color: 'red', line: true }
        ]
      }
    },
    {
      title: 'Memory Usage',
      type: 'graph',
      description: 'Memory usage in bytes',
      metrics: ['process_resident_memory_bytes', 'process_heap_bytes'],
      options: {
        legend: true,
        alertThresholds: true,
        thresholds: [
          { value: 1e9, color: 'yellow', line: true }, // 1GB
          { value: 2e9, color: 'red', line: true }     // 2GB
        ]
      }
    },
    {
      title: 'Heap Usage',
      type: 'gauge',
      description: 'Heap usage percentage',
      metrics: ['process_heap_bytes / process_heap_bytes_total * 100'],
      options: {
        thresholds: [
          { value: 0, color: 'green' },
          { value: 70, color: 'yellow' },
          { value: 90, color: 'red' }
        ]
      }
    },
    {
      title: 'Garbage Collection',
      type: 'graph',
      description: 'Garbage collection time',
      metrics: ['nodejs_gc_duration_seconds_sum'],
      options: {
        legend: true
      }
    }
  ],
  variables: {
    interval: {
      type: 'interval',
      options: ['1m', '5m', '10m', '30m', '1h', '3h', '6h', '12h', '1d']
    }
  }
};

/**
 * Business metrics dashboard template
 */
export const businessMetricsDashboard: DashboardTemplate = {
  title: 'Business Metrics Dashboard',
  description: 'Overview of business-specific metrics',
  panels: [
    {
      title: 'Points Awarded',
      type: 'graph',
      description: 'Points awarded over time',
      metrics: ['sum(rate(points_awarded_total[1m])) by (source)'],
      options: {
        stack: true,
        legend: true
      }
    },
    {
      title: 'Points Redeemed',
      type: 'graph',
      description: 'Points redeemed over time',
      metrics: ['sum(rate(points_redeemed_total[1m]))'],
      options: {
        legend: true
      }
    },
    {
      title: 'Content Creation',
      type: 'graph',
      description: 'Content items created over time',
      metrics: ['sum(rate(content_created_total[1m])) by (type)'],
      options: {
        stack: true,
        legend: true
      }
    },
    {
      title: 'User Registration',
      type: 'graph',
      description: 'User registrations over time',
      metrics: ['sum(rate(user_registrations_total[1m])) by (source)'],
      options: {
        legend: true
      }
    },
    {
      title: 'Wallet Connections',
      type: 'graph',
      description: 'Wallet connections over time',
      metrics: ['sum(rate(wallet_connections_total[1m]))'],
      options: {
        legend: true
      }
    }
  ],
  variables: {
    interval: {
      type: 'interval',
      options: ['1m', '5m', '10m', '30m', '1h', '3h', '6h', '12h', '1d', '7d', '30d']
    }
  }
};

/**
 * Generate Grafana JSON dashboard configuration
 * 
 * @param template Dashboard template
 * @returns Grafana dashboard JSON configuration
 */
export function generateGrafanaDashboard(template: DashboardTemplate): any {
  // In a real implementation, this would generate a valid Grafana dashboard JSON
  // using the template. This is a simplified example.
  
  return {
    dashboard: {
      id: null,
      title: template.title,
      description: template.description,
      tags: ['generated', 'success-kid'],
      timezone: 'browser',
      schemaVersion: 21,
      panels: template.panels.map((panel, index) => ({
        id: index + 1,
        type: panel.type,
        title: panel.title,
        description: panel.description || '',
        // Other panel configuration...
      })),
      // Other dashboard configuration...
    },
    folderId: 0,
    overwrite: true
  };
}

// Export default dashboard templates
export default {
  apiPerformanceDashboard,
  systemResourcesDashboard,
  businessMetricsDashboard,
  generateGrafanaDashboard
};
