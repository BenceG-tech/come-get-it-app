import { Platform } from 'react-native';

type MapComponentsModule = {
  MapView: any;
  Marker: any;
  PROVIDER_DEFAULT: any;
  PROVIDER_GOOGLE: any;
};

let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const mod: MapComponentsModule = Platform.OS === 'web'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./mapComponents.web')
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./mapComponents.native');

  MapView = mod.MapView;
  Marker = mod.Marker;
  PROVIDER_DEFAULT = mod.PROVIDER_DEFAULT;
  PROVIDER_GOOGLE = mod.PROVIDER_GOOGLE;
  console.log('[mapComponents] Loaded module for:', Platform.OS);
} catch (e) {
  console.error('[mapComponents] Failed to load map components:', e);
}

export { MapView, Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE };
