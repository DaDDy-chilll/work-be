import { z } from 'zod';

export const CREATE_DEPARTMENT = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Department name is required',
      invalid_type_error: 'Department name invalid type.',
    }),
  }),
});

export type CreateDepartmentDTO = z.infer<typeof CREATE_DEPARTMENT.shape.body>;

export const UPDATE_DEPARTMENT = CREATE_DEPARTMENT;

export type UpdateDepartmentDTO = z.infer<typeof UPDATE_DEPARTMENT.shape.body>;
