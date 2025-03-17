# Background Processing System

This module provides a robust, scalable background processing system for the Success Kid Community Platform. It allows for efficient processing of time-consuming and resource-intensive tasks asynchronously, improving platform responsiveness and reliability.

## Core Features

- **Job Queue Management**: Reliable job queuing using Bull and Redis
- **Scheduled Jobs**: Cron-based scheduling for recurring tasks
- **Retry Mechanism**: Sophisticated retry handling for transient failures
- **Monitoring and Alerts**: Comprehensive monitoring with alerts for issues
- **Job History and Analytics**: Detailed history and performance analytics
- **Job Prioritization**: Smart prioritization based on business requirements
- **Resource Management**: Efficient handling of resource-intensive tasks
- **Job Dependencies**: Management of jobs with dependencies
- **Distributed Processing**: Support for distributed job processing

## Usage Examples

### Adding a Simple Job

```typescript
import { bullJobController, QueueName } from '../jobs';

// Add a job to process points redemption
const jobId = await bullJobController.addJob(
  QueueName.POINTS,
  'redemption',
  {
    userId: '123',
    amount: 1000,
    walletAddress: '0x123...'
  }
);

console.log(`Job added with ID: ${jobId}`);
```

### Creating a Scheduled Job

```typescript
import { bullJobController, QueueName } from '../jobs';

// Schedule a job to run daily at midnight UTC
const schedule = await bullJobController.createSchedule(
  'Daily User Stats',
  QueueName.CONTENT,
  'generateUserStats',
  { fullReport: true },
  '0 0 0 * * *', // Midnight every day
  'UTC',
  true // Enabled
);

console.log(`Schedule created with ID: ${schedule.id}`);
```

### Working with Job Priorities

```typescript
import { priorityService, QueueName } from '../jobs';

// Define a custom priority policy
priorityService.registerPriorityPolicy({
  queue: QueueName.MEDIA,
  jobName: 'videoProcessing',
  calculatePriority: (data) => {
    // Higher priority (lower number) for premium users
    if (data.userType === 'premium') {
      return -10; // High priority
    }
    return 0; // Normal priority
  },
  description: 'Prioritize video processing for premium users'
});

// Get priority for a job
const priority = priorityService.calculateJobPriority(
  QueueName.MEDIA,
  'videoProcessing',
  { userType: 'premium', videoId: '123' }
);
```

### Managing Job Dependencies

```typescript
import { dependencyService, QueueName } from '../jobs';

// First, create parent jobs
const job1Id = await bullJobController.addJob(
  QueueName.MEDIA,
  'imageProcessing',
  { imageId: '123' }
);

const job2Id = await bullJobController.addJob(
  QueueName.MEDIA,
  'imageProcessing',
  { imageId: '456' }
);

// Create a job that depends on the completion of other jobs
const dependentJobId = await dependencyService.addJobWithDependencies(
  QueueName.MEDIA,
  'createGallery',
  { imageIds: ['123', '456'] },
  [job1Id, job2Id]
);

// Check dependency status
const status = await dependencyService.checkDependencies([job1Id, job2Id]);
console.log(`Ready: ${status.ready}, Pending: ${status.pending}`);
```

### Working with Resource-Intensive Jobs

```typescript
import { resourceService, QueueName } from '../jobs';

// Set resource requirements for a job type
await resourceService.setJobResourceRequirements(
  QueueName.MEDIA,
  'videoTranscoding',
  {
    memory: 500, // 500MB
    cpu: 80,     // 80% CPU
    duration: 60 // 60 seconds
  }
);

// Schedule a resource-intensive job
const jobId = await resourceService.scheduleResourceIntensiveJob(
  QueueName.MEDIA,
  'videoTranscoding',
  { videoId: '123', format: 'mp4' }
);

// Get current resource availability
const availability = await resourceService.getResourceAvailability();
console.log(`Available memory: ${availability.memory.available}MB`);
```

### Querying Job History and Analytics

```typescript
import { jobHistoryService } from '../jobs';

// Get job history with filtering
const history = await jobHistoryService.getJobHistory({
  queue: 'points-processing',
  status: 'completed',
  page: 1,
  pageSize: 20,
  sortBy: 'startedAt',
  sortDirection: 'desc'
});

// Generate job analytics
const analytics = await jobHistoryService.generateJobAnalytics({
  startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  endTime: new Date(),
  queues: ['points-processing'],
  granularity: 'day'
});

console.log(`Success rate: ${analytics.summary.successRate * 100}%`);
```

### Monitoring and Alerts

```typescript
import { metricsService, alertService, QueueName } from '../jobs';

// Get queue metrics
const metrics = await metricsService.getCurrentMetrics()
  .then(map => map.get(QueueName.POINTS));

// Set alert threshold
await alertService.setAlertThreshold(
  'errorRate',
  0.05, // 5%
  'HIGH_ERROR_RATE',
  'WARNING',
  'Error rate exceeds threshold'
);

// Get active alerts
const alerts = await alertService.getAlerts();

// Acknowledge an alert
if (alerts.length > 0) {
  await alertService.acknowledgeAlert(alerts[0].id);
}
```

## API Endpoints

The system provides the following API endpoints:

### Job Management

- `POST /api/v1/jobs` - Add a new job
- `GET /api/v1/jobs/:queue/:jobId` - Get job status
- `POST /api/v1/jobs/:queue/:jobId/retry` - Retry a failed job
- `DELETE /api/v1/jobs/:queue/:jobId` - Remove a job
- `GET /api/v1/jobs/queues/:queue/stats` - Get queue statistics

### Scheduler

- `GET /api/v1/schedules` - Get all schedules
- `GET /api/v1/schedules/:id` - Get a specific schedule
- `POST /api/v1/schedules` - Create a new schedule
- `PUT /api/v1/schedules/:id` - Update a schedule
- `DELETE /api/v1/schedules/:id` - Delete a schedule
- `POST /api/v1/schedules/:id/enable` - Enable a schedule
- `POST /api/v1/schedules/:id/disable` - Disable a schedule
- `POST /api/v1/schedules/:id/run` - Run a schedule immediately

### Monitoring

- `GET /api/v1/jobs/dashboard` - Get dashboard data
- `GET /api/v1/jobs/metrics/:queue` - Get queue metrics
- `GET /api/v1/jobs/alerts` - Get alerts
- `POST /api/v1/jobs/alerts/:alertId/acknowledge` - Acknowledge an alert
- `POST /api/v1/jobs/alerts/thresholds` - Set alert threshold
- `GET /api/v1/jobs/alerts/thresholds` - Get alert thresholds

### History and Analytics

- `GET /api/v1/jobs/history` - Get job history
- `GET /api/v1/jobs/history/recent` - Get recent job history
- `POST /api/v1/jobs/analytics` - Generate job analytics
- `POST /api/v1/jobs/history/cleanup` - Clean up old job history

## Worker Implementation

When implementing a new job processor, follow this pattern:

```typescript
// In jobs/workers/your-module.ts
import { Job } from 'bull';
import { logger } from '../../lib/logger';

/**
 * Process a custom job
 */
export async function processCustomJob(job: Job): Promise<any> {
  try {
    // Extract job data
    const { param1, param2 } = job.data;
    
    // Update progress
    await job.progress(10);
    
    logger.info('Processing custom job', { 
      jobId: job.id,
      param1,
      param2
    });
    
    // Implement job logic here
    // ...
    
    // Update progress
    await job.progress(100);
    
    // Return result
    return { success: true, result: 'Some result' };
  } catch (error) {
    logger.error('Error processing custom job', { 
      jobId: job.id,
      error
    });
    
    throw error;
  }
}
```

Then register your worker in the worker registry (`jobs/workers/index.ts`):

```typescript
// Import your worker
import * as customWorkers from './your-module';

export function registerWorkers(queues: Record<string, Queue>): void {
  // Register your processors
  queues[QueueName.YOUR_QUEUE].process('customJob', customWorkers.processCustomJob);
  
  // ... other registrations
}
```

## Best Practices

1. **Make Jobs Idempotent**: Design jobs to be safely retried without side effects
2. **Add Appropriate Error Handling**: Use try/catch blocks and log errors thoroughly
3. **Use Progress Updates**: Update job progress to track execution
4. **Validate Job Data**: Validate data before processing to avoid runtime errors
5. **Use Job Priorities Wisely**: Reserve high priorities for critical operations
6. **Manage Resources Carefully**: Set appropriate resource requirements for jobs
7. **Monitor Queue Health**: Use the monitoring features to track performance
8. **Handle Dependencies Properly**: Consider what happens when dependencies fail
9. **Clean Up Completed Jobs**: Configure appropriate retention for completed jobs
10. **Use Transactions**: For data consistency when operations span multiple steps

## Resource Management

The system includes built-in resource management to prevent overloading the server. Use the resource service to define resource requirements for jobs and schedule resource-intensive tasks appropriately.

## Error Handling

Jobs use a sophisticated retry mechanism with these strategies:

1. **Fixed Delay**: Retry with a constant delay between attempts
2. **Exponential Backoff**: Retry with increasing delays between attempts
3. **Custom Strategy**: Custom retry logic based on specific requirements

## Integration with Services

When integrating with other services, inject dependencies through the DI container:

```typescript
// In your service.ts file
import { DependencyService } from '../jobs/dependencies';

export class YourService {
  constructor(private dependencyService: DependencyService) {}
  
  async processWithDependencies() {
    // Use the dependency service
  }
}

// In your plugin.ts file
fastify.register(async (instance) => {
  const dependencyService = instance.diContainer.resolve('dependencyService');
  const yourService = new YourService(dependencyService);
  
  instance.decorate('yourService', yourService);
});
```

## Contributing

When adding new job types:

1. Define the job type in the appropriate queue
2. Implement the worker function in the workers directory
3. Register the worker in the worker registry
4. Add appropriate retry and resource configurations
5. Update documentation with usage examples
