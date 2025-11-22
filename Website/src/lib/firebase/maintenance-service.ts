import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';

export interface MaintenanceStatus {
  enabled: boolean;
  startTime: string;
  estimatedEndTime: string;
  reason: string;
  message: string;
  updatedAt: number;
  updatedBy: string;
}

const MAINTENANCE_DOC = 'maintenance_status';
const MAINTENANCE_COLLECTION = 'system_settings';

/**
 * Get current maintenance status
 */
export async function getMaintenanceStatus(): Promise<MaintenanceStatus | null> {
  try {
    const docRef = doc(db, MAINTENANCE_COLLECTION, MAINTENANCE_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as MaintenanceStatus;
    }

    return null;
  } catch (error) {
    console.error('Error getting maintenance status:', error);
    return null;
  }
}

/**
 * Enable maintenance mode
 */
export async function enableMaintenanceMode(
  reason: string,
  estimatedEndTime: string,
  userEmail: string
): Promise<boolean> {
  try {
    const docRef = doc(db, MAINTENANCE_COLLECTION, MAINTENANCE_DOC);

    const maintenanceData: MaintenanceStatus = {
      enabled: true,
      startTime: new Date().toISOString(),
      estimatedEndTime,
      reason,
      message: `Die Website wird derzeit gewartet. Wir sind bald wieder online. Geschätzter Zeitpunkt: ${estimatedEndTime}`,
      updatedAt: Date.now(),
      updatedBy: userEmail,
    };

    await setDoc(docRef, maintenanceData);
    console.log('✅ Maintenance mode ENABLED');
    return true;
  } catch (error) {
    console.error('Error enabling maintenance mode:', error);
    return false;
  }
}

/**
 * Disable maintenance mode
 */
export async function disableMaintenanceMode(userEmail: string): Promise<boolean> {
  try {
    const docRef = doc(db, MAINTENANCE_COLLECTION, MAINTENANCE_DOC);

    const maintenanceData: MaintenanceStatus = {
      enabled: false,
      startTime: '',
      estimatedEndTime: '',
      reason: '',
      message: '',
      updatedAt: Date.now(),
      updatedBy: userEmail,
    };

    await setDoc(docRef, maintenanceData);
    console.log('✅ Maintenance mode DISABLED');
    return true;
  } catch (error) {
    console.error('Error disabling maintenance mode:', error);
    return false;
  }
}

/**
 * Check if website is in maintenance mode (client-side safe)
 * Returns only necessary information for display
 */
export async function checkMaintenanceMode(): Promise<{
  isUnderMaintenance: boolean;
  message: string;
  estimatedEndTime: string;
} | null> {
  try {
    const status = await getMaintenanceStatus();

    if (status && status.enabled) {
      return {
        isUnderMaintenance: true,
        message: status.message,
        estimatedEndTime: status.estimatedEndTime,
      };
    }

    return {
      isUnderMaintenance: false,
      message: '',
      estimatedEndTime: '',
    };
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    return null;
  }
}
