/**
 * Types for the Feature Flags API module
 */

export interface FeatureFlagParams {
  name: string;
}

export interface SetFeatureFlagBody {
  enabled: boolean;
}

export interface SetUserFeatureFlagBody {
  userId: string;
  enabled: boolean;
}

export interface UserFeatureFlagParams {
  name: string;
  userId: string;
}
