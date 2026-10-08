import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { createActivityTracker } from '@/lib/activityTracker';
import { postAuthenticatedFunction } from '@/lib/edgeRequest';

export const userActivity = createActivityTracker((owner, event) =>
  postAuthenticatedFunction('log-user-activity', {
    ...event,
    device_info: Platform.OS,
    app_version: Constants.expoConfig?.version ?? 'unknown',
  }, 4_000, owner));
