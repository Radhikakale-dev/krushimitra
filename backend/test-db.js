import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

console.log('Verifying connection config to MongoDB at:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('SUCCESS: Database Connected Successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('ERROR: Database Connection Failed!');
    console.error(err.message);
    process.exit(1);
  });
