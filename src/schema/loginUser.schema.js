const { z } = require('zod');

const loginUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email.'),
    password: z
      .string()
      .min(8, 'Password must have at least 8 characters.')
      .max(16, 'Password exceeds a maximum of 16 characters.'),
  }),
});

module.exports = loginUserSchema;
