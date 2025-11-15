// This file handles reservation-related Firebase operations
import { db } from './config';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { Reservation } from '@/types';
import { COLLECTIONS } from './service-utils';

const COLLECTION_NAME = COLLECTIONS.RESERVATIONS;

/**
 * Helper function to format dates from different types
 */
function formatReservationDate(date: any): string {
  if (typeof date === 'object' && date !== null) {
    if ('toDate' in date && typeof date.toDate === 'function') {
      // It's a Firestore Timestamp
      return date.toDate().toLocaleDateString();
    } else if (date instanceof Date) {
      return date.toLocaleDateString();
    }
  }
  // Handle string date
  return new Date(date as string).toLocaleDateString();
}

/**
 * Get all reservations with duplicate removal
 */
export async function getReservations(): Promise<Reservation[]> {
  try {
    const reservationsRef = collection(db, COLLECTION_NAME);
    const q = query(reservationsRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const processedReservations = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to proper date formats if they exist
        date: data.date?.toDate ? data.date.toDate().toISOString().split('T')[0] : data.date,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      } as Reservation;
    });
    
    // Deduplicate by unique identifier
    const uniqueMap = new Map<string, Reservation>();
    
    for (const reservation of processedReservations) {
      const key = `${reservation.userName}-${reservation.date}-${reservation.time}-${reservation.people}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, reservation);
      }
    }
    
    return Array.from(uniqueMap.values());
  } catch (error) {
    console.error('Error getting reservations:', error);
    throw error;
  }
}

/**
 * Get user's reservations
 */
export async function getUserReservations(userId: string): Promise<Reservation[]> {
  try {
    const reservationsRef = collection(db, COLLECTION_NAME);
    const q = query(
      reservationsRef, 
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const processedReservations = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate().toISOString().split('T')[0] : data.date,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      } as Reservation;
    });
    
    // Deduplicate by unique identifier
    const uniqueMap = new Map<string, Reservation>();
    
    for (const reservation of processedReservations) {
      const key = `${reservation.userName}-${reservation.date}-${reservation.time}-${reservation.people}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, reservation);
      }
    }
    
    return Array.from(uniqueMap.values());
  } catch (error) {
    console.error('Error getting user reservations:', error);
    throw error;
  }
}

/**
 * Get a single reservation by ID
 */
export async function getReservation(id: string): Promise<Reservation | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: data.date.toDate().toISOString().split('T')[0], // Convert Timestamp to YYYY-MM-DD
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || null,
    } as Reservation;
  } catch (error) {
    console.error('Error getting reservation:', error);
    throw error;
  }
}

/**
 * Create a new reservation
 */
export async function createReservation(data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    console.log('Creating reservation with data:', JSON.stringify(data));
    console.log('Data types:', {
      userName: typeof data.userName,
      userEmail: typeof data.userEmail,
      userPhone: typeof data.userPhone,
      date: typeof data.date,
      time: typeof data.time,
      people: typeof data.people,
      userId: typeof data.userId
    });
    
    // Enhanced validation for required fields with specific error messages
    const missingFields = [];
    if (!data.userName?.trim()) missingFields.push('name');
    if (!data.userEmail?.trim()) missingFields.push('email');
    if (!data.userPhone?.trim()) missingFields.push('phone');
    if (!data.date) missingFields.push('date');
    if (!data.time) missingFields.push('time');
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required reservation fields: ${missingFields.join(', ')}`);
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.userEmail)) {
      throw new Error('Invalid email format');
    }
    
    // Convert date string to Firestore Timestamp with better error handling
    let dateTimestamp;
    try {
      // Ensure we're working with a string date in YYYY-MM-DD format
      let dateString = data.date;
      if (typeof dateString !== 'string') {
        console.log('Date is not a string, attempting to convert:', dateString);
        dateString = String(dateString);
      }
      
      // Parse the date string to ensure proper format
      const dateParts = dateString.split('-');
      if (dateParts.length !== 3) {
        throw new Error(`Date must be in YYYY-MM-DD format: ${dateString}`);
      }
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // JavaScript months are 0-indexed
      const day = parseInt(dateParts[2], 10);
      
      const dateObj = new Date(year, month, day);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date: ${dateString}`);
      }
      
      // Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateObj < today) {
        throw new Error('Cannot make reservations for past dates');
      }
      
      console.log(`Parsed date: ${dateObj.toISOString()} from ${dateString}`);
      dateTimestamp = Timestamp.fromDate(dateObj);
    } catch (dateError) {
      console.error('Error converting date:', dateError);
      throw new Error(`Invalid date format: ${data.date}`);
    }
    
    // Check if there's already a reservation with the same email, date and time
    // If test mode is enabled, bypass the duplicate check
    const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';
    
    if (!isTestMode) {
      try {
        const reservationsRef = collection(db, COLLECTION_NAME);
        const q = query(
          reservationsRef,
          where('userEmail', '==', data.userEmail),
          where('date', '==', dateTimestamp),
          where('time', '==', data.time),
          where('status', 'in', ['confirmed', 'pending'])
        );
        
        const existingReservations = await getDocs(q);
        if (!existingReservations.empty) {
          console.warn('Duplicate reservation detected but continuing anyway');
          // We're now logging a warning but not throwing an error
          // This allows the reservation to proceed even if it might be a duplicate
        }
      } catch (checkError) {
        console.error('Error checking existing reservations:', checkError);
        // Continue with the reservation creation even if the check fails
      }
    } else {
      console.log('Test mode enabled: Skipping duplicate reservation check');
    }
    
    // Clean the data to remove any undefined or null values
    const cleanedData: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleanedData[key] = value;
      }
    });
    
    // If userId is empty or undefined, remove it completely to avoid Firestore errors
    if (!cleanedData.userId || cleanedData.userId === '') {
      delete cleanedData.userId;
    }
    
    // Create the reservation data with cleaned values
    const reservationData = {
      ...cleanedData,
      date: dateTimestamp,
      status: data.status || 'pending',
      createdAt: serverTimestamp(),
    };
    
    // Debug log to ensure no undefined values
    console.log('Final reservation data:', JSON.stringify(reservationData));
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), reservationData);
    console.log('Reservation created with ID:', docRef.id);
    
    // We no longer send acknowledgment emails for pending reservations
    console.log(`Reservation created with ID ${docRef.id}, no acknowledgment email will be sent`);
    // Emails will only be sent when admin confirms or declines the reservation
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
}

/**
 * Update an existing reservation
 */
export async function updateReservation(id: string, data: Partial<Reservation>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Process date if provided
    const updatedData: any = { ...data, updatedAt: serverTimestamp() };
    if (data.date && typeof data.date === 'string') {
      updatedData.date = Timestamp.fromDate(new Date(data.date));
    }
    
    // Get the reservation before update to have full details for email
    const reservationSnap = await getDoc(docRef);
    if (!reservationSnap.exists()) {
      throw new Error('Reservation not found');
    }
    
    // Update the reservation
    await updateDoc(docRef, updatedData);
    
    // If status is being updated to confirmed or declined, log the appropriate notification
    if (data.status) {
      const currentData = reservationSnap.data() as Reservation;
      const mergedData = { ...currentData, ...data };
      
      // Import dynamically to avoid circular dependencies
      const { sendReservationConfirmation, sendReservationDeclined } = await import('../email-service');
      
      try {
        if (data.status === 'confirmed') {
          // Send confirmation email via EmailJS
          console.log(`Sending confirmation email via EmailJS to ${mergedData.userEmail}`);
          const result = await sendReservationConfirmation({
            userName: mergedData.userName,
            userEmail: mergedData.userEmail,
            date: formatReservationDate(mergedData.date),
            time: mergedData.time,
            people: mergedData.people,
            reservationId: id
          });
          console.log(`EmailJS confirmation result:`, result);
        } else if (data.status === 'declined') {
          // Send declined email via EmailJS
          console.log(`Sending decline email via EmailJS to ${mergedData.userEmail}`);
          const result = await sendReservationDeclined({
            userName: mergedData.userName,
            userEmail: mergedData.userEmail,
            date: formatReservationDate(mergedData.date),
            time: mergedData.time,
            people: mergedData.people,
            reason: data.reasonForDecline || 'Unfortunately, we were unable to accommodate your reservation request.'
          });
          console.log(`EmailJS decline result:`, result);
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Continue even if email fails
      }
    }
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
}

/**
 * Delete a reservation
 */
export async function deleteReservation(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
}

/**
 * Check availability for a specific date and time
 */
export async function checkAvailability(date: string, time: string): Promise<boolean> {
  try {
    // Convert date string to Firestore Timestamp
    const startDate = new Date(date);
    const dateTimestamp = Timestamp.fromDate(startDate);
    
    // Count existing reservations for this date and time that are confirmed or pending
    const reservationsRef = collection(db, COLLECTION_NAME);
    const q = query(
      reservationsRef,
      where('date', '==', dateTimestamp),
      where('time', '==', time),
      where('status', 'in', ['confirmed', 'pending'])
    );
    
    const querySnapshot = await getDocs(q);
    const reservationCount = querySnapshot.size;
    
    // Assuming maximum 20 reservations per timeslot
    // This would be configured based on restaurant capacity
    const MAX_RESERVATIONS_PER_SLOT = 20;
    
    return reservationCount < MAX_RESERVATIONS_PER_SLOT;
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
}
