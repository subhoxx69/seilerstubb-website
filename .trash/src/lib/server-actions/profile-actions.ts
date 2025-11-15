'use server';

interface UpdateProfileInput {
  name?: string;
  phone?: string;
  profilePhoto?: string;
}

/**
 * Update user profile (name, phone, photo)
 */
export async function updateUserProfile(userId: string, data: UpdateProfileInput) {
  try {
    if (!userId) throw new Error('User ID required');

    // Validate inputs
    if (data.name && data.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (data.phone && !/^[\d\s\-\+\(\)]+$/.test(data.phone)) {
      throw new Error('Invalid phone format');
    }

    // Call Firestore endpoint to update
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/users/${userId}.json`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          updatedAt: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    return { success: true, message: 'Profile updated successfully' };
  } catch (error: any) {
    console.error('Profile update error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  try {
    if (!userId) throw new Error('User ID required');

    // Fetch from Firestore via endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/users/${userId}.json`
    );

    if (!response.ok) {
      throw new Error('User profile not found');
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    throw new Error(error.message || 'Failed to fetch profile');
  }
}

/**
 * Get user reservations
 */
export async function getUserReservations(userId: string) {
  try {
    if (!userId) throw new Error('User ID required');

    // Query reservations via Firestore endpoint
    // This requires a proper Firestore API endpoint or Cloud Function
    
    return {
      success: true,
      data: [],
    };
  } catch (error: any) {
    console.error('Reservations fetch error:', error);
    throw new Error(error.message || 'Failed to fetch reservations');
  }
}
