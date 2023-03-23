const { isObjectIdOrHexString } = require('mongoose');
const { z } = require('zod');

const checkParamsId = z.object({
  params: z.object({
    id: z.string().refine(isObjectIdOrHexString, 'Invalid Entity ID.'),
  }),
});

module.exports = checkParamsId;
