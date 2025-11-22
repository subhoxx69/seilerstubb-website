const admin = require('firebase-admin');

// Initialize Firebase with credentials from environment variables
const serviceAccount = {
  type: 'service_account',
  project_id: 'seilerstubb-6731f',
  private_key_id: '1b239659ce7e633b9f80640d63f31926e7c79290',
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC75PM98Nh+1uCD\nEiVBv+P/VVjkBVOLNvormTVG2JVPi1sxwOOOLC7Ui6bjVJ/ShHBCc5WWC40Nb0WH\n54dfU/aLiedwx0RRzZRHFuDfINwyqqDv2AIwvlsR0nZVD3O9MebdKFbaQGFcoLKC\najQFjNgxgyYwouk9hNQ96XsMdysOhc5kQrASI9lZP/VKLjSzXgLmx4sMpAoqqnsW\nQGeQPw/XPw7RvWleguuAMof/+zXQQA8id86XMYFiS5PZj1l/uEeYVpHNjTL7Xr+I\n0MKmRssZtbbn/THNGGtdH72ouo4/bWIzigHSSP6oP1c+/sjkfMWPFnJeT+VTSYdY\nBc64xV3HAgMBAAECggEAE8uQptdvb5mCyLxKKY2mXxmmRkubXCDcJWi8OK0Lufgk\nEO9R6gIUovbdi7i4J80lKJMV0NuBrkcpS6KkW/I0GMpcFEEiHP4sH3s1ELzdBgd8\n8hfPT0RWwt9p8RcyKd4OhQFBeTfsKf6SH/RBa85FXp4DEX+wU/dhBu7ItGz/n8Vh\nsUmkMxXj9gx33L3V18BUphSHVPu7M1cLKlebla9HoNTg2iMkRAU3mtc48Bnz/blS\nyJnoQupR4LWxg2WI2/66IrEz5VWhfKpgC8ugZZRTdIYgxU14L7OiT2VPtGtv9YXl\nGZ2HHvq3qDqIxrtRoRuTXux4SVFssDamb3DbFXdtNQKBgQDvD35jNte0Vu6llHnh\nJzPXswYYcOwbhMQ6Fa4sU+vupTN8nfbPkl0LGS23mQoyebDgEG5NowEwBqnSyQh6\njgxGGwxcM9S86rZbyThH/oxDe7ZNGHeQu57xij+94tG6R7P4i1lidz7L/1bhwbOw\nGcraP08H38WLapgKKONrTm4gRQKBgQDJNVAZvLlRHV48cLu9GnE7JhFL/epQO5cA\nRQF3RXzit1Z12ylN1rJzTOd+gUU2S1TvaV2U3vWAnKArjBEHop61cmnoPMRQYjIf\ntI8JLC3NPD2LPQVS3a8pz1RhhMvph5IpcFQKgjfMQR8l0a18jQckX6KqJTHnNI80\nntsbO4fEmwKBgDIUW9Sq63sS7wFu3i1lif24uiEqnruRD45fdlJA7l7a6rNDYC3R\nqn4lsycP/0vdpEj8CC9pY1lNPAw1IvqRgU66Ydd64CkHPlZyC8FBON72LpVt97Yx\nJ7XP0VSVDHxqgvAhOQNgmZ4ginHWoy7T6GPZ+VNb9EUlel4+fI3BK17FAoGAItPn\nmYzhRvkeZrfcx07carCcLds1w82Mxa8sIckVZOj3Pk9BRwfyu6KEL5GQuWUwvoAu\ngqZVOH3j+6WzDO9JKX80dc6O7JsSsgo++Ad9phjXTlKxqTZWK5aHtJmX8kRVOHcJ\nFQiVP/XFvnYc4YJHyjQDpA/sI2kloKYepwgW6CECgYBJXoYDJ2CgoOzcwes2EzW8\nk0T0jwVEyQnNuNdiMj3kiR1gWL4wtUadceyCZwDXx601tkxvBuLY4UYZ/c3JEPNJ\nBgNVBuh99NNFOhn3RfjTJbbGALzqk6ty7rbOj5UHcgdIeqMgAe51TJlE0Kfv19FB\nD/2MqTls1R8xFJEn3Y02fw==\n-----END PRIVATE KEY-----\n",
  client_email: 'firebase-adminsdk-fbsvc@seilerstubb-6731f.iam.gserviceaccount.com',
  client_id: '111608460237837100871',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40seilerstubb-6731f.iam.gserviceaccount.com'
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'seilerstubb-6731f'
});

const db = admin.firestore();

async function getReservations() {
  try {
    console.log('\n📊 FETCHING RESERVATIONS FROM FIRESTORE DATABASE\n');
    console.log('Project: seilerstubb-6731f');
    console.log('Collection: /reservations\n');
    
    const snapshot = await db.collection('reservations').get();
    
    if (snapshot.empty) {
      console.log('❌ No reservations found in the database');
      process.exit(0);
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} reservation(s) in database\n`);
    console.log('='.repeat(140));
    
    let count = 0;
    snapshot.forEach((doc) => {
      count++;
      const data = doc.data();
      console.log(`\n📌 RESERVATION #${count}`);
      console.log(`   Document ID: ${doc.id}`);
      console.log('─'.repeat(140));
      console.log(JSON.stringify(data, null, 2));
      console.log('─'.repeat(140));
    });
    
    console.log(`\n✅ TOTAL: ${snapshot.size} reservation(s) retrieved successfully`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fetching reservations:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

getReservations();
