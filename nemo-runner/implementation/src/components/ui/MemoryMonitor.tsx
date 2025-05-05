'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '@/lib/game-engine/GameContext';
import { create } from 'zustand';

interface MemoryStats {
  activeMeshes: number;
  pooledMeshes: number;
  totalMeshes: number;
  frameRate: number;
  memoryUsage: number; // From performance.memory if available
  lastFrameTime: number;
}

interface MemoryMonitorState {
  stats: MemoryStats;
  isVisible: boolean;
  historySize: number;
  history: MemoryStats[];
  setStats: (stats: MemoryStats) => void;
  toggleVisibility: () => void;
  setHistorySize: (size: number) => void;
}

// Create a store for memory monitoring stats
const useMemoryStore = create<MemoryMonitorState>((set) => ({
  stats: {
    activeMeshes: 0,
    pooledMeshes: 0,
    totalMeshes: 0,
    frameRate: 0,
    memoryUsage: 0,
    lastFrameTime: 0,
  },
  isVisible: false,
  historySize: 60, // 1 minute at 1 sample per second
  history: [],
  setStats: (stats) => set((state) => {
    const newHistory = [...state.history, stats];
    if (newHistory.length > state.historySize) {
      newHistory.shift(); // Remove oldest entry
    }
    return { stats, history: newHistory };
  }),
  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
  setHistorySize: (size) => set({ historySize: size }),
}));

const MemoryMonitor: React.FC = () => {
  const { stats, isVisible, history, toggleVisibility } = useMemoryStore();
  // These properties don't exist in useGame, would need to pass them as props
  const levelManager = null;
  const obstacleManager = null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastUpdateTime = useRef(0);
  const frameCount = useRef(0);
  const lastFpsUpdate = useRef(0);

  // Update stats
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();

    const updateStats = () => {
      const now = performance.now();
      frameCount.current++;

      // Update FPS every second
      if (now - lastFpsUpdate.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastFpsUpdate.current));
        frameCount.current = 0;
        lastFpsUpdate.current = now;
        
        // Only update stats once per second to avoid overwhelming the UI
        if (now - lastUpdateTime.current > 1000) {
          lastUpdateTime.current = now;
          
          // Get stats from managers if available
          let activeCount = 0;
          let pooledCount = 0;
          
          if (levelManager) {
            const levelStats = levelManager.getMemoryStats?.() || { active: 0, pooled: 0 };
            activeCount += levelStats.active;
            pooledCount += levelStats.pooled;
          }
          
          if (obstacleManager) {
            const obstacleStats = obstacleManager.getMemoryStats?.() || { active: 0, pooled: 0 };
            activeCount += obstacleStats.active;
            pooledCount += obstacleStats.pooled;
          }
          
          // Get memory usage if available (Chrome only)
          const memory = (performance as any).memory?.usedJSHeapSize / 1048576 || 0;
          
          useMemoryStore.setState({
            stats: {
              activeMeshes: activeCount,
              pooledMeshes: pooledCount,
              totalMeshes: activeCount + pooledCount,
              frameRate: fps,
              memoryUsage: memory,
              lastFrameTime: now - lastTime,
            }
          });
        }
      }
      
      lastTime = now;
      frameId = requestAnimationFrame(updateStats);
    };
    
    frameId = requestAnimationFrame(updateStats);
    return () => cancelAnimationFrame(frameId);
  }, [levelManager, obstacleManager]);
  
  // Draw history graph
  useEffect(() => {
    if (!isVisible || !canvasRef.current || history.length < 2) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up graph dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;
    const graphWidth = width - (padding * 2);
    const graphHeight = height - (padding * 2);
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * (graphHeight / 5));
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i * (graphWidth / 5));
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    
    // Find max values for scaling
    const maxMeshes = Math.max(
      ...history.map(h => h.totalMeshes),
      100 // Minimum scale
    );
    const maxFps = Math.max(
      ...history.map(h => h.frameRate),
      60 // Minimum scale
    );
    const maxMemory = Math.max(
      ...history.map(h => h.memoryUsage),
      100 // Minimum scale
    );
    
    // Draw active meshes line
    drawLine(
      ctx, 
      history.map(h => h.activeMeshes), 
      maxMeshes, 
      'rgba(255, 100, 100, 1)',
      padding, graphWidth, height, padding
    );
    
    // Draw pooled meshes line
    drawLine(
      ctx, 
      history.map(h => h.pooledMeshes), 
      maxMeshes, 
      'rgba(100, 100, 255, 1)',
      padding, graphWidth, height, padding
    );
    
    // Draw fps line
    drawLine(
      ctx, 
      history.map(h => h.frameRate), 
      maxFps, 
      'rgba(100, 255, 100, 1)',
      padding, graphWidth, height, padding
    );
    
    // Draw memory usage line
    if (history[0].memoryUsage > 0) {
      drawLine(
        ctx, 
        history.map(h => h.memoryUsage), 
        maxMemory, 
        'rgba(255, 255, 100, 1)',
        padding, graphWidth, height, padding
      );
    }
    
    // Draw legend
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 100, 100, 1)';
    ctx.fillText('Active Meshes', padding, padding - 7);
    
    ctx.fillStyle = 'rgba(100, 100, 255, 1)';
    ctx.fillText('Pooled Meshes', padding + 100, padding - 7);
    
    ctx.fillStyle = 'rgba(100, 255, 100, 1)';
    ctx.fillText('FPS', padding + 200, padding - 7);
    
    if (history[0].memoryUsage > 0) {
      ctx.fillStyle = 'rgba(255, 255, 100, 1)';
      ctx.fillText('Memory (MB)', padding + 250, padding - 7);
    }
    
    // Draw axis labels
    ctx.fillStyle = 'white';
    ctx.fillText(`0`, padding - 15, height - padding + 10);
    ctx.fillText(`${maxMeshes}`, padding - 25, padding + 10);
    ctx.fillText(`${maxFps}`, width - padding + 5, padding + 10);
    
    if (history[0].memoryUsage > 0) {
      ctx.fillText(`${Math.round(maxMemory)}MB`, width - padding + 5, padding + 25);
    }
    
  }, [isVisible, history]);

  // Helper function to draw a line graph
  const drawLine = (
    ctx: CanvasRenderingContext2D,
    data: number[],
    maxValue: number, 
    color: string,
    padding: number,
    graphWidth: number,
    height: number,
    topPadding: number
  ) => {
    const dataPoints = data.length;
    const graphHeight = height - (padding * 2);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < dataPoints; i++) {
      const x = padding + (i / (dataPoints - 1)) * graphWidth;
      const y = topPadding + graphHeight - (data[i] / maxValue) * graphHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  };

  if (!isVisible) {
    return (
      <button 
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded opacity-50 hover:opacity-100 z-50"
      >
        Show Memory Monitor
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-0 right-0 bg-gray-900 text-white p-4 w-80 rounded-tl-lg shadow-lg border border-gray-700 z-50 font-mono text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Memory Monitor</h3>
        <button 
          onClick={toggleVisibility}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4">
        <div>Active Meshes:</div>
        <div className="text-red-400">{stats.activeMeshes}</div>
        
        <div>Pooled Meshes:</div>
        <div className="text-blue-400">{stats.pooledMeshes}</div>
        
        <div>Total Meshes:</div>
        <div>{stats.totalMeshes}</div>
        
        <div>Frame Rate:</div>
        <div className={`${stats.frameRate < 30 ? 'text-red-400' : stats.frameRate < 55 ? 'text-yellow-400' : 'text-green-400'}`}>
          {stats.frameRate} FPS
        </div>
        
        {stats.memoryUsage > 0 && (
          <>
            <div>Memory Usage:</div>
            <div className={`${stats.memoryUsage > 200 ? 'text-red-400' : stats.memoryUsage > 100 ? 'text-yellow-400' : 'text-green-400'}`}>
              {stats.memoryUsage.toFixed(1)} MB
            </div>
          </>
        )}
        
        <div>Frame Time:</div>
        <div className={`${stats.lastFrameTime > 16.7 ? 'text-red-400' : 'text-green-400'}`}>
          {stats.lastFrameTime.toFixed(1)} ms
        </div>
      </div>
      
      <canvas 
        ref={canvasRef}
        width={320}
        height={180}
        className="w-full h-auto border border-gray-700 rounded"
      />
      
      <div className="mt-2 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Time:</span>
          <span>{history.length}s / {useMemoryStore.getState().historySize}s</span>
        </div>
      </div>
    </div>
  );
};

// Create a hook for accessing the memory monitor state
export const useMemoryMonitor = () => useMemoryStore;

export default MemoryMonitor;