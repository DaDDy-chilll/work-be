module.exports = {
  USER_ROLES: Object.freeze({
    superadmin: 'superadmin',
    executive: 'executive',
    admin: 'admin',
    fad: 'fad',
    normal: 'normal',
  }),
  PERMISSIONS: Object.freeze({
    adminSection: ['approve', 'verify', 'reject'],
    fadSection: ['approve', 'reject', 'verify', 'acknowledge'],
  }),
};
