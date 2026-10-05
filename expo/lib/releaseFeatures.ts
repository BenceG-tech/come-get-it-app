/** Unreleased services require a development binary and an explicit local preview flag. */
export function canPreviewUnreleasedFeature(development: boolean, flag: string | undefined): boolean {
  return development && flag === 'true';
}

const development = typeof __DEV__ !== 'undefined' && __DEV__;
export const BANK_PREVIEW_ENABLED = canPreviewUnreleasedFeature(development, process.env.EXPO_PUBLIC_ENABLE_BANK_PREVIEW);
export const COMMUNITY_IMPACT_PREVIEW_ENABLED = canPreviewUnreleasedFeature(development, process.env.EXPO_PUBLIC_ENABLE_CSR_PREVIEW);

export function isBankPreviewMode(mode: unknown): mode is 'mock' | 'sandbox' {
  return mode === 'mock' || mode === 'sandbox';
}
