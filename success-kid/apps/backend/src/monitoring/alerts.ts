/**
 * Alerting System Module
 * 
 * Provides alerting functionality based on metrics and health checks
 */
import { FastifyInstance } from 'fastify';
import { AlertRule, AlertChannel, AlertNotification } from './types';

// Store alert rules and channels
const alertRules: Map<string, AlertRule> = new Map();
const alertChannels: Map<string, AlertChannel> = new Map();
const activeAlerts: Map<string, AlertNotification> = new Map();

/**
 * Configure alerts system
 */
export async function setupAlerts(fastify: FastifyInstance): Promise<void> {
  // Register alert notification endpoint
  fastify.get('/alerts', {
    schema: {
      hide: true, // Hide from Swagger docs
    },
    handler: async (request, reply) => {
      // Only return active alerts
      const alerts = Array.from(activeAlerts.values());
      return { alerts };
    },
  });
  
  // Register default alert channels
  registerDefaultAlertChannels();
  
  // Register default alert rules
  registerDefaultAlertRules();
  
  // Start alert checking loop
  startAlertChecking(fastify);
  
  fastify.log.info(`Alerting system initialized with ${alertRules.size} rules and ${alertChannels.size} channels`);
}

/**
 * Register a new alert rule
 */
export function registerAlertRule(rule: AlertRule): void {
  alertRules.set(rule.id, rule);
}

/**
 * Register a new alert channel
 */
export function registerAlertChannel(channel: AlertChannel): void {
  alertChannels.set(channel.id, channel);
}

/**
 * Start background alert checking loop
 */
function startAlertChecking(fastify: FastifyInstance): void {
  // Check alert rules every 30 seconds
  const checkInterval = 30000;
  
  const checkAlerts = async () => {
    try {
      // Check each alert rule
      for (const rule of alertRules.values()) {
        try {
          await checkAlertRule(fastify, rule);
        } catch (error) {
          fastify.log.error({ err: error }, `Error checking alert rule ${rule.id}`);
        }
      }
    } catch (error) {
      fastify.log.error({ err: error }, 'Error in alert checking loop');
    } finally {
      // Schedule next check
      setTimeout(checkAlerts, checkInterval);
    }
  };
  
  // Start initial check
  setTimeout(checkAlerts, 5000);
}

/**
 * Check a specific alert rule against current metrics
 */
async function checkAlertRule(fastify: FastifyInstance, rule: AlertRule): Promise<void> {
  // In a real implementation, we'd check the actual metric value
  // For now, we'll use a placeholder implementation
  const metricValue = Math.random() * 100;
  const threshold = typeof rule.threshold === 'string' ? parseFloat(rule.threshold) : rule.threshold;
  
  let isTriggered = false;
  
  // Check condition
  switch (rule.condition) {
    case 'gt':
      isTriggered = metricValue > threshold;
      break;
    case 'lt':
      isTriggered = metricValue < threshold;
      break;
    case 'eq':
      isTriggered = metricValue === threshold;
      break;
    case 'ne':
      isTriggered = metricValue !== threshold;
      break;
    default:
      isTriggered = false;
  }
  
  const alertId = `${rule.id}-${new Date().toISOString().slice(0, 10)}`;
  
  // If triggered and not already alerted
  if (isTriggered && !activeAlerts.has(alertId)) {
    const notification: AlertNotification = {
      id: alertId,
      timestamp: new Date(),
      rule,
      value: metricValue,
      resolved: false,
    };
    
    // Store alert
    activeAlerts.set(alertId, notification);
    
    // Send notifications
    await sendAlertNotifications(fastify, notification);
    
    fastify.log.warn(
      `Alert triggered: ${rule.name} - ${rule.description} (${metricValue} ${rule.condition} ${rule.threshold})`
    );
  }
  // If resolved and previously alerted
  else if (!isTriggered && activeAlerts.has(alertId)) {
    const notification = activeAlerts.get(alertId)!;
    
    // Mark as resolved
    notification.resolved = true;
    notification.resolvedAt = new Date();
    
    // Send resolution notifications
    await sendAlertResolutionNotifications(fastify, notification);
    
    // Remove from active alerts after a cooldown period
    setTimeout(() => {
      activeAlerts.delete(alertId);
    }, 3600000); // 1 hour cooldown
    
    fastify.log.info(
      `Alert resolved: ${rule.name} - ${rule.description} (${metricValue} ${rule.condition} ${rule.threshold})`
    );
  }
}

/**
 * Send alert notifications through configured channels
 */
async function sendAlertNotifications(fastify: FastifyInstance, notification: AlertNotification): Promise<void> {
  const rule = notification.rule;
  
  // Send through each configured channel
  for (const channelId of rule.channels) {
    const channel = alertChannels.get(channelId);
    
    if (!channel) {
      fastify.log.warn(`Alert channel ${channelId} not found`);
      continue;
    }
    
    try {
      await channel.send(notification);
    } catch (error) {
      fastify.log.error({ err: error }, `Error sending alert to channel ${channelId}`);
    }
  }
}

/**
 * Send alert resolution notifications
 */
async function sendAlertResolutionNotifications(fastify: FastifyInstance, notification: AlertNotification): Promise<void> {
  const rule = notification.rule;
  
  // Send through each configured channel
  for (const channelId of rule.channels) {
    const channel = alertChannels.get(channelId);
    
    if (!channel) {
      fastify.log.warn(`Alert channel ${channelId} not found`);
      continue;
    }
    
    try {
      await channel.send(notification);
    } catch (error) {
      fastify.log.error({ err: error }, `Error sending resolution alert to channel ${channelId}`);
    }
  }
}

/**
 * Register default alert channels
 */
function registerDefaultAlertChannels(): void {
  // Console alert channel (for development)
  const consoleChannel: AlertChannel = {
    id: 'console',
    name: 'Console',
    type: 'webhook',
    config: {},
    async send(notification: AlertNotification): Promise<boolean> {
      console.log(
        `[ALERT] ${notification.resolved ? 'RESOLVED' : 'TRIGGERED'}: ${notification.rule.name}`,
        {
          description: notification.rule.description,
          severity: notification.rule.severity,
          value: notification.value,
          threshold: notification.rule.threshold,
          timestamp: notification.timestamp.toISOString(),
          resolvedAt: notification.resolvedAt?.toISOString(),
        }
      );
      return true;
    },
  };
  
  registerAlertChannel(consoleChannel);
}

/**
 * Register default alert rules
 */
function registerDefaultAlertRules(): void {
  // High response time alert
  registerAlertRule({
    id: 'high-response-time',
    name: 'High API Response Time',
    description: 'API response time exceeds threshold',
    metric: 'http_request_duration_seconds',
    condition: 'gt',
    threshold: 1.0, // 1 second
    duration: 300, // Alert after 5 minutes of violations
    severity: 'warning',
    labels: {
      service: 'api',
      category: 'performance',
    },
    annotations: {
      summary: 'High API response time detected',
      description: 'API response time exceeds 1 second threshold for 5+ minutes',
    },
    channels: ['console'],
  });
  
  // High database query time alert
  registerAlertRule({
    id: 'high-db-query-time',
    name: 'High Database Query Time',
    description: 'Database query time exceeds threshold',
    metric: 'db_query_duration_seconds',
    condition: 'gt',
    threshold: 0.5, // 500 ms
    duration: 300, // Alert after 5 minutes of violations
    severity: 'warning',
    labels: {
      service: 'database',
      category: 'performance',
    },
    annotations: {
      summary: 'High database query time detected',
      description: 'Database query time exceeds 500ms threshold for 5+ minutes',
    },
    channels: ['console'],
  });
  
  // High memory usage alert
  registerAlertRule({
    id: 'high-memory-usage',
    name: 'High Memory Usage',
    description: 'System memory usage exceeds threshold',
    metric: 'process_memory_usage_bytes',
    condition: 'gt',
    threshold: 1000000000, // 1GB
    duration: 300, // Alert after 5 minutes of violations
    severity: 'warning',
    labels: {
      service: 'api',
      category: 'resource',
    },
    annotations: {
      summary: 'High memory usage detected',
      description: 'System memory usage exceeds 1GB threshold for 5+ minutes',
    },
    channels: ['console'],
  });
  
  // High error rate alert
  registerAlertRule({
    id: 'high-error-rate',
    name: 'High Error Rate',
    description: 'API error rate exceeds threshold',
    metric: 'http_requests_total',
    condition: 'gt',
    threshold: 0.05, // 5% error rate
    duration: 300, // Alert after 5 minutes of violations
    severity: 'critical',
    labels: {
      service: 'api',
      category: 'reliability',
    },
    annotations: {
      summary: 'High error rate detected',
      description: 'API error rate exceeds 5% threshold for 5+ minutes',
    },
    channels: ['console'],
  });
}
