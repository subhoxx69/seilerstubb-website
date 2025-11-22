// Client-side scripts
if (typeof window !== 'undefined') {
  // Initialize EmailJS with public key
  try {
    if (window.emailjs) {
      console.log('Initializing EmailJS...');
      window.emailjs.init('RYn_M6v88btpYZ5w6');
      console.log('EmailJS initialized successfully');
    } else {
      console.error('EmailJS not found on window object');
    }
  } catch (error) {
    console.error('Error initializing EmailJS:', error);
  }
}
