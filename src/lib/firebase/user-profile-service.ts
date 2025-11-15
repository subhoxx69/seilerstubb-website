import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, updateDoc, deleteDoc, getDocs, query, where, Timestamp, writeBatch } from 'firebase/firestore';
import { auth } from '@/lib/firebase/config';
import { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  profilePhoto?: string;
  createdAt: any;
  updatedAt: any;
  credentialUpgradeComplete?: boolean;
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    return {
      id: userDoc.id,
      ...userDoc.data(),
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile (name, phone, photo)
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const userRef = doc(db, 'users', userId);
    
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (updates.name) {
      updateData.name = updates.name;
    }
    if (updates.phone) {
      updateData.phone = updates.phone;
    }
    if (updates.profilePhoto) {
      updateData.profilePhoto = updates.profilePhoto;
    }

    await updateDoc(userRef, updateData);

    // Also update Auth profile if name changed
    if (updates.name && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: updates.name,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Update user password (requires reauthentication)
 */
export async function changeUserPassword(currentPassword: string, newPassword: string) {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user logged in');
    }

    // Reauthenticate
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
}

/**
 * Update user email (requires reauthentication)
 */
export async function changeUserEmail(currentPassword: string, newEmail: string) {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user logged in');
    }

    // Reauthenticate
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update email
    await updateEmail(user, newEmail);

    // Update Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      email: newEmail,
      updatedAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error changing email:', error);
    throw error;
  }
}

/**
 * Delete user account (cascade delete all data)
 */
export async function deleteUserAccount(userId: string) {
  try {
    const batch = writeBatch(db);

    // Delete all reservations
    const reservationsSnapshot = await getDocs(
      query(collection(db, 'reservations'), where('userId', '==', userId))
    );
    reservationsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete user profile
    batch.delete(doc(db, 'users', userId));

    // Delete any favorites or other references
    const favoritesSnapshot = await getDocs(
      query(collection(db, 'favorites'), where('userId', '==', userId))
    );
    favoritesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    // Delete auth user
    const user = auth.currentUser;
    if (user) {
      await user.delete();
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}

/**
 * Get user reservations
 */
export async function getUserReservations(userId: string) {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'reservations'),
        where('userId', '==', userId)
      )
    );

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
}

/**
 * Check if user can edit reservation (within 30 minutes)
 */
export function canEditReservation(createdAt: any): boolean {
  const created = createdAt?.toDate?.() || new Date(createdAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
  return diffMinutes <= 30;
}

/**
 * Update reservation with audit trail
 */
export async function updateReservation(
  reservationId: string,
  userId: string,
  updates: any,
  changeReason: string
) {
  try {
    const resRef = doc(db, 'reservations', reservationId);
    const resDoc = await getDoc(resRef);

    if (!resDoc.exists()) {
      throw new Error('Reservation not found');
    }

    const reservation = resDoc.data();
    if (reservation.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Check if within 30 minutes
    if (!canEditReservation(reservation.createdAt)) {
      throw new Error('Cannot edit reservation after 30 minutes');
    }

    // Create audit trail
    const oldValues = {
      date: reservation.date,
      time: reservation.time,
      bereich: reservation.bereich,
      people: reservation.people,
      notes: reservation.notes,
    };

    const auditEntry = {
      timestamp: Timestamp.now(),
      changedBy: userId,
      reason: changeReason,
      oldValues,
      newValues: updates,
    };

    // Update reservation with new values
    await updateDoc(resRef, {
      ...updates,
      updatedAt: Timestamp.now(),
      auditTrail: [...(reservation.auditTrail || []), auditEntry],
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
}
