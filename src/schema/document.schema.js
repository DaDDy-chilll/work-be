const { z } = require('zod');
const xss = require('xss');
const { DOCUMENT_STATUSES, DOCUMENT_TYPES } = require('../constants/document');
const { isObjectIdOrHexString } = require('mongoose');
const checkParamsId = require('./checkParamsId.schema');

const BASE_DOCUMENT = z.object({
  name: z
    .string()
    .min(2, 'Name must have at least 2 characters.')
    .max(50, 'Name must have at most 50 characters.'),
  type: z
    .enum(Object.values(DOCUMENT_TYPES), {
      errorMap: (_issue, _ctx) => {
        return { message: 'Invalid document type.' };
      },
    })
    .default(DOCUMENT_TYPES.EXPENSE),
  amount: z.coerce.number().positive('Invalid amount'),
  description: z.string().transform(xss).optional(),
  originalDocumentId: z.string().refine(isObjectIdOrHexString).optional(),
});

const GET_DOCUMENTS = z.object({
  query: z
    .object({
      sort: z.string().default('-createdAt'),
      limit: z.coerce
        .number({ invalid_type_error: '`limit` must be number' })
        .int('`limit` must be positive integer.')
        .positive('`limit` must be positive integer.')
        .default(10),
      status: z
        .enum(Object.values(DOCUMENT_STATUSES))
        .or(z.array(z.enum(Object.values(DOCUMENT_STATUSES))))
        .or(z.string()),
      amount: z.coerce.number().nonnegative(),
      amountMin: z.coerce.number().nonnegative(),
      amountMax: z.coerce.number().nonnegative(),
      requestedBy: z.string().refine(isObjectIdOrHexString),
      currentReviewer: z.string().refine(isObjectIdOrHexString),
      caseStatus: z.enum(['open', 'closed', '']).or(z.string()),
      type: z.string(),
    })
    .partial()
    .strict()
    .refine(({ amountMin, amountMax }) => {
      if (amountMin && amountMax) {
        return amountMin <= amountMax;
      }
      return true;
    }),
});

const CREATE_DOCUMENT = z.object({
  body: BASE_DOCUMENT.strict(),
});

const DELETE_DOCUMENT = checkParamsId;

const SUBMIT_TO_FAD = z.object({
  body: CREATE_DOCUMENT.shape.body
    .pick({
      name: true,
      amount: true,
      description: true,
    })
    .merge(
      z.object({
        fadReviewers: z
          .object({
            user: z.string().refine(isObjectIdOrHexString, 'Invalid user ID.'),
            order: z.coerce
              .number()
              .int()
              .nonnegative('Must be a positive order.'),
          })
          .array(),
      })
    )
    .strict(),
});

const UPDATE_DOCUMENT = z
  .object({
    body: z.object({
      name: z
        .string()
        .min(2, 'Name must have at least 2 characters.')
        .max(50, 'Name must have at most 50 characters.'),
      amount: z.coerce.number().positive('Invalid amount'),
      description: z.string().transform(xss).optional(),
    }),
  })
  .merge(checkParamsId);

const DOCUMENT_ACTION = z.object({
  body: z
    .object({
      groupId: z.string().refine(isObjectIdOrHexString, 'Invalid Group ID.'),
      name: z
        .string()
        .min(2, 'Name must have at least 2 characters.')
        .max(50, 'Name must have at most 50 characters.'),
      amount: z.coerce.number().positive('Invalid amount'),
      description: z.string().transform(xss).optional(),
      remark: z.string().transform(xss),
    })
    .partial(),
  params: z.object({
    id: z.string().refine(isObjectIdOrHexString, 'Invalid ID.'),
    action: z.enum(['prepare', 'verify', 'approve', 'comment'], {
      errorMap: () => ({ message: 'Invalid action.' }),
    }),
  }),
});

module.exports = {
  GET_DOCUMENTS,
  CREATE_DOCUMENT,
  DELETE_DOCUMENT,
  DOCUMENT_ACTION,
  SUBMIT_TO_FAD,
  UPDATE_DOCUMENT,
};
