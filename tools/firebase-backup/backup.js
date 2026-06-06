const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with service account
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.error("❌ ERROR: serviceAccountKey.json not found!");
  console.error("Please generate a new private key from Firebase Console -> Project Settings -> Service Accounts");
  console.error("and save it as 'serviceAccountKey.json' in this folder.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backup() {
  console.log("📦 Starting Firestore Backup...");
  const collections = await db.listCollections();
  const backupData = {};

  for (let collection of collections) {
    console.log(`Reading collection: ${collection.id}`);
    const snapshot = await collection.get();
    backupData[collection.id] = {};
    
    snapshot.forEach(doc => {
      backupData[collection.id][doc.id] = doc.data();
    });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `firestore-backup-${timestamp}.json`;
  const backupPath = path.join(__dirname, 'backups', filename);

  if (!fs.existsSync(path.join(__dirname, 'backups'))) {
    fs.mkdirSync(path.join(__dirname, 'backups'));
  }

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`✅ Backup successfully saved to ${backupPath}`);
}

backup().catch(console.error);
