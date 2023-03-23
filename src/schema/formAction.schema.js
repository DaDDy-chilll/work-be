const { z } = require('zod');
const checkParamsId = require('./checkParamsId.schema');

const formActionSchema = z
  .object({
    body: z.object({
      remark: z.string().default('No remark'),
      // section: z.enum(Object.values(documentSections), {
      //   errorMap: (_issue, _ctx) => ({ message: 'Invalid action' }),
      // }),
    }),
  })
  .merge(checkParamsId);

module.exports = formActionSchema;
