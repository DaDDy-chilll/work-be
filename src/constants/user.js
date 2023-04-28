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
  DEPARTMENTS: Object.freeze({
    OTHER: 'OTHER',
    OFFICE_ADMIN: 'OFFICE_ADMIN',
    CLINICAL_ADMIN: 'CLINICAL_ADMIN',
    BOM: 'BOM',
    FAD: 'FAD',
  }),
};
