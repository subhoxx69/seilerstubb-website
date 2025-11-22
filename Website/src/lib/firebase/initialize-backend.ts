/**
 * Initialize Firebase Backend
 * This script sets up all necessary data in Firebase
 * 
 * Run this from the browser console or by visiting /setup
 */

export async function initializeBackend() {
  const { getFirestore, doc, setDoc, collection, query, where, getDocs } = await import('firebase/firestore');
  const { getAuth } = await import('firebase/auth');

  const auth = getAuth();
  const db = getFirestore();

  if (!auth.currentUser) {
    throw new Error('You must be logged in to initialize the backend');
  }

  const userId = auth.currentUser.uid;
  const userEmail = auth.currentUser.email;

  console.log('🚀 Starting backend initialization...');
  console.log(`👤 User: ${userEmail}`);

  try {
    // Step 1: Set user as admin
    console.log('📝 Step 1: Setting user as admin...');
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        email: userEmail,
        role: 'admin',
        updatedAt: new Date(),
      },
      { merge: true }
    );
    console.log('✓ User set as admin');

    // Step 2: Create restaurant info
    console.log('📝 Step 2: Creating restaurant info...');
    const restaurantRef = doc(db, 'restaurantInfo', 'info');

    const restaurantData = {
      id: 'info',
      name: 'Seilerstubb',
      address: 'Your Address Here',
      phone: '+41 XX XXX XXXX',
      email: 'info@seilerstubb.com',
      website: 'https://seilerstubb.com',
      aboutUs: 'Welcome to our restaurant!',
      openingHours: {
        monday: {
          shifts: [
            { open: '11:30', close: '14:00' },
            { open: '17:30', close: '22:00' },
          ],
        },
        tuesday: {
          shifts: [
            { open: '11:30', close: '14:00' },
            { open: '17:30', close: '22:00' },
          ],
        },
        wednesday: {
          shifts: [
            { open: '11:30', close: '14:00' },
            { open: '17:30', close: '22:00' },
          ],
        },
        thursday: {
          shifts: [
            { open: '11:30', close: '14:00' },
            { open: '17:30', close: '22:00' },
          ],
        },
        friday: {
          shifts: [
            { open: '11:30', close: '14:00' },
            { open: '17:30', close: '22:00' },
          ],
        },
        saturday: {
          shifts: [{ open: '17:30', close: '23:00' }],
        },
        sunday: {
          isClosed: true,
        },
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        yelp: '',
        youtube: '',
        google: '',
        tiktok: '',
        visiblePlatforms: {
          facebook: false,
          instagram: false,
          twitter: false,
          yelp: false,
          youtube: false,
          google: false,
          tiktok: false,
        },
      },
      areas: {
        indoor: {
          title: 'Innenbereich',
          description: 'Gemütliche Atmosphäre im Restaurant',
          capacity: 60,
        },
        outdoor: {
          title: 'Außenbereich',
          description: 'Schöne Terrasse unter freiem Himmel',
          capacity: 40,
        },
      },
      logoUrl: '',
      bannerUrl: '',
      updatedAt: new Date(),
    };

    await setDoc(restaurantRef, restaurantData);
    console.log('✓ Restaurant info created');

    // Step 3: Verify setup
    console.log('📝 Step 3: Verifying setup...');
    const restaurants = await getDocs(query(collection(db, 'restaurantInfo')));
    const admins = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));

    console.log(`✓ Found ${restaurants.docs.length} restaurant info document(s)`);
    console.log(`✓ Found ${admins.docs.length} admin user(s)`);

    console.log('');
    console.log('✅ Backend initialization completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update Firebase security rules (copy from firebase_rules.txt)');
    console.log('2. Visit /routes/admin/settings to update opening hours');
    console.log('3. Visit /routes/user to see the opening hours displayed');
    console.log('');

    return {
      success: true,
      userId,
      userEmail,
      restaurantCount: restaurants.docs.length,
      adminCount: admins.docs.length,
    };
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    throw error;
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).initializeBackend = initializeBackend;
  console.log('Backend initialization function available as window.initializeBackend()');
}
