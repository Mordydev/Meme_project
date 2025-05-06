import React, { useState, useEffect } from 'react';
import { AudioManager, AudioSettings } from '../../game/core/AudioManager';
import { EventSystem } from '../../game/core/EventSystem';
import styles from '../../styles/GameUI.module.css';

/**
 * Audio controls component for user adjustments of game audio
 */
const AudioControls: React.FC = () => {
  // State for audio settings
  const [settings, setSettings] = useState<AudioSettings>({
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true
  });
  
  // State for UI display
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get references to singletons
  const audioManager = AudioManager.getInstance();
  const eventSystem = EventSystem.getInstance();
  
  // Initialize settings from AudioManager on component mount
  useEffect(() => {
    const initialSettings = audioManager.getSettings();
    setSettings(initialSettings);
    
    // Listen for settings changes from other parts of the app
    const handleSettingsChange = (updatedSettings: AudioSettings) => {
      setSettings(updatedSettings);
    };
    
    eventSystem.on('audio-settings-changed', handleSettingsChange);
    
    return () => {
      eventSystem.off('audio-settings-changed', handleSettingsChange);
    };
  }, []);
  
  // Handle toggle changes
  const handleToggleChange = (settingKey: 'musicEnabled' | 'sfxEnabled') => {
    const newSettings = {
      ...settings,
      [settingKey]: !settings[settingKey]
    };
    
    setSettings(newSettings);
    audioManager.updateSettings(newSettings);
  };
  
  // Handle slider changes
  const handleVolumeChange = (
    settingKey: 'masterVolume' | 'musicVolume' | 'sfxVolume',
    value: string
  ) => {
    const newSettings = {
      ...settings,
      [settingKey]: parseFloat(value)
    };
    
    setSettings(newSettings);
    audioManager.updateSettings(newSettings);
  };
  
  // Toggle expanded state for controls
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className={styles.audioControls}>
      {/* Audio icon button to toggle expanded state */}
      <button 
        className={styles.audioToggle}
        onClick={toggleExpanded}
        aria-label="Audio settings"
      >
        {/* Use appropriate icon based on state */}
        {settings.masterVolume === 0 ? (
          <span className={styles.audioIcon}>🔇</span>
        ) : settings.masterVolume < 0.3 ? (
          <span className={styles.audioIcon}>🔈</span>
        ) : settings.masterVolume < 0.7 ? (
          <span className={styles.audioIcon}>🔉</span>
        ) : (
          <span className={styles.audioIcon}>🔊</span>
        )}
      </button>
      
      {/* Expanded controls panel */}
      {isExpanded && (
        <div className={styles.audioPanel}>
          <h3>Audio Settings</h3>
          
          {/* Master volume */}
          <div className={styles.sliderContainer}>
            <label htmlFor="master-volume">Master Volume</label>
            <input
              id="master-volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.masterVolume}
              onChange={(e) => handleVolumeChange('masterVolume', e.target.value)}
              className={styles.volumeSlider}
            />
            <span>{Math.round(settings.masterVolume * 100)}%</span>
          </div>
          
          {/* Music controls */}
          <div className={styles.audioControl}>
            <div className={styles.controlHeader}>
              <h4>Music</h4>
              <button
                className={`${styles.toggleButton} ${settings.musicEnabled ? styles.enabled : styles.disabled}`}
                onClick={() => handleToggleChange('musicEnabled')}
                aria-label={settings.musicEnabled ? 'Disable music' : 'Enable music'}
              >
                {settings.musicEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.musicVolume}
                onChange={(e) => handleVolumeChange('musicVolume', e.target.value)}
                className={styles.volumeSlider}
                disabled={!settings.musicEnabled}
              />
              <span>{Math.round(settings.musicVolume * 100)}%</span>
            </div>
          </div>
          
          {/* Sound effects controls */}
          <div className={styles.audioControl}>
            <div className={styles.controlHeader}>
              <h4>Sound Effects</h4>
              <button
                className={`${styles.toggleButton} ${settings.sfxEnabled ? styles.enabled : styles.disabled}`}
                onClick={() => handleToggleChange('sfxEnabled')}
                aria-label={settings.sfxEnabled ? 'Disable sound effects' : 'Enable sound effects'}
              >
                {settings.sfxEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.sfxVolume}
                onChange={(e) => handleVolumeChange('sfxVolume', e.target.value)}
                className={styles.volumeSlider}
                disabled={!settings.sfxEnabled}
              />
              <span>{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
          </div>
          
          {/* Close button */}
          <button 
            className={styles.closeButton}
            onClick={toggleExpanded}
            aria-label="Close audio settings"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioControls;