'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceInfo {
  name: string;
  type?: string;
  os?: string;
  browser?: string;
  ip?: string;
  location?: string;
}

interface Session {
  id: string;
  userId: string;
  device: DeviceInfo;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isActive: boolean;
  isCurrent: boolean;
}

export function UserSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useAuth();
  
  // Fetch user sessions
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/v1/auth/sessions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      
      const data = await response.json();
      setSessions(data.data.sessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load your active sessions');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Revoke a specific session
  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v1/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }
      
      // Remove session from list or refresh list
      setSessions(sessions.filter(session => session.id !== sessionId));
      
      // If current session was revoked, redirect to login
      const currentSession = sessions.find(session => session.isCurrent);
      if (currentSession && currentSession.id === sessionId) {
        window.location.href = '/sign-in';
      }
    } catch (err) {
      console.error('Error revoking session:', err);
      setError('Failed to revoke session');
    }
  };
  
  // Revoke all other sessions
  const revokeAllOtherSessions = async () => {
    try {
      const response = await fetch('/api/v1/auth/sessions', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to revoke sessions');
      }
      
      // Keep only current session
      setSessions(sessions.filter(session => session.isCurrent));
    } catch (err) {
      console.error('Error revoking all sessions:', err);
      setError('Failed to revoke other sessions');
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Load sessions on mount
  useEffect(() => {
    if (isSignedIn) {
      fetchSessions();
    }
  }, [isSignedIn]);
  
  if (!isSignedIn) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Active Sessions</h2>
        <Button
          variant="outline"
          onClick={fetchSessions}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {sessions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No active sessions found
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`p-4 ${session.isCurrent ? 'border-primary' : ''}`}>
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">
                            {session.device.name || 'Unknown Device'}
                            {session.isCurrent && (
                              <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                                Current Session
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.device.ip ? `IP: ${session.device.ip}` : 'No IP information'}
                          </div>
                          <div className="text-sm mt-2">
                            <div>Created: {formatDate(session.createdAt)}</div>
                            <div>Last active: {formatDate(session.lastActiveAt)}</div>
                            <div>Expires: {formatDate(session.expiresAt)}</div>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => revokeSession(session.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
                
                {sessions.length > 1 && (
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="secondary"
                      onClick={revokeAllOtherSessions}
                    >
                      Revoke All Other Sessions
                    </Button>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
