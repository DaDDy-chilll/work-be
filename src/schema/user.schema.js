const { z } = require('zod');
const checkParamsId = require('./checkParamsId.schema');

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
    department: z.string({ required_error: 'Department is required.' }),
    permissions: z.object({
      canApprove: z.boolean().optional().default(true),

      canEdit: z.boolean().optional().default(true),
      canPrepare: z.boolean().optional().default(true),
    }),
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
  body: BASE_USER.shape.body.pick({
    email: true,
    jobLabel: true,
    department: true,
  }),
});

const UPDATE_PASSWORD = z
  .object({
    body: BASE_USER.shape.body.pick({
      password: true,
    }),
  })
  .merge(checkParamsId);

const GET_USERS = z.object({
  query: z
    .object({
      sort: z.string().default('-createdAt'),
      limit: z.coerce.number().int().positive().default(10),
      name: z.string(),
      department: z.string(),
      page: z.coerce.number().int().positive().default(1),
    })
    .partial()
    .strict(),
});

module.exports = {
  REGISTER_USER,
  LOGIN,
  UPDATE_USER,
  UPDATE_PASSWORD,
  GET_USERS,
};
