const { z } = require('zod');
const { userRoles } = require('../constants');

module.exports = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  username: z.string().min(2).max(50),
  password: z.string().min(8).max(16),
  role: z.enum(Object.values(userRoles)),
  jobLabel: z.string(),
  permissions: z.object({
    requestForm: z.object({
      read: z.boolean().default(true).optional(),
      approve: z.boolean().default(false).optional(),
      reject: z.boolean().default(false).optional(),
      verify: z.boolean().default(false).optional(),
      submit: z.boolean().default(false).optional(),
      update: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
    }),
  }),
  approvalAmount: z.number().positive(),
});
