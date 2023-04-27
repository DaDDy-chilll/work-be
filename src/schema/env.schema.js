const { z } = require('zod');

module.exports = z.object({
  PORT: z.coerce.number().optional(),
  NODE_ENV: z.enum(['local', 'development', 'production'], {
    required_error: 'NODE_ENV is missing.',
  }),
  MONGODB_URI: z.string({
    required_error: 'MONGODB_URI is missing.',
  }),
  DATABASE_NAME: z.string({
    required_error: 'DATABASE_NAME is missing.',
  }),
  JWT_TOKEN_SECRET: z.string({
    required_error: 'JWT_TOKEN_SECRET is missing.',
  }),
  AWS_ACCESS_KEY: z.string({
    required_error: 'AWS_ACCESS_KEY is missing.',
  }),
  AWS_SECRET_KEY: z.string({
    required_error: 'AWS_SECRET_KEY is missing.',
  }),
  AWS_REGION: z.string({
    required_error: 'AWS_REGION is missing.',
  }),
  AWS_S3_BUCKET_NAME: z.string({
    required_error: 'AWS_S3_BUCKET_NAME is missing.',
  }),
});
