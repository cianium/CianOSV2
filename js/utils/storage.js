/**
 * CianOS Ultra V3 - Isolated Local Storage Persistence Manager
 */

const STORAGE_KEY = "CIANOS_ULTRA_V3_CORE_STATE";

export const StorageManager = {
    /**
     * Retrieves the structural state payload from localStorage.
     * Safely parses JSON configurations and returns null if corrupt or non-existent.
     * @returns {Object|null}
     */
    loadState() {
        try {
            const rawData = localStorage.getItem(STORAGE_KEY);
            if (!rawData) {
                return null;
            }
            const parsedData = JSON.parse(rawData);
            if (parsedData && typeof parsedData === 'object') {
                return parsedData;
            }
            return null;
        } catch (error) {
            console.error("SYS-CRITICAL [StorageManager.loadState]: Structural state read failure. Data corrupt.", error);
            return null;
        }
    },

    /**
     * Serializes and writes a deep data state payload directly to browser storage.
     * @param {Object} freshState 
     * @returns {boolean} True if data operation was successfully committed.
     */
    saveState(freshState) {
        if (!freshState || typeof freshState !== 'object') {
            console.error("SYS-ERR [StorageManager.saveState]: Attempted serialization of an illegal state reference.");
            return false;
        }
        try {
            const serializedPayload = JSON.stringify(freshState);
            localStorage.setItem(STORAGE_KEY, serializedPayload);
            return true;
        } catch (error) {
            console.error("SYS-CRITICAL [StorageManager.saveState]: Transaction write-lock disk failure. Quota exceeded?", error);
            return false;
        }
    },

    /**
     * Clears all system application entries entirely from local tracking storage.
     */
    clearAll() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (error) {
            console.error("SYS-ERR [StorageManager.clearAll]: Disk entry removal failure.", error);
            return false;
        }
    }
};
