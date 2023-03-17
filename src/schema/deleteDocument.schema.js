const { isObjectIdOrHexString } = require('mongoose');
const { z } = require('zod');

const deleteDocumentSchema = z.object({
  params: z.object({
    id: z.string().refine(isObjectIdOrHexString),
  }),
});

module.exports = deleteDocumentSchema;
