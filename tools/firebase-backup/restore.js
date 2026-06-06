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

async function restore() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("❌ ERROR: Please provide the path to the backup JSON file.");
    console.log("Usage: node restore.js ./backups/firestore-backup-YYYY-MM-DD.json");
    process.exit(1);
  }

  const backupPath = path.resolve(args[0]);
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ ERROR: File not found at ${backupPath}`);
    process.exit(1);
  }

  console.log(`📦 Restoring from ${backupPath}...`);
  const rawData = fs.readFileSync(backupPath, 'utf8');
  let backupData;
  try {
    backupData = JSON.parse(rawData);
  } catch(e) {
    console.error("❌ ERROR: Invalid JSON file.");
    process.exit(1);
  }

  const collections = Object.keys(backupData);
  for (let collection of collections) {
    console.log(`Restoring collection: ${collection}`);
    const docs = backupData[collection];
    
    let batch = db.batch();
    let count = 0;

    for (let docId in docs) {
      const docRef = db.collection(collection).doc(docId);
      batch.set(docRef, docs[docId]);
      count++;
      
      // Firestore batch limit is 500
      if (count === 490) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }
    
    if (count > 0) {
      await batch.commit();
    }
  }

  console.log(`✅ Restore completed successfully!`);
}

restore().catch(console.error);
