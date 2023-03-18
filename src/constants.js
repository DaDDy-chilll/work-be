module.exports = {
  PORT: process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: process.env.DATABASE_NAME,
  JWT_TOKEN_SECRET: process.env.JWT_TOKEN_SECRET,
  userRoles: Object.freeze({
    superadmin: 'superadmin',
    executive: 'executive',
    admin: 'admin',
    fad: 'fad',
    normal: 'normal',
  }),
  paymentType: Object.freeze({
    normal: 'normal',
    advanced: 'advanced',
  }),
  documentStatus: Object.freeze({
    drafted: 'drafted',
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    verified: 'verified',
    acknowledged: 'acknowledged',
  }),
  documentRemarkActions: Object.freeze({
    approved: 'approved',
    verified: 'verified',
    rejected: 'rejected',
    acknowledged: 'acknowledged',
  }),
  documentSections: {
    admin: 'admin',
    fad: 'fad',
  },
  permissions: Object.freeze({
    adminSection: ['approve', 'verify', 'reject'],
    fadSection: ['approve', 'reject', 'verify', 'acknowledge'],
  }),
  RESERVED_QUERY_WORDS: Object.freeze(['page', 'sort']),
};
