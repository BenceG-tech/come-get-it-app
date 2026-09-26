module.exports = function (api) {
  api.cache(true);
  return {
    // Expo SDK 54 currently defaults native Hermes bundles to the newer
    // transform profile, while the bundled RN 0.81 Hermes compiler cannot
    // parse every native #private field emitted by React Native's web APIs.
    // Keep the compatible profile until the runtime is upgraded together.
    presets: [["babel-preset-expo", {
      unstable_transformProfile: "hermes-v0",
      unstable_transformImportMeta: true,
    }]],
  };
};
