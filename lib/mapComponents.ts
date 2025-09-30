import { Platform } from 'react-native';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
  } catch (e) {
    console.warn('[MapComponents] Failed to load react-native-maps:', e);
  }
}

export { MapView, Marker, PROVIDER_DEFAULT };
