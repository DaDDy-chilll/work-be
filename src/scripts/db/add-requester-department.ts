import dotenv from 'dotenv';

dotenv.config();

import connectDb from './connectDb';
import User from '../../models/user.model';
import Document from '../../models/document.model';

const DB_NAME = process.env.DATABASE_NAME as string;
const DB_URI = process.env.MONGODB_URI as string;

connectDb({ dbUri: DB_URI, dbName: DB_NAME }, async () => {
  const documents = await Document.find();

  await Promise.all(
    documents.map(async (d) => {
      const requester = await User.findById(d.requester);

      return Document.findByIdAndUpdate(d._id, {
        requestedByDepartment: requester?.department,
      });
    })
  );

  console.log('DONE');
});
