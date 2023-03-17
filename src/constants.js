module.exports = {
  PORT: process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: process.env.DATABASE_NAME,
  JWT_TOKEN_SECRET: process.env.JWT_TOKEN_SECRET,
  userRoles: Object.freeze({
    superadmin: 'Superadmin',
    executive: 'Executive',
    admin: 'Admin',
    fad: 'FAD',
    normal: 'Normal',
  }),
  paymentType: Object.freeze({
    normal: 'Normal',
    advanced: 'Advanced',
  }),
  documentStatus: Object.freeze({
    drafted: 'Drafted',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    verified: 'Verified',
    acknowledged: 'Acknowledged',
  }),
  documentRemarkActions: Object.freeze({
    approve: 'Approve',
    verify: 'Verify',
    reject: 'Reject',
    acknowledge: 'Acknowledge',
  }),
  documentSections: {
    admin: 'Admin',
    fad: 'FAD',
  },
  permissions: Object.freeze({
    adminSection: ['approve', 'verify', 'reject'],
    fadSection: ['approve', 'reject', 'verify', 'acknowledge'],
  }),
  RESERVED_QUERY_WORDS: Object.freeze(['page', 'sort']),
};
