import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.openvidu.ionic',
  appName: 'openvidu-ionic',
  webDir: 'www',
  bundledWebRuntime: false,
  android: {
    includePlugins: ['cordova-plugin-android-permissions'],
    // Allow cleartext traffic for localhost and demo servers
    allowMixedContent: true,
    // Enable WebView debugging
    webContentsDebuggingEnabled: true
  },
  ios: {
    includePlugins: []
  },
  // Server configuration for localhost
  server: {
    // Allow localhost
    androidScheme: 'https',
    // Allow cleartext (HTTP) traffic
    cleartext: true
  }
};

export default config;

