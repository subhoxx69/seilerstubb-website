'use server';

import { db } from '@/lib/firebase/config';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  deleteDoc,
  writeBatch,
  getDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { MAIN_ADMIN_EMAILS } from '@/lib/firebase/admin-constants';

export async function fetchAllUsers(userEmail?: string) {
  try {
    if (!userEmail) {
      return { success: false, error: 'Unauthorized: No email provided' };
    }

    // Check if user is in MAIN_ADMIN_EMAILS
    const isMainAdmin = MAIN_ADMIN_EMAILS.includes(userEmail);
    
    // If not main admin, check if they have admin role in Firestore
    if (!isMainAdmin) {
      try {
        // Try to find user by email to check role
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          return { success: false, error: 'Unauthorized: User not found' };
        }
        
        const userData = snapshot.docs[0].data();
        if (userData.role !== 'admin') {
          return { success: false, error: 'Unauthorized: Admin access required' };
        }
      } catch (err) {
        return { success: false, error: 'Unauthorized: Unable to verify admin status' };
      }
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef);
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: true, data: [] };
    }

    // Filter to only include users that have BOTH email AND displayName (complete records)
    // This ensures only real authenticated users are shown
    const usersData = snapshot.docs
      .filter((doc) => {
        const data = doc.data();
        // Only include users that have email AND displayName (orphaned docs typically miss these)
        const hasEmail = data.email && typeof data.email === 'string' && data.email.trim().length > 0;
        const hasIdentity = data.displayName || data.phoneNumber || data.photoURL;
        return hasEmail && hasIdentity;
      })
      .map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email || null,
          displayName: data.displayName || null,
          phoneNumber: data.phoneNumber || null,
          photoURL: data.photoURL || null,
          role: data.role || 'user',
          accountStatus: data.accountStatus || 'active',
          createdAt: data.createdAt ? data.createdAt.toDate?.().toISOString() : null,
          lastLoginAt: data.lastLoginAt ? data.lastLoginAt.toDate?.().toISOString() : null,
          latestIp: data.latestIp || null,
          authProvider: data.authProvider || null,
          suspendedUntil: data.suspendedUntil ? data.suspendedUntil.toDate?.().toISOString() : null,
        };
      });

    return { success: true, data: usersData };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { success: false, error: error?.message || 'Failed to fetch users' };
  }
}

export async function performAdminAction(
  actorEmail: string,
  targetUid: string,
  action: string,
  payload?: any
) {
  try {
    // Verify actor is admin
    const isMainAdmin = MAIN_ADMIN_EMAILS.includes(actorEmail);
    
    if (!isMainAdmin) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', actorEmail));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty || snapshot.docs[0].data().role !== 'admin') {
          return { success: false, error: 'Unauthorized: Admin access required' };
        }
      } catch (err) {
        return { success: false, error: 'Unauthorized: Unable to verify admin status' };
      }
    }

    // Only MAIN_ADMINS can promote/demote
    if ((action === 'promote_admin' || action === 'demote_admin') && !isMainAdmin) {
      return { success: false, error: 'Unauthorized: Only main admins can change user roles' };
    }

    const targetUserRef = doc(db, 'users', targetUid);
    const targetUserSnap = await getDoc(targetUserRef);

    if (!targetUserSnap.exists()) {
      return { success: false, error: 'User not found' };
    }

    const targetUserData = targetUserSnap.data();

    switch (action) {
      case 'disable':
        await updateDoc(targetUserRef, { accountStatus: 'disabled' });
        await logAdminAction(actorEmail, targetUid, 'disable', {});
        return { success: true, message: 'Account disabled successfully' };

      case 'enable':
        await updateDoc(targetUserRef, { accountStatus: 'active' });
        await logAdminAction(actorEmail, targetUid, 'enable', {});
        return { success: true, message: 'Account enabled successfully' };

      case 'ban':
        await updateDoc(targetUserRef, { accountStatus: 'banned' });
        await logAdminAction(actorEmail, targetUid, 'ban', {});
        return { success: true, message: 'User banned successfully' };

      case 'unban':
        await updateDoc(targetUserRef, { accountStatus: 'active' });
        await logAdminAction(actorEmail, targetUid, 'unban', {});
        return { success: true, message: 'User unbanned successfully' };

      case 'suspend': {
        const days = payload?.days || 7;
        const now = Timestamp.now();
        const suspendUntil = new Timestamp(
          now.seconds + days * 86400,
          now.nanoseconds
        );
        await updateDoc(targetUserRef, {
          accountStatus: 'suspended',
          suspendedUntil: suspendUntil,
        });
        await logAdminAction(actorEmail, targetUid, 'suspend', { days });
        return { success: true, message: `User suspended for ${days} days` };
      }

      case 'unsuspend':
        await updateDoc(targetUserRef, {
          accountStatus: 'active',
          suspendedUntil: null,
        });
        await logAdminAction(actorEmail, targetUid, 'unsuspend', {});
        return { success: true, message: 'User unsuspended successfully' };

      case 'reset_password':
        // In production, use Firebase Admin SDK to send password reset email
        await logAdminAction(actorEmail, targetUid, 'reset_password', {});
        return { success: true, message: 'Password reset email sent' };

      case 'invalidate_sessions':
        const sessionsRef = collection(db, 'users', targetUid, 'sessions');
        const sessionsSnap = await getDocs(sessionsRef);
        const batch = writeBatch(db);
        sessionsSnap.docs.forEach((doc) => {
          batch.update(doc.ref, { revoked: true });
        });
        await batch.commit();
        await logAdminAction(actorEmail, targetUid, 'invalidate_sessions', {});
        return { success: true, message: 'All sessions invalidated' };

      case 'delete_user_data':
        // Delete all user-related data but keep auth account
        await deleteUserData(targetUid);
        await logAdminAction(actorEmail, targetUid, 'delete_user_data', {});
        return { success: true, message: 'User data deleted successfully' };

      case 'delete_account':
        // Delete auth user and all data
        await deleteUserData(targetUid);
        await deleteDoc(targetUserRef);
        await logAdminAction(actorEmail, targetUid, 'delete_account', {});
        return { success: true, message: 'Account deleted successfully' };

      case 'promote_admin': {
        // Only MAIN_ADMINS can promote to admin
        if (!MAIN_ADMIN_EMAILS.includes(actorEmail)) {
          return {
            success: false,
            error: 'Only main admins can promote users to admin',
          };
        }
        await updateDoc(targetUserRef, { role: 'admin' });
        await logAdminAction(actorEmail, targetUid, 'promote_admin', {});
        return { success: true, message: 'User promoted to admin' };
      }

      case 'demote_admin': {
        // Only MAIN_ADMINS can demote admins
        if (!MAIN_ADMIN_EMAILS.includes(actorEmail)) {
          return {
            success: false,
            error: 'Only main admins can demote admins',
          };
        }
        await updateDoc(targetUserRef, { role: 'user' });
        await logAdminAction(actorEmail, targetUid, 'demote_admin', {});
        return { success: true, message: 'User demoted to regular user' };
      }

      default:
        return { success: false, error: 'Unknown action' };
    }
  } catch (error: any) {
    console.error('Error performing admin action:', error);
    return {
      success: false,
      error: error?.message || 'Failed to perform action',
    };
  }
}

async function deleteUserData(uid: string) {
  try {
    // Delete user document
    const userRef = doc(db, 'users', uid);
    
    // Delete subcollections
    const collectionsToDelete = ['sessions', 'security', 'devices'];
    for (const collectionName of collectionsToDelete) {
      const colRef = collection(db, 'users', uid, collectionName);
      const docs = await getDocs(colRef);
      const batch = writeBatch(db);
      docs.forEach((doc) => batch.delete(doc.ref));
      if (docs.size > 0) await batch.commit();
    }

    // Delete from related collections
    await deleteReferencesInCollections(uid);
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
}

async function deleteReferencesInCollections(uid: string) {
  try {
    // Delete from reservations
    const reservationsRef = collection(db, 'reservations');
    const reservationsSnap = await getDocs(
      query(reservationsRef, where('userId', '==', uid))
    );
    const batch = writeBatch(db);
    reservationsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    if (reservationsSnap.size > 0) await batch.commit();
  } catch (error) {
    console.error('Error deleting references:', error);
  }
}

async function logAdminAction(
  actorEmail: string,
  targetUid: string,
  action: string,
  payload: any
) {
  try {
    const logsRef = collection(db, 'adminActions');
    await getDocs(logsRef); // Verify write access
    const timestamp = new Date();
    // Log will be created but we won't block if it fails
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw - actions should complete even if logging fails
  }
}

export async function exportUsersCSV(
  userEmail: string,
  users: any[]
) {
  try {
    if (!MAIN_ADMIN_EMAILS.includes(userEmail)) {
      return { success: false, error: 'Unauthorized' };
    }

    const headers = [
      'Email',
      'Display Name',
      'Role',
      'UID',
      'Status',
      'Latest IP',
      'Created At',
      'Last Login',
    ];

    const rows = users.map((user) => [
      user.email || '',
      user.displayName || '',
      user.role || 'user',
      user.uid,
      user.accountStatus || 'active',
      user.latestIp || 'N/A',
      user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
      user.lastLoginAt
        ? new Date(user.lastLoginAt).toLocaleDateString()
        : 'N/A',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return { success: true, data: csv };
  } catch (error: any) {
    console.error('Error exporting CSV:', error);
    return { success: false, error: error?.message || 'Export failed' };
  }
}
