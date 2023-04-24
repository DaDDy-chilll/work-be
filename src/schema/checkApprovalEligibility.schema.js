const { isObjectIdOrHexString } = require('mongoose');
const { z } = require('zod');

const checkApprovalEligibility = z.object({
  body: z.object({
    reviewers: z.string().refine(isObjectIdOrHexString, 'Invalid ID').array(),
  }),
  params: {
    dept: z.enum(['admin', 'fad']),
  },
});

module.exports = checkApprovalEligibility;
