'use client';

import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export function OfflineIndicator() {
  const { 
    isOnline, 
    wasOffline, 
    hasPendingActions, 
    isReconnecting,
    handleReconnect,
    clearWasOffline
  } = useOfflineStatus();

  // If online and no previous offline state, don't show anything
  if (isOnline && !wasOffline && !hasPendingActions) {
    return null;
  }

  // If offline, show offline indicator
  if (!isOnline) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-alert text-white p-2 text-center">
        <div className="flex items-center justify-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18.364 5.636a9 9 0 010 12.728l-1.414-1.414a7 7 0 000-9.9l1.414-1.414zM14.95 9.05a5 5 0 010 7.07l-1.414-1.414a3 3 0 000-4.242l1.414-1.414zm-8.192 8.192a5 5 0 010-7.07l1.414 1.414a3 3 0 000 4.242l-1.414 1.414zm-3.778-3.778a9 9 0 010-12.728l1.414 1.414a7 7 0 000 9.9l-1.414 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span>You're offline</span>
          {!isReconnecting ? (
            <button
              onClick={handleReconnect}
              className="ml-2 px-2 py-1 text-xs bg-white text-alert rounded-md font-medium"
            >
              Reconnect
            </button>
          ) : (
            <span className="ml-2 text-xs">Reconnecting...</span>
          )}
        </div>
      </div>
    );
  }

  // If we were offline but are now online and have pending actions
  if (isOnline && wasOffline && hasPendingActions) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-accent text-white p-2 text-center">
        <div className="flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Syncing offline changes...</span>
        </div>
      </div>
    );
  }

  // If we were offline but are now online with no pending actions
  if (isOnline && wasOffline && !hasPendingActions) {
    setTimeout(() => {
      clearWasOffline();
    }, 3000);

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-accent text-white p-2 text-center">
        <div className="flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>You're back online!</span>
        </div>
      </div>
    );
  }

  return null;
}
