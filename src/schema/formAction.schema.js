const { isObjectIdOrHexString } = require('mongoose');
const { z } = require('zod');

const formActionSchema = z.object({
  body: z.object({
    remark: z.string().default('No remark'),
    // section: z.enum(Object.values(documentSections), {
    //   errorMap: (_issue, _ctx) => ({ message: 'Invalid action' }),
    // }),
  }),
  params: z.object({
    id: z.string().refine(isObjectIdOrHexString, 'Invalid document.'),
  }),
});

module.exports = formActionSchema;
