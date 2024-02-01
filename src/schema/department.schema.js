const { z } = require('zod');

const GET_DEPARTMENTS = z.object({
  query: z.object({
    sort: z.string().default('-createdAt'),
    limit: z.coerce.number().int().nonnegative().default(10),
    page: z.coerce.number().int().positive(),
  }),
});

export const CREATE_DEPARTMENT = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Department name is required',
        invalid_type_error: 'Department name invalid type.',
      })
      .min(1, 'Department name is required.'),
    type: z
      .enum(['normal', 'authorized'], {
        errorMap: () => ({ message: 'Invalid department type' }),
      })
      .default('normal'),
  }),
});

module.exports = {
  GET_DEPARTMENTS,
  CREATE_DEPARTMENT,
  UPDATE_DEPARTMENT: CREATE_DEPARTMENT,
};
