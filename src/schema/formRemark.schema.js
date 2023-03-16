const { isObjectIdOrHexString } = require('mongoose');
const { z } = require('zod');

const formRemarkSchema = z.object({
  body: z.object({
    remark: z.string().default('No remark').optional(),
  }),
  params: z.object({
    id: z.string().refine(isObjectIdOrHexString, 'Invalid document.'),
  }),
});

module.exports = formRemarkSchema;
