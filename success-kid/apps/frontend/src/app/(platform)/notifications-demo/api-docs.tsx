'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

const ApiDocs = () => {
  return (
    <div className="mt-10 border-t border-neutral-200 pt-10 dark:border-neutral-800">
      <h2 className="mb-6 text-2xl font-bold">API Documentation</h2>
      
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-lg font-medium">WebSocket Events</h3>
          </div>
          <div className="p-4">
            <p className="mb-4 text-neutral-600 dark:text-neutral-400">
              The notification system uses WebSocket events for real-time communication. Here are the event types:
            </p>
            
            <div className="mb-4 overflow-x-auto rounded border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left">
                <thead className="bg-neutral-100 dark:bg-neutral-800">
                  <tr>
                    <th className="p-2 font-medium">Event Type</th>
                    <th className="p-2 font-medium">Purpose</th>
                    <th className="p-2 font-medium">Payload Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  <tr>
                    <td className="p-2 font-mono text-sm">notification:new</td>
                    <td className="p-2">New notification event</td>
                    <td className="p-2">
                      <pre className="overflow-x-auto rounded bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
{`{
  type: 'notification:new',
  data: {
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'You earned a badge',
    data: { ... },
    actions: [ ... ]
  }
}`}
                      </pre>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-sm">notification:read_update</td>
                    <td className="p-2">Update notification read status</td>
                    <td className="p-2">
                      <pre className="overflow-x-auto rounded bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
{`{
  type: 'notification:read_update',
  data: {
    ids: ['notif_123', 'notif_124'],
    read: true,
    unreadCount: 3
  }
}`}
                      </pre>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-sm">notification:clear</td>
                    <td className="p-2">Clear notifications</td>
                    <td className="p-2">
                      <pre className="overflow-x-auto rounded bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
{`{
  type: 'notification:clear',
  data: {
    clearAll: true,
    ids: [] // Optional specific IDs
  }
}`}
                      </pre>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
        
        <Card className="overflow-hidden">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-lg font-medium">REST API Endpoints</h3>
          </div>
          <div className="p-4">
            <p className="mb-4 text-neutral-600 dark:text-neutral-400">
              The notification system also provides REST API endpoints for fetching and managing notifications:
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium">Get Notifications</h4>
                <pre className="overflow-x-auto rounded bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
                  GET /api/notifications?type=&read=&limit=20&offset=0
                </pre>
                <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <p>Query Parameters:</p>
                  <ul className="ml-6 list-disc">
                    <li>type: Filter by notification type</li>
                    <li>read: Filter by read status (true/false)</li>
                    <li>limit: Maximum number of notifications to return</li>
                    <li>offset: Pagination offset</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="mb-2 font-medium">Mark Notifications as Read</h4>
                <pre className="overflow-x-auto rounded bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
                  POST /api/notifications/read
                </pre>
                <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <p>Request Body:</p>
                  <pre className="mt-1 overflow-x-auto rounded bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
{`{
  "data": {
    "ids": ["notif_123", "notif_124"]
  }
}`}
                  </pre>
                </div>
              </div>
              
              <div>
                <h4 className="mb-2 font-medium">Clear All Notifications</h4>
                <pre className="overflow-x-auto rounded bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
                  DELETE /api/notifications
                </pre>
              </div>
              
              <div>
                <h4 className="mb-2 font-medium">Get Notification Preferences</h4>
                <pre className="overflow-x-auto rounded bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
                  GET /api/notifications/preferences
                </pre>
              </div>
              
              <div>
                <h4 className="mb-2 font-medium">Update Notification Preferences</h4>
                <pre className="overflow-x-auto rounded bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
                  PUT /api/notifications/preferences
                </pre>
                <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <p>Request Body:</p>
                  <pre className="mt-1 overflow-x-auto rounded bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
{`{
  "data": {
    "categories": {
      "achievement": true,
      "social": true,
      "system": true,
      "content": true,
      "market": false
    },
    "delivery": {
      "inApp": true,
      "email": true,
      "push": false
    },
    "frequency": "immediate",
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00",
      "timezone": "America/New_York"
    }
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="overflow-hidden">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-lg font-medium">Test Endpoint</h3>
          </div>
          <div className="p-4">
            <p className="mb-4 text-neutral-600 dark:text-neutral-400">
              For testing purposes, you can use this endpoint to simulate WebSocket events:
            </p>
            
            <div>
              <h4 className="mb-2 font-medium">Trigger Test Notification</h4>
              <pre className="overflow-x-auto rounded bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
                POST /api/ws-mock
              </pre>
              <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                <p>Request Body:</p>
                <pre className="mt-1 overflow-x-auto rounded bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
{`{
  "eventType": "new-achievement" // Or "new-follower", "market-update"
}`}
                </pre>
                <p className="mt-2">This endpoint will respond with a simulated WebSocket event that you can use for testing.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ApiDocs;
