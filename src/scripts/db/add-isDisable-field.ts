import dotenv from 'dotenv';

dotenv.config();

import connectDb from './connectDb';
import User from '../../models/user.model';

const DB_NAME = process.env.DATABASE_NAME as string;
const DB_URI = process.env.MONGODB_URI as string;

connectDb({ dbUri: DB_URI, dbName: DB_NAME }, async () => {
  await User.updateMany({ isDisabled: false });

  console.log('DONE');
});
