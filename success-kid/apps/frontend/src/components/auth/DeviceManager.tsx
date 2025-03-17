'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Loader2, 
  AlertCircle,
  Info,
  X,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Device {
  id: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  lastActive: string;
  isCurrent: boolean;
}

/**
 * Device Management Component for Authentication
 * 
 * Allows users to view and manage their active sessions across devices
 */
export function DeviceManager() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTerminating, setIsTerminating] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices();
    }
  }, [isAuthenticated]);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/sessions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch active sessions');
      }
      
      const data = await response.json();
      setDevices(data.data.sessions);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your active sessions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      setIsTerminating(true);
      
      const response = await fetch(`/api/v1/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to terminate session');
      }
      
      // Remove the terminated session from local state
      setDevices(devices.filter(device => device.id !== sessionId));
      
      toast({
        title: 'Success',
        description: 'Session terminated successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error terminating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to terminate session',
        variant: 'destructive',
      });
    } finally {
      setIsTerminating(false);
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      setIsTerminating(true);
      
      const response = await fetch('/api/v1/auth/sessions/all', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to terminate all sessions');
      }
      
      // Keep only the current session in local state
      setDevices(devices.filter(device => device.isCurrent));
      
      toast({
        title: 'Success',
        description: 'All other sessions terminated successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to terminate all sessions',
        variant: 'destructive',
      });
    } finally {
      setIsTerminating(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-6 w-6 text-primary" />;
      case 'tablet':
        return <Tablet className="h-6 w-6 text-primary" />;
      case 'desktop':
        return <Monitor className="h-6 w-6 text-primary" />;
      default:
        return <Laptop className="h-6 w-6 text-primary" />;
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    
    return date.toLocaleDateString();
  };

  // Mock data for demonstration when no real data is available
  useEffect(() => {
    if (!isLoading && devices.length === 0) {
      const mockDevices: Device[] = [
        {
          id: '1',
          deviceType: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          lastActive: new Date().toISOString(),
          isCurrent: true,
        },
        {
          id: '2',
          deviceType: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          lastActive: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          isCurrent: false,
        }
      ];
      setDevices(mockDevices);
    }
  }, [isLoading, devices]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Manage your signed-in devices</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Active Sessions</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-80 text-sm">
                  These are your current active sessions across different devices. 
                  You can sign out from any device remotely to protect your account.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>Manage your signed-in devices</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {devices.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No active sessions found.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div 
                key={device.id} 
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  device.isCurrent ? 'bg-muted/50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div>{getDeviceIcon(device.deviceType)}</div>
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium">
                        {device.browser} on {device.os}
                      </p>
                      {device.isCurrent && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last active: {formatLastActive(device.lastActive)}
                    </p>
                  </div>
                </div>
                
                {!device.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => terminateSession(device.id)}
                    disabled={isTerminating}
                  >
                    {isTerminating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="sr-only">Terminate</span>
                  </Button>
                )}
                
                {device.isCurrent && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <CheckCircle className="h-4 w-4 text-primary/70" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">This is your current device</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="secondary" 
          onClick={terminateAllOtherSessions} 
          disabled={isTerminating || devices.length <= 1}
          className="w-full"
        >
          {isTerminating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-2 h-4 w-4" />
          )}
          Sign out from all other devices
        </Button>
      </CardFooter>
    </Card>
  );
}
