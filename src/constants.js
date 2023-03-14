module.exports = {
  PORT: process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: process.env.DATABASE_NAME,
  userRoles: Object.freeze({
    executive: 'Executive',
    admin: 'Admin',
    fad: 'FAD',
    dept: 'Dept',
  }),
  paymentType: Object.freeze({
    normal: 'Normal',
    advanced: 'Advanced',
  }),
  documentStatus: Object.freeze({
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    verified: 'Verified',
    drafted: 'Drafted',
  }),
};
