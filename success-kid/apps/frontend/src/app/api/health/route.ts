import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

/**
 * API route to provide health check information
 * 
 * @route GET /api/health
 * @access Public
 */
export async function GET(request: NextRequest) {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
    memory: {
      free: Math.round(os.freemem() / 1024 / 1024) + ' MB',
      total: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
      usage: Math.round((1 - os.freemem() / os.totalmem()) * 100) + '%'
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || 'Unknown',
      loadAvg: os.loadavg()
    },
    // Check any backend dependencies here
    dependencies: {
      backend: await checkBackendHealth()
    }
  };

  return NextResponse.json(healthStatus);
}

/**
 * Check backend API health
 * This is a placeholder that would be implemented with actual backend health check
 */
async function checkBackendHealth(): Promise<{ status: string; message?: string }> {
  try {
    // In a real implementation, we would check the backend API
    // For example:
    // const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/health');
    // if (!response.ok) throw new Error('Backend health check failed');
    
    // For now, just return healthy
    return { status: 'healthy' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
