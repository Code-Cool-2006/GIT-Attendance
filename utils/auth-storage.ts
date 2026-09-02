import { File, Paths } from 'expo-file-system';

const AUTH_FILENAME = 'auth_state.json';
const authFile = new File(Paths.document, AUTH_FILENAME);

export const saveAuthState = async (isLoggedIn: boolean) => {
  try {
    await authFile.write(JSON.stringify({ isLoggedIn }));
  } catch (e) {
    console.error('Error saving auth state:', e);
  }
};

export const getAuthState = async (): Promise<boolean> => {
  try {
    if (!authFile.exists) return false;
    
    const content = await authFile.text();
    const data = JSON.parse(content);
    return !!data.isLoggedIn;
  } catch (e) {
    console.error('Error getting auth state:', e);
    return false;
  }
};

export const clearAuthState = async () => {
  try {
    if (authFile.exists) {
      await authFile.delete();
    }
  } catch (e) {
    console.error('Error clearing auth state:', e);
  }
};
