import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect('mongodb://localhost:27017/krushimitra');

// Update ALL users to admin role (for initial setup)
const result = await mongoose.connection.db.collection('users').updateMany(
  {},
  { $set: { role: 'admin' } }
);
console.log('Updated:', result.modifiedCount, 'user(s) to admin role');

// Show all users
const users = await mongoose.connection.db.collection('users').find(
  {}, 
  { projection: { name: 1, email: 1, role: 1 } }
).toArray();
console.log('Users in database:');
users.forEach(u => console.log(` - ${u.name} (${u.email}) → role: ${u.role}`));

await mongoose.disconnect();
console.log('Done!');
