import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.openvidu.ionic',
  appName: 'openvidu-ionic-capacitor',
  webDir: 'www',
  bundledWebRuntime: false,
  android: {
    includePlugins: ['cordova-plugin-android-permissions']
  },
  ios: {
    includePlugins: []
  }
};

export default config;
