const { z } = require('zod');

const { userRoles } = require('../constants');

module.exports = (schema, ctx) => {
  if (schema.role === userRoles.superadmin) {
    return true;
  }

  const hasAdminPermissions =
    schema.permissions.adminSection &&
    Object.values(schema.permissions.adminSection).some((action) => action);

  const hasFADPermissions =
    schema.permissions.fadSection &&
    Object.values(schema.permissions.fadSection).some((action) => action);

  if (
    schema.role === userRoles.normal &&
    (hasAdminPermissions || hasFADPermissions)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Normal user should not be given admin privileges.',
    });
  }

  if (
    schema.role === userRoles.admin &&
    schema.permissions.fadSection &&
    Object.values(schema.permissions.fadSection).some((action) => action)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Admin should not be given FAD privileges.',
    });
  }

  if (
    schema.role === userRoles.fad &&
    schema.permissions.adminSection &&
    Object.values(schema.permissions.adminSection).some((action) => action)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'FAD should not be given Admin privileges.',
    });
  }
};
