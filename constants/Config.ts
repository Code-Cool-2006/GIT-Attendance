import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${localhost}:8081/api`;

