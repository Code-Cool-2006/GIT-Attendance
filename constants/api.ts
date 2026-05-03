import Constants from 'expo-constants';

/**
 * Dynamically determines the base URL for API calls.
 * 1. Uses EXPO_PUBLIC_API_URL if defined (recommended for production).
 * 2. In development, attempts to resolve the local machine's IP address.
 * 3. Falls back to an empty string (which defaults to relative paths).
 */
const getBaseUrl = () => {
  // Highest priority: Explicitly defined environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, ''); // Remove trailing slash
  }

  // Development: Try to find the machine's IP to allow physical devices to talk to the local server
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(':')[0];

  if (__DEV__ && localhost) {
    return `http://${localhost}:8081`;
  }

  // Default fallback
  return '';
};

export const BASE_URL = getBaseUrl();

/**
 * A wrapper around fetch that automatically prepends the BASE_URL
 * and adds default headers.
 */
export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    return response;
  } catch (error) {
    console.error(`API Client Error (${url}):`, error);
    throw error;
  }
}
