import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.icao900.quiz',
    appName: 'ICAO 900',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
