const { z } = require('zod');

const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(16),
});

module.exports = loginUserSchema;
