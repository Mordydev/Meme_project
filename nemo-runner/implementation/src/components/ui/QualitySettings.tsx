'use client';

import React, { useEffect, useState } from 'react';
import { useQualityStore, QualityLevel, DeviceCapability, initializeQuality } from '@/lib/game-engine/QualityManager';

interface QualityOptionProps {
  label: string;
  value: QualityLevel;
  onChange: (level: QualityLevel) => void;
}

const QualityOption: React.FC<QualityOptionProps> = ({ label, value, onChange }) => {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <label className="text-white text-sm font-medium">{label}</label>
        <span className="text-gray-300 text-xs">
          {QualityLevel[value].toLowerCase()}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={QualityLevel.LOW}
          max={QualityLevel.HIGH}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) as QualityLevel)}
          className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};

const QualitySettings: React.FC<{ isVisible: boolean; onClose: () => void }> = ({ 
  isVisible, 
  onClose 
}) => {
  const { 
    settings, 
    autoAdapt, 
    targetFrameRate,
    detectedCapability, 
    setQuality, 
    setAllQuality,
    setAutoAdapt,
    setTargetFrameRate
  } = useQualityStore();
  
  const [expanded, setExpanded] = useState(false);
  
  // Initialize quality settings on first render
  useEffect(() => {
    initializeQuality();
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        
        <h2 className="text-xl font-bold text-white mb-4">Quality Settings</h2>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-sm font-medium">Auto-Adjust Quality</label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoAdapt}
                onChange={(e) => setAutoAdapt(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer 
                peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-0 
                peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          
          <div className="mb-4">
            <label className="text-white text-sm font-medium block mb-1">Detected Device Capability</label>
            <div className="p-2 bg-gray-700 rounded text-white text-sm">
              {DeviceCapability[detectedCapability].replace('_', ' ')}
            </div>
          </div>
          
          {!autoAdapt && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-white text-sm font-medium">Overall Quality</label>
                <div className="flex space-x-2">
                  {[QualityLevel.LOW, QualityLevel.MEDIUM, QualityLevel.HIGH].map((level) => (
                    <button
                      key={level}
                      onClick={() => setAllQuality(level)}
                      className={`px-3 py-1 text-xs rounded ${
                        Object.values(settings).every(val => val === level)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {QualityLevel[level]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {autoAdapt && (
            <div className="mb-4">
              <label className="text-white text-sm font-medium block mb-1">Target Frame Rate</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min={30}
                  max={120}
                  step={5}
                  value={targetFrameRate}
                  onChange={(e) => setTargetFrameRate(parseInt(e.target.value))}
                  className="flex-grow h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
                />
                <span className="text-white text-sm w-10 text-right">{targetFrameRate}</span>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-blue-400 text-sm mb-4"
          >
            <span>{expanded ? 'Hide Advanced Settings' : 'Show Advanced Settings'}</span>
            <svg
              className={`ml-1 w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          
          {expanded && !autoAdapt && (
            <div className="overflow-y-auto max-h-60 pr-2 -mr-2">
              <QualityOption
                label="Particle Density"
                value={settings.particleDensity}
                onChange={(level) => setQuality('particleDensity', level)}
              />
              <QualityOption
                label="View Distance"
                value={settings.viewDistance}
                onChange={(level) => setQuality('viewDistance', level)}
              />
              <QualityOption
                label="Shadow Quality"
                value={settings.shadowQuality}
                onChange={(level) => setQuality('shadowQuality', level)}
              />
              <QualityOption
                label="Geometry Detail"
                value={settings.geometryDetail}
                onChange={(level) => setQuality('geometryDetail', level)}
              />
              <QualityOption
                label="Texture Quality"
                value={settings.textureQuality}
                onChange={(level) => setQuality('textureQuality', level)}
              />
              <QualityOption
                label="Visual Effects"
                value={settings.postProcessing}
                onChange={(level) => setQuality('postProcessing', level)}
              />
              <QualityOption
                label="Obstacle Density"
                value={settings.obstacleCount}
                onChange={(level) => setQuality('obstacleCount', level)}
              />
              <QualityOption
                label="Object Culling"
                value={settings.cullDistance}
                onChange={(level) => setQuality('cullDistance', level)}
              />
              <QualityOption
                label="Memory Usage"
                value={settings.poolSize}
                onChange={(level) => setQuality('poolSize', level)}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-between pt-3 border-t border-gray-700">
          <button
            onClick={() => {
              initializeQuality();
            }}
            className="text-sm px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Reset to Auto-Detected
          </button>
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualitySettings;