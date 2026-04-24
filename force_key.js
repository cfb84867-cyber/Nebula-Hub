const mongoose = require('mongoose');
const AdminKey = require('./models/AdminKey');
require('dotenv').config();

const FORCE_KEY = 'NEBULA-ADMIN-51DAD8DCC6BFA1104EDBB405';

async function forceSeed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nebula-hub');
    console.log('Connected to MongoDB...');

    const keyHash = await AdminKey.hashKey(FORCE_KEY);
    
    // Check if this specific hash already exists
    const allKeys = await AdminKey.find({});
    let exists = false;
    for (const k of allKeys) {
      const match = await require('bcryptjs').compare(FORCE_KEY, k.keyHash);
      if (match) { exists = true; break; }
    }

    if (exists) {
      console.log('✅ Key already exists in database.');
    } else {
      await AdminKey.create({
        keyHash,
        label: 'Forced Master Admin Key',
        role: 'admin',
        isOneTime: false,
      });
      await AdminKey.logToFile(FORCE_KEY, 'Forced Master Admin Key', 'admin');
      console.log('🚀 Key successfully added to database!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

forceSeed();
