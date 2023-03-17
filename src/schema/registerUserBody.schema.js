const { z } = require('zod');

const { userRoles } = require('../constants');

const registerUserBodySchema = z.object({
  email: z.string().email('Invalid email.'),
  name: z
    .string()
    .min(2, 'Name must have at least 2 characters.')
    .max(50, 'Name can only have 50 characters at most.'),
  password: z
    .string()
    .min(8, 'Password must have at least 8 characters.')
    .max(16, 'Password exceeds a maximum of 16 characters.'),
  role: z.enum(
    Object.values(userRoles).filter((value) => value !== 'Superadmin'),
    {
      errorMap: (_issue, _ctx) => {
        return { message: 'Invalid role.' };
      },
    }
  ),
  jobLabel: z.string({ required_error: 'Job label is required.' }),
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
  approvalAmount: z
    .number()
    .nonnegative('Amount must be greater than zero')
    .default(0)
    .optional(),
});

module.exports = registerUserBodySchema;
