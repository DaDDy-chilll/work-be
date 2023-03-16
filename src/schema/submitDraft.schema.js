const { z } = require('zod');
const { isObjectIdOrHexString } = require('mongoose');

const submitDraftSchema = z.object({
  params: z.object({
    id: z.string().refine(isObjectIdOrHexString),
  }),
});

module.exports = submitDraftSchema;
