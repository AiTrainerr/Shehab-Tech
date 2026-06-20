import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shehabtech.app',
  appName: 'Shehab Tech',
  webDir: 'public',
  bundledWebRuntime: false,
  server: {
    url: 'https://shehab-tech.com',
    cleartext: true
  }
};

export default config;
