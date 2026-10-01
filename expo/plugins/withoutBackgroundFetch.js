// expo-task-manager always adds the "fetch" background mode. The app only uses region monitoring
// (the "location" mode), and App Review expects every declared background mode to be used.
const { withInfoPlist } = require('expo/config-plugins');

module.exports = function withoutBackgroundFetch(config) {
  return withInfoPlist(config, (cfg) => {
    const modes = cfg.modResults.UIBackgroundModes;
    if (Array.isArray(modes)) {
      cfg.modResults.UIBackgroundModes = modes.filter((mode) => mode !== 'fetch');
    }
    return cfg;
  });
};
