const { z } = require('zod');

const formRemarkSchema = z.object({
  remark: z.string().default('No remark').optional(),
});

module.exports = formRemarkSchema;
