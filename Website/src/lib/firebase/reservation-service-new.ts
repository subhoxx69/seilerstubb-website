import { 
  collection, 
  addDoc, 
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  doc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { getAuth } from 'firebase/auth';

export interface Reservation {
  id?: string;
  name: string;
  email: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
  specialRequests?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Real-time listener for all reservations (admin)
export function subscribeToAllReservations(callback: (items: Reservation[]) => void, onError?: (error: Error) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'reservations'), orderBy('date', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reservation[];
      callback(items);
    }, (error) => {
      console.error('Error in reservations listener:', error);
      if (onError) onError(error as Error);
    });
  } catch (error) {
    console.error('Error setting up reservations listener:', error);
    if (onError) onError(error as Error);
    return () => {};
  }
}

// Real-time listener for user's own reservations
export function subscribeToUserReservations(userEmail: string, callback: (items: Reservation[]) => void, onError?: (error: Error) => void): Unsubscribe {
  try {
    const q = query(
      collection(db, 'reservations'),
      where('email', '==', userEmail),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reservation[];
      callback(items);
    }, (error) => {
      console.error('Error in user reservations listener:', error);
      if (onError) onError(error as Error);
    });
  } catch (error) {
    console.error('Error setting up user reservations listener:', error);
    if (onError) onError(error as Error);
    return () => {};
  }
}

// Create reservation
export async function createReservation(reservation: Reservation): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'reservations'), {
      ...reservation,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Reservation created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating reservation:', error);
    return null;
  }
}

// Get all reservations (admin) - legacy
export async function getAllReservations(): Promise<Reservation[]> {
  try {
    const q = query(
      collection(db, 'reservations'),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reservation[];
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }
}

// Get reservations by email - legacy
export async function getReservationsByEmail(email: string): Promise<Reservation[]> {
  try {
    const q = query(
      collection(db, 'reservations'),
      where('email', '==', email),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reservation[];
  } catch (error) {
    console.error('Error fetching reservations by email:', error);
    return [];
  }
}

// Update reservation status (admin)
export async function updateReservationStatus(
  id: string,
  status: 'confirmed' | 'pending' | 'cancelled'
): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'reservations', id), {
      status,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Reservation status updated:', id, status);
    return true;
  } catch (error) {
    console.error('Error updating reservation:', error);
    return false;
  }
}
