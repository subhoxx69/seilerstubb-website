'use server';

import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function adminChangeUserRole(userId: string, newRole: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role: newRole });
    return { success: true, message: 'User role updated' };
  } catch (error) {
    console.error('Error changing user role:', error);
    throw new Error('Failed to change user role');
  }
}

export async function adminDisableAccount(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isDisabled: true, disabledAt: new Date() });
    return { success: true, message: 'Account disabled' };
  } catch (error) {
    console.error('Error disabling account:', error);
    throw new Error('Failed to disable account');
  }
}

export async function adminEnableAccount(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isDisabled: false, disabledAt: null });
    return { success: true, message: 'Account enabled' };
  } catch (error) {
    console.error('Error enabling account:', error);
    throw new Error('Failed to enable account');
  }
}

export async function adminBanUser(userId: string, reason?: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      isBanned: true, 
      bannedAt: new Date(),
      banReason: reason || 'No reason provided'
    });
    return { success: true, message: 'User banned' };
  } catch (error) {
    console.error('Error banning user:', error);
    throw new Error('Failed to ban user');
  }
}

export async function adminUnbanUser(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      isBanned: false, 
      bannedAt: null,
      banReason: null
    });
    return { success: true, message: 'User unbanned' };
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw new Error('Failed to unban user');
  }
}

export async function adminSuspendUser(userId: string, reason?: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      isSuspended: true, 
      suspendedAt: new Date(),
      suspendReason: reason || 'No reason provided'
    });
    return { success: true, message: 'User suspended' };
  } catch (error) {
    console.error('Error suspending user:', error);
    throw new Error('Failed to suspend user');
  }
}

export async function adminUnsuspendUser(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      isSuspended: false, 
      suspendedAt: null,
      suspendReason: null
    });
    return { success: true, message: 'User unsuspended' };
  } catch (error) {
    console.error('Error unsuspending user:', error);
    throw new Error('Failed to unsuspend user');
  }
}

export async function adminInvalidateSessions(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      sessionsInvalidatedAt: new Date()
    });
    return { success: true, message: 'Sessions invalidated' };
  } catch (error) {
    console.error('Error invalidating sessions:', error);
    throw new Error('Failed to invalidate sessions');
  }
}

export async function adminDeleteUserData(userId: string) {
  try {
    const batch = writeBatch(db);
    
    // Delete user reservations
    const reservationsRef = collection(db, 'reservations');
    const reservationsQuery = query(reservationsRef, where('userId', '==', userId));
    const reservationsSnapshot = await getDocs(reservationsQuery);
    reservationsSnapshot.forEach(doc => batch.delete(doc.ref));
    
    // Delete user messages
    const messagesRef = collection(db, 'contacts');
    const messagesQuery = query(messagesRef, where('userId', '==', userId));
    const messagesSnapshot = await getDocs(messagesQuery);
    messagesSnapshot.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    return { success: true, message: 'User data deleted' };
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw new Error('Failed to delete user data');
  }
}

export async function adminDeleteUserAccount(userId: string) {
  try {
    // First delete associated data
    await adminDeleteUserData(userId);
    
    // Then delete the user document
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    
    return { success: true, message: 'User account deleted' };
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw new Error('Failed to delete user account');
  }
}
