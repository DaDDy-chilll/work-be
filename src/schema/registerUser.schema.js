const { z } = require('zod');
const { userRoles } = require('../constants');

module.exports = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(8).max(16),
  role: z.enum(
    Object.values(userRoles).filter((value) => value !== 'Superadmin')
  ),
  jobLabel: z.string(),
  permissions: z.object({
    requestForm: z.object({
      read: z.boolean().default(true),
      approve: z.boolean().default(false),
      reject: z.boolean().default(false),
      verify: z.boolean().default(false),
      submit: z.boolean().default(false),
      update: z.boolean().default(false),
      delete: z.boolean().default(false),
    }),
  }),
  approvalAmount: z.number().nonnegative().default(0).optional(),
});
