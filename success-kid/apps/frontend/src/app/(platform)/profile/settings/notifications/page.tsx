/**
 * Notification Settings Page
 */
'use client';

import React from 'react';
import { NotificationSettings } from '@/components/features/notifications';

export default function NotificationSettingsPage() {
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      <NotificationSettings />
    </div>
  );
}
