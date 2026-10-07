import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartcity.app',
  appName: 'Smart City',
  webDir: 'dist',
  server: {
    // Uncomment the URL matching your testing device/emulator to enable live reload:
    // url: 'http://10.0.2.2:3000', // For Android Emulator
    // url: 'http://172.30.21.59:3000', // For real device on same Wi-Fi
    // cleartext: true
  }
};

export default config;
