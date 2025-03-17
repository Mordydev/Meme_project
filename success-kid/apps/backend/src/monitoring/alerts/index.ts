/**
 * Alerting System
 * 
 * System for defining, triggering, and sending alerts based on monitoring data.
 */
import { FastifyInstance } from 'fastify';
import { MetricsService } from '../metrics';
import { logger } from '@/lib/logger';

/**
 * Alert rule interface
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne' | 'regex';
  threshold: number | string;
  duration: number; // seconds to violate before alerting
  severity: 'critical' | 'warning' | 'info';
  labels: Record<string, string>;
  annotations: Record<string, string>;
  channels: string[];
}

/**
 * Alert instance interface
 */
export interface Alert {
  id: string;
  ruleId: string;
  name: string;
  description: string;
  status: 'active' | 'resolved';
  severity: 'critical' | 'warning' | 'info';
  metric: string;
  value: number | string;
  threshold: number | string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startTime: Date;
  endTime?: Date;
  notified: boolean;
}

/**
 * Alert service for managing and triggering alerts
 */
export class AlertService {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private violationTimers: Map<string, { startTime: Date; value: number | string }> = new Map();
  private notificationChannels: Map<string, (alert: Alert) => Promise<void>> = new Map();
  private metricsService: MetricsService;
  private checkInterval: NodeJS.Timeout | null = null;
  
  /**
   * Create a new alert service
   * 
   * @param metricsService Metrics service to use for alert checks
   */
  constructor(metricsService: MetricsService) {
    this.metricsService = metricsService;
    
    // Register default notification channels
    this.registerChannel('log', async (alert) => {
      if (alert.status === 'active') {
        logger.warn(`Alert fired: ${alert.name}`, {
          alert: {
            id: alert.id,
            name: alert.name,
            severity: alert.severity,
            metric: alert.metric,
            value: alert.value,
            threshold: alert.threshold
          }
        });
      } else {
        logger.info(`Alert resolved: ${alert.name}`, {
          alert: {
            id: alert.id,
            name: alert.name,
            severity: alert.severity,
            metric: alert.metric
          }
        });
      }
    });
  }
  
  /**
   * Start the alert service
   * 
   * @param checkIntervalMs Interval between alert checks in milliseconds
   */
  start(checkIntervalMs: number = 15000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(() => this.checkAlerts(), checkIntervalMs);
    logger.info(`Alert service started with check interval of ${checkIntervalMs}ms`);
  }
  
  /**
   * Stop the alert service
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Alert service stopped');
    }
  }
  
  /**
   * Register an alert rule
   * 
   * @param rule Alert rule to register
   */
  registerAlertRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info(`Alert rule registered: ${rule.name}`, { ruleId: rule.id });
  }
  
  /**
   * Register multiple alert rules
   * 
   * @param rules Alert rules to register
   */
  registerAlertRules(rules: AlertRule[]): void {
    for (const rule of rules) {
      this.registerAlertRule(rule);
    }
  }
  
  /**
   * Register a notification channel
   * 
   * @param name Channel name
   * @param handler Channel handler function
   */
  registerChannel(name: string, handler: (alert: Alert) => Promise<void>): void {
    this.notificationChannels.set(name, handler);
  }
  
  /**
   * Check all alert rules against current metric values
   */
  private async checkAlerts(): Promise<void> {
    for (const rule of this.rules.values()) {
      try {
        await this.evaluateRule(rule);
      } catch (error) {
        logger.error(`Error evaluating alert rule ${rule.id}`, { error });
      }
    }
  }
  
  /**
   * Evaluate a single alert rule
   * 
   * @param rule Alert rule to evaluate
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    // Get current metric value
    const value = await this.metricsService.getMetricValue(rule.metric, rule.labels);
    
    if (value === undefined) {
      logger.debug(`No value for metric ${rule.metric} with labels`, { labels: rule.labels });
      return;
    }
    
    // Check if rule condition is violated
    const isViolated = this.checkCondition(rule.condition, value, rule.threshold);
    
    // Get existing violation timer if any
    const existingViolation = this.violationTimers.get(rule.id);
    
    // Handle violation state changes
    if (isViolated) {
      if (!existingViolation) {
        // New violation - start timer
        this.violationTimers.set(rule.id, {
          startTime: new Date(),
          value
        });
        logger.debug(`Alert rule ${rule.id} violation started`, { value, threshold: rule.threshold });
      } else {
        // Existing violation - check duration
        const elapsedMs = Date.now() - existingViolation.startTime.getTime();
        
        // If violation has persisted long enough, trigger alert
        if (elapsedMs >= rule.duration * 1000) {
          // Check if alert already exists
          const existingAlert = Array.from(this.alerts.values()).find(
            alert => alert.ruleId === rule.id && alert.status === 'active'
          );
          
          if (!existingAlert) {
            // Create new alert
            await this.createAlert(rule, value);
          } else if (existingAlert.value !== value) {
            // Update existing alert with new value
            existingAlert.value = value;
            logger.debug(`Alert ${existingAlert.id} updated with new value`, { value });
          }
        }
      }
    } else {
      // No violation - resolve any active alerts and remove violation timer
      if (existingViolation) {
        this.violationTimers.delete(rule.id);
        
        // Resolve any active alerts for this rule
        for (const alert of this.alerts.values()) {
          if (alert.ruleId === rule.id && alert.status === 'active') {
            alert.status = 'resolved';
            alert.endTime = new Date();
            
            // Notify about resolution
            await this.notifyAlertChannels(alert);
            
            logger.debug(`Alert ${alert.id} resolved`, { rule: rule.id });
          }
        }
      }
    }
  }
  
  /**
   * Check if a condition is violated
   * 
   * @param condition Condition type
   * @param value Current value
   * @param threshold Threshold value
   * @returns Whether the condition is violated
   */
  private checkCondition(
    condition: 'gt' | 'lt' | 'eq' | 'ne' | 'regex',
    value: number | string,
    threshold: number | string
  ): boolean {
    switch (condition) {
      case 'gt':
        return Number(value) > Number(threshold);
        
      case 'lt':
        return Number(value) < Number(threshold);
        
      case 'eq':
        return value == threshold; // Allow type coercion
        
      case 'ne':
        return value != threshold; // Allow type coercion
        
      case 'regex':
        if (typeof threshold !== 'string' || typeof value !== 'string') {
          return false;
        }
        try {
          const regex = new RegExp(threshold);
          return regex.test(value);
        } catch (error) {
          logger.error('Invalid regex in alert condition', { threshold, error });
          return false;
        }
        
      default:
        logger.warn(`Unknown alert condition: ${condition}`);
        return false;
    }
  }
  
  /**
   * Create a new alert from a rule violation
   * 
   * @param rule Alert rule that was violated
   * @param value Current metric value
   */
  private async createAlert(rule: AlertRule, value: number | string): Promise<Alert> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ruleId: rule.id,
      name: rule.name,
      description: rule.description,
      status: 'active',
      severity: rule.severity,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      labels: { ...rule.labels },
      annotations: { ...rule.annotations },
      startTime: new Date(),
      notified: false
    };
    
    // Store the alert
    this.alerts.set(alert.id, alert);
    
    // Notify alert channels
    await this.notifyAlertChannels(alert);
    
    // Mark as notified
    alert.notified = true;
    
    logger.info(`Alert triggered: ${alert.name}`, {
      alertId: alert.id,
      ruleId: rule.id,
      severity: rule.severity,
      metric: rule.metric,
      value,
      threshold: rule.threshold
    });
    
    return alert;
  }
  
  /**
   * Notify all relevant channels about an alert
   * 
   * @param alert Alert to notify about
   */
  private async notifyAlertChannels(alert: Alert): Promise<void> {
    // Get the rule for this alert
    const rule = this.rules.get(alert.ruleId);
    
    if (!rule) {
      logger.warn(`Cannot find rule for alert ${alert.id}`);
      return;
    }
    
    // Notify all channels specified in the rule
    for (const channelName of rule.channels) {
      const channel = this.notificationChannels.get(channelName);
      
      if (channel) {
        try {
          await channel(alert);
        } catch (error) {
          logger.error(`Error notifying channel ${channelName}`, { error, alertId: alert.id });
        }
      } else {
        logger.warn(`Alert channel not found: ${channelName}`);
      }
    }
  }
  
  /**
   * Get all active alerts
   * 
   * @returns Array of active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
  }
  
  /**
   * Get alert history
   * 
   * @param limit Maximum number of alerts to return
   * @param offset Offset for pagination
   * @returns Array of historical alerts
   */
  getAlertHistory(limit: number = 100, offset: number = 0): Alert[] {
    const allAlerts = Array.from(this.alerts.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return allAlerts.slice(offset, offset + limit);
  }
}

/**
 * Set up alerting for a Fastify instance
 * 
 * @param app Fastify instance
 * @param metricsService Metrics service to use
 * @param options Configuration options
 * @returns Alert service instance
 */
export function setupAlerts(
  app: FastifyInstance,
  metricsService: MetricsService,
  options: {
    initialRules?: AlertRule[];
    checkIntervalMs?: number;
    endpoint?: string;
  } = {}
): AlertService {
  // Create alert service
  const alertService = new AlertService(metricsService);
  
  // Register initial rules if provided
  if (options.initialRules && options.initialRules.length > 0) {
    alertService.registerAlertRules(options.initialRules);
  }
  
  // Add alerts endpoint
  app.get(options.endpoint || '/alerts', {
    schema: {
      hide: true
    },
    handler: async (request, reply) => {
      const activeAlerts = alertService.getActiveAlerts();
      return reply.send({
        data: {
          active: activeAlerts,
          count: activeAlerts.length
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  });
  
  // Add alert history endpoint
  app.get('/alerts/history', {
    schema: {
      hide: true,
      querystring: {
        limit: { type: 'number', default: 100 },
        offset: { type: 'number', default: 0 }
      }
    },
    handler: async (request: any, reply) => {
      const { limit, offset } = request.query;
      const history = alertService.getAlertHistory(limit, offset);
      
      return reply.send({
        data: {
          alerts: history,
          count: history.length,
          total: alertService.getAlertHistory().length
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  });
  
  // Add alert service to app instance
  app.decorate('alerts', alertService);
  
  // Start alert service
  alertService.start(options.checkIntervalMs);
  
  // Add hook to stop alert service when app closes
  app.addHook('onClose', (instance, done) => {
    alertService.stop();
    done();
  });
  
  return alertService;
}

// Default predefined alert rules
export const defaultAlertRules: AlertRule[] = [
  {
    id: 'high-error-rate',
    name: 'High Error Rate',
    description: 'Error rate is above acceptable threshold',
    metric: 'http_requests_total',
    condition: 'gt',
    threshold: 5,
    duration: 60,
    severity: 'warning',
    labels: {
      status: '5xx'
    },
    annotations: {
      summary: 'High error rate detected',
      description: 'The rate of 5xx errors is above the acceptable threshold',
      runbook_url: 'https://docs.internal/runbooks/high-error-rate'
    },
    channels: ['log', 'email']
  },
  {
    id: 'api-latency',
    name: 'API High Latency',
    description: 'API response time is above acceptable threshold',
    metric: 'http_request_duration_seconds',
    condition: 'gt',
    threshold: 1,
    duration: 120,
    severity: 'warning',
    labels: {},
    annotations: {
      summary: 'API response time is high',
      description: 'The API response time is above the acceptable threshold',
      runbook_url: 'https://docs.internal/runbooks/api-latency'
    },
    channels: ['log', 'slack']
  },
  {
    id: 'high-memory-usage',
    name: 'High Memory Usage',
    description: 'Application memory usage is above acceptable threshold',
    metric: 'app_memory_usage_bytes',
    condition: 'gt',
    threshold: 1024 * 1024 * 1024, // 1GB
    duration: 300,
    severity: 'warning',
    labels: {},
    annotations: {
      summary: 'High memory usage detected',
      description: 'The application memory usage is above the acceptable threshold',
      runbook_url: 'https://docs.internal/runbooks/high-memory-usage'
    },
    channels: ['log', 'email']
  }
];

// Export a singleton instance
const alertService = {
  setup: setupAlerts,
  defaultRules: defaultAlertRules
};

export default alertService;
