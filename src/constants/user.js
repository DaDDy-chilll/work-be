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
  AUTHORIZED_DEPARTMENTS: Object.freeze({
    OFFICE_ADMIN: 'OFFICE_ADMIN',
    CLINICAL_ADMIN: 'CLINICAL_ADMIN',
    BOM: 'BOM',
    FAD: 'FAD',
  }),
  DEPARTMENT_LEVES: Object.freeze({
    OFFICE_ADMIN: 0,
    CLINICAL_ADMIN: 1,
    BOM: 2,
    FAD: 3,
  }),
};
