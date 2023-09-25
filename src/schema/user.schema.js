const { z } = require('zod');
const { isObjectIdOrHexString } = require('mongoose');

const BASE_USER = z.object({
  body: z.object({
    email: z.string().email('Invalid email.'),
    name: z
      .string()
      .min(2, 'Name must have at least 2 characters.')
      .max(50, 'Name can only have 50 characters at most.'),
    password: z
      .string()
      .min(8, 'Password must have at least 8 characters.')
      .max(16, 'Password exceeds a maximum of 16 characters.'),
    jobLabel: z.string({ required_error: 'Job label is required.' }),
    department: z
      .string({ required_error: 'Department is required.' })
      .refine(isObjectIdOrHexString, 'Invalid department.'),
    permissions: z
      .object({
        canApprove: z.boolean().optional().default(false),
        canEdit: z.boolean().optional().default(false),
        canPrepare: z.boolean().optional().default(false),
        canVerify: z.boolean().optional().default(false),
        canEditAmount: z.boolean().optional().default(false),
      })
      .optional(),
  }),
});

const REGISTER_USER = z.object({
  body: BASE_USER.shape.body.strict(),
});

const LOGIN = z.object({
  body: BASE_USER.shape.body.pick({
    email: true,
    password: true,
  }),
});

const UPDATE_USER = z.object({
  body: BASE_USER.shape.body
    .pick({
      name: true,
      email: true,
      jobLabel: true,
      department: false,
      permissions: true,
    })
    .deepPartial(),

  params: z.object({
    id: z.string().refine(isObjectIdOrHexString),
  }),
});

const UPDATE_PASSWORD = z.object({
  body: z
    .object({
      userId: z
        .string()
        .refine(isObjectIdOrHexString, 'User ID must be an object id'),
      password: z
        .string()
        .min(8, 'Password must have at least 8 characters.')
        .max(16, 'Password exceeds a maximum of 16 characters.'),
      confirmPassword: z.string().min(1, 'Please confirm password'),
    })
    .refine(
      ({ password, confirmPassword }) => password === confirmPassword,
      'Passwords do not match'
    ),
});

const GET_USERS = z.object({
  query: z
    .object({
      sort: z.string().default('-createdAt'),
      limit: z.coerce.number().int().nonnegative().default(10),
      name: z.string().optional(),
      department: z.string().refine(isObjectIdOrHexString).optional(),
      page: z.coerce.number().int().positive().default(1),
      search: z.string().optional(),
    })
    .strict(),
});

module.exports = {
  REGISTER_USER,
  LOGIN,
  UPDATE_USER,
  UPDATE_PASSWORD,
  GET_USERS,
};
