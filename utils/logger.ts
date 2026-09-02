import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const LOG_FILENAME = 'gaia_logs.txt';
const logFile = new File(Paths.document, LOG_FILENAME);

/**
 * Adds a text entry to the log file with a timestamp.
 * We must use 'await' because these operations are asynchronous.
 */
export const addLog = async (text: string) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${text}\n`;

    let existingLogs = '';

    // 1. Check if the file exists using the property
    if (logFile.exists) {
      // 2. Read the content (await is required because it returns a Promise)
      existingLogs = await logFile.text();
    }

    // 3. Write the combined content back to the file
    // The write method accepts a string and returns a Promise<void>
    await logFile.write(existingLogs + logEntry);

    console.log("📝 Log added:", text);
  } catch (error) {
    console.error("Failed to add log:", error);
  }
};

/**
 * Exports the log file using the native iOS/Android Share Sheet.
 */
export const exportLogs = async () => {
  try {
    if (!logFile.exists) {
      console.log("⚠️ No logs exist to export.");
      return;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(logFile.uri, {
        mimeType: 'text/plain',
        dialogTitle: 'Export App Logs',
        UTI: 'public.plain-text' // iOS specific
      });
    } else {
      console.warn("Sharing is not available on this platform.");
    }
  } catch (error) {
    console.error("Failed to export logs:", error);
  }
};

/**
 * (Optional) Clears the existing log file to free up space.
 */
export const clearLogs = async () => {
  try {
    if (logFile.exists) {
      await logFile.delete();
      console.log("🗑️ Logs cleared.");
    }
  } catch (error) {
    console.error("Failed to clear logs:", error);
  }
};
