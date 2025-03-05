import { useState, useEffect } from 'react'
import './App.css'
import { api } from './utils/api'

interface ApiStatus {
  status: string;
  message: string;
  timestamp: string;
}

function App() {
  const [count, setCount] = useState(0)
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkApiStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.get<ApiStatus>('/api/health')
      setApiStatus(response)
    } catch (err) {
      setError('Failed to connect to API server. Make sure it is running.')
      console.error('API Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check API status when component mounts
    checkApiStatus()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Success Kid Platform</h1>
        <p className="text-gray-600">Transform a viral meme token into a sustainable digital community</p>
      </header>
      
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Welcome to Success Kid</h2>
        <p className="text-gray-600 mb-6">
          Join our community of creators, collectors, and enthusiasts building the future of 
          digital ownership and engagement.
        </p>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="btn btn-primary"
          >
            Count is {count}
          </button>
          <button 
            className="bg-secondary hover:bg-secondary-hover px-4 py-2 rounded font-medium transition-colors text-gray-900"
            onClick={checkApiStatus}
            disabled={loading}
          >
            {loading ? 'Checking API...' : 'Check API Status'}
          </button>
        </div>
      </div>
      
      {/* API Status Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">API Connection Status</h2>
        
        {loading && <p className="text-gray-600">Loading API status...</p>}
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200 mb-4">
            {error}
          </div>
        )}
        
        {apiStatus && !error && (
          <div className="bg-green-50 text-green-700 p-3 rounded border border-green-200">
            <p><strong>Status:</strong> {apiStatus.status}</p>
            <p><strong>Message:</strong> {apiStatus.message}</p>
            <p><strong>Timestamp:</strong> {new Date(apiStatus.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>
      
      <footer className="mt-8 text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Success Kid Community Platform
      </footer>
    </div>
  )
}

export default App
