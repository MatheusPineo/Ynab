import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ynab.app',
  appName: 'Vault Finance OS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*']
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '285793186636-n535672dqu974h5hisrced9rdmp4idmm.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
