'use server';

/**
 * Update reservation status
 * Uses API endpoint to avoid Firestore permission issues
 */
export async function updateReservationStatus(
  reservationId: string,
  newStatus: 'confirmed' | 'rejected',
  reason?: string,
  idToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // If idToken not provided, return error
    if (!idToken) {
      console.error('❌ updateReservationStatus: No idToken provided');
      return { success: false, error: 'User not authenticated - no token provided' };
    }

    console.log('📝 updateReservationStatus called with:', {
      reservationId,
      newStatus,
      hasToken: !!idToken,
      tokenLength: idToken?.length || 0,
    });

    // Build full URL for server action context
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/admin/reservation-update`;

    console.log('🌐 Calling API endpoint:', url);

    // Call API endpoint with proper authentication
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        reservationId,
        status: newStatus,
        reason: reason || null,
      }),
    });

    const data = await response.json();

    console.log('📦 API Response:', { status: response.status, success: data.success, error: data.error });

    if (!response.ok) {
      console.error('❌ API Error:', data.error);
      return { success: false, error: data.error || 'Failed to update reservation' };
    }

    console.log('✅ Reservation status updated successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error updating reservation status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * @deprecated Use updateReservationStatus instead
 * Update reservation status and create notification for the owner
 */
export async function updateReservationStatusWithNotification(
  reservationId: string,
  newStatus: 'confirmed' | 'rejected',
  reason?: string,
  idToken?: string
): Promise<{ success: boolean; error?: string }> {
  // Just call the plain version without notifications
  return updateReservationStatus(reservationId, newStatus, reason, idToken);
}

/**
 * Delete reservation
 * Uses API endpoint to avoid Firestore permission issues
 */
export async function deleteReservation(
  reservationId: string,
  idToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // If idToken not provided, return error
    if (!idToken) {
      return { success: false, error: 'User not authenticated' };
    }

    // Build full URL for server action context
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/admin/reservation-delete`;

    // Call API endpoint with proper authentication
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ reservationId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete reservation' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting reservation:', error);
    return { success: false, error: error.message };
  }
}
