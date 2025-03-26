'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { 
  Switch,
  Slider,
  Button,
  Checkbox
} from '@/components/ui/button';
import { useMarketAlerts } from '@/hooks/useMarketData';
import { AlertType, AlertPreferences } from '@/types';

interface AlertOptionProps {
  type: AlertType;
  title: string;
  description: string;
  isEnabled: boolean;
  onToggle: () => void;
}

function AlertOption({ 
  type, 
  title, 
  description, 
  isEnabled, 
  onToggle 
}: AlertOptionProps) {
  return (
    <div className="flex justify-between items-center p-4 border rounded-md mb-4">
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <Switch 
        checked={isEnabled} 
        onCheckedChange={onToggle}
        aria-label={`Enable ${title} alerts`}
      />
    </div>
  );
}

interface ThresholdSettingProps {
  title: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function ThresholdSetting({
  title,
  description,
  value,
  min,
  max,
  step,
  unit,
  disabled = false,
  onChange
}: ThresholdSettingProps) {
  return (
    <div className={`p-4 border rounded-md mb-4 ${disabled ? 'opacity-50' : ''}`}>
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-neutral-500 mb-3">{description}</p>
      <div className="flex items-center">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={(values) => onChange(values[0])}
          disabled={disabled}
          className="flex-1 mr-4"
        />
        <span className="w-16 text-right font-medium">
          {value}{unit}
        </span>
      </div>
    </div>
  );
}

interface NotificationMethodProps {
  methods: AlertPreferences['notificationMethods'];
  onChange: (methods: AlertPreferences['notificationMethods']) => void;
}

function NotificationMethods({ methods, onChange }: NotificationMethodProps) {
  return (
    <div className="p-4 border rounded-md mb-4">
      <h4 className="font-medium mb-2">Notification Methods</h4>
      <div className="space-y-2">
        <div className="flex items-center">
          <Checkbox
            id="inAppNotifications"
            checked={methods.inApp}
            onCheckedChange={(checked) => 
              onChange({ ...methods, inApp: !!checked })
            }
          />
          <label htmlFor="inAppNotifications" className="ml-2 text-sm">
            In-app notifications
          </label>
        </div>
        <div className="flex items-center">
          <Checkbox
            id="emailNotifications"
            checked={methods.email}
            onCheckedChange={(checked) => 
              onChange({ ...methods, email: !!checked })
            }
          />
          <label htmlFor="emailNotifications" className="ml-2 text-sm">
            Email notifications
          </label>
        </div>
        <div className="flex items-center">
          <Checkbox
            id="pushNotifications"
            checked={methods.push}
            onCheckedChange={(checked) => 
              onChange({ ...methods, push: !!checked })
            }
          />
          <label htmlFor="pushNotifications" className="ml-2 text-sm">
            Push notifications
          </label>
        </div>
      </div>
    </div>
  );
}

export function MarketAlertSystem({ className = '' }) {
  const { 
    preferences, 
    isLoading, 
    error, 
    toggleAlert, 
    updateAlertPreferences 
  } = useMarketAlerts();
  
  const [isSaving, setIsSaving] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<AlertPreferences | null>(null);
  
  // Use local state for the form
  const activePreferences = localPreferences || preferences;
  
  // Initialize local preferences when the data loads
  useEffect(() => {
    if (!isLoading && preferences) {
      setLocalPreferences(preferences);
    }
  }, [isLoading, preferences]);
  
  const alertOptions = [
    {
      type: 'price_movement' as AlertType,
      title: 'Price Movement',
      description: 'Get notified when the token price changes significantly'
    },
    {
      type: 'milestone_reached' as AlertType,
      title: 'Milestone Achieved',
      description: 'Get notified when market cap reaches a new milestone'
    },
    {
      type: 'volume_spike' as AlertType,
      title: 'Volume Spike',
      description: 'Get notified when trading volume increases sharply'
    },
    {
      type: 'holder_change' as AlertType,
      title: 'Holders Change',
      description: 'Get notified about significant changes in holder count'
    }
  ];
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!localPreferences) return;
    
    try {
      setIsSaving(true);
      await updateAlertPreferences(localPreferences);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset to saved preferences
  const handleCancel = () => {
    setLocalPreferences(preferences);
  };
  
  // Handle toggling an alert type
  const handleToggleAlert = (alertType: AlertType) => {
    if (!localPreferences) return;
    
    const isEnabled = localPreferences.enabledAlerts.includes(alertType);
    const newEnabledAlerts = isEnabled
      ? localPreferences.enabledAlerts.filter(type => type !== alertType)
      : [...localPreferences.enabledAlerts, alertType];
    
    setLocalPreferences({
      ...localPreferences,
      enabledAlerts: newEnabledAlerts
    });
  };
  
  // Check if the form has changes
  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(localPreferences);
  
  // Handle loading and error states
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Market Alerts</CardTitle>
          <CardDescription>Configure notifications for market events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-md bg-neutral-100"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Market Alerts</CardTitle>
          <CardDescription>Configure notifications for market events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-alert-200 bg-alert-50 rounded-md text-alert-700">
            <p>Sorry, we encountered an error loading your alert preferences.</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!activePreferences) return null;
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Market Alerts</CardTitle>
        <CardDescription>Configure notifications for market events</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Alert Types</h3>
          
          {alertOptions.map(option => (
            <AlertOption 
              key={option.type}
              type={option.type}
              title={option.title}
              description={option.description}
              isEnabled={activePreferences.enabledAlerts.includes(option.type)}
              onToggle={() => handleToggleAlert(option.type)}
            />
          ))}
          
          <h3 className="text-lg font-medium mt-8">Alert Thresholds</h3>
          
          <ThresholdSetting
            title="Price Movement Threshold"
            description="Minimum percentage change to trigger a price alert"
            value={activePreferences.customThresholds.priceMovement}
            min={1}
            max={20}
            step={0.5}
            unit="%"
            disabled={!activePreferences.enabledAlerts.includes('price_movement')}
            onChange={value => setLocalPreferences({
              ...activePreferences,
              customThresholds: {
                ...activePreferences.customThresholds,
                priceMovement: value
              }
            })}
          />
          
          <ThresholdSetting
            title="Volume Spike Threshold"
            description="Minimum percentage increase in volume to trigger an alert"
            value={activePreferences.customThresholds.volumeSpike}
            min={10}
            max={100}
            step={5}
            unit="%"
            disabled={!activePreferences.enabledAlerts.includes('volume_spike')}
            onChange={value => setLocalPreferences({
              ...activePreferences,
              customThresholds: {
                ...activePreferences.customThresholds,
                volumeSpike: value
              }
            })}
          />
          
          <h3 className="text-lg font-medium mt-8">Notification Settings</h3>
          
          <NotificationMethods
            methods={activePreferences.notificationMethods}
            onChange={methods => setLocalPreferences({
              ...activePreferences,
              notificationMethods: methods
            })}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={!hasChanges || isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardFooter>
    </Card>
  );
}
