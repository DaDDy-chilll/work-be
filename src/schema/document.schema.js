const { z } = require('zod');
const xss = require('xss');
const { DOCUMENT_STATUSES, DOCUMENT_TYPES } = require('../constants/document');
const { isObjectIdOrHexString } = require('mongoose');
const checkParamsId = require('./checkParamsId.schema');

const BASE_DOCUMENT = z.object({
  name: z.string().min(1, 'Name must have at least 2 characters.'),
  type: z.enum(Object.values(DOCUMENT_TYPES), {
    errorMap: (_issue, _ctx) => {
      return { message: 'Invalid document type.' };
    },
  }),

  amount: z.coerce.number().nonnegative('Invalid amount').optional(),
  description: z.string().transform(xss).optional(),
  originalDocumentId: z.string().refine(isObjectIdOrHexString).optional(),
  workflowId: z.string().refine(isObjectIdOrHexString),
});

const GET_DOCUMENTS = z.object({
  query: z
    .object({
      sort: z.string().default('-createdAt'),
      limit: z.coerce
        .number({ invalid_type_error: '`limit` must be number' })
        .int('`limit` must be positive integer.')
        .nonnegative('`limit` must be positive integer.')
        .default(10),
      page: z.coerce.number().positive().default(1),
      status: z
        .enum(Object.values(DOCUMENT_STATUSES))
        .or(z.array(z.enum(Object.values(DOCUMENT_STATUSES))))
        .or(z.string())
        .optional(),
      amount: z.coerce.number().nonnegative().optional(),
      amountMin: z.coerce.number().nonnegative().optional(),
      amountMax: z.coerce.number().nonnegative().optional(),
      requestedBy: z.string().refine(isObjectIdOrHexString).optional(),
      currentReviewer: z.string().refine(isObjectIdOrHexString).optional(),
      caseStatus: z.enum(['open', 'closed', '']).or(z.string()).optional(),
      type: z.string().optional(),
      search: z.string().optional(),
      department: z
        .string()
        .refine(isObjectIdOrHexString)
        .or(
          z
            .string()
            .array()
            .refine((v) => v.every(isObjectIdOrHexString))
        )
        .optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    })
    .strict()
    .refine(({ amountMin, amountMax }) => {
      if (amountMin && amountMax) {
        return amountMin <= amountMax;
      }
      return true;
    }),
});

const GET_DOCUMENT_FILE = z.object({
  params: z.object({
    key: z.string(),
    action: z.string(),
  }),
});

const CREATE_DOCUMENT = z.object({
  body: BASE_DOCUMENT.omit({ type: true, amount: true }).strict(),
});

const DELETE_DOCUMENT = checkParamsId;

const UPDATE_DOCUMENT = z
  .object({
    body: z.object({
      name: z.string().min(2, 'Name must have at least 2 characters.'),
      amount: z.coerce.number().nonnegative('Invalid amount'),
      description: z.string().transform(xss).optional(),
    }),
  })
  .merge(checkParamsId);

const DOCUMENT_ACTION = z.object({
  body: z
    .object({
      workflowId: z
        .string()
        .refine(isObjectIdOrHexString, 'Invalid Workflow ID.'),
      name: z.string().min(2, 'Name must have at least 2 characters.'),
      amount: z.coerce.number().nonnegative('Invalid amount').optional(),
      type: z
        .enum(Object.values(DOCUMENT_TYPES), {
          errorMap: (_issue, _ctx) => {
            return { message: 'Invalid document type.' };
          },
        })
        .optional(),
      description: z.string().transform(xss).optional(),
      remark: z.string().transform(xss),
    })
    .partial(),
  params: z.object({
    id: z.string().refine(isObjectIdOrHexString, 'Invalid ID.'),
    action: z.enum(['prepare', 'verify', 'approve', 'comment', 'forward'], {
      errorMap: () => ({ message: 'Invalid action.' }),
    }),
  }),
});

module.exports = {
  GET_DOCUMENTS,
  GET_DOCUMENT_FILE,
  CREATE_DOCUMENT,
  DELETE_DOCUMENT,
  DOCUMENT_ACTION,
  UPDATE_DOCUMENT,
};
