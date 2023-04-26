const { z } = require('zod');

const getDocument = z.object({
  query: z
    .object({
      sort: z.string().default('-createdAt'),
      limit: z.coerce
        .number({ invalid_type_error: '`limit` must be number' })
        .int('`limit` must be positive integer.')
        .positive('`limit` must be positive integer.')
        .default(10),
      status: z.string(),
    })
    .partial(),
});
