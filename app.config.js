// Takes everything from app.json. Only for the Expo Go upload ("Schule", see tools/schule-hochladen.mjs)
// the runtime version is changed: Expo Go only loads updates labelled with its SDK version.
const { version } = require('expo/package.json');

module.exports = ({ config }) => {
  if (process.env.ECHOES_EXPO_GO !== '1') return config;
  return { ...config, runtimeVersion: `exposdk:${version.split('.')[0]}.0.0` };
};
