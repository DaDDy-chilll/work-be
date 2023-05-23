import ApiError from '../helpers/apiError';
import extractQuery from '../helpers/extractQuery';
import type { Department } from '../models/department.model';
import type { CreateDepartmentDTO } from '../schema/department.schema';

interface Dependencies {
  Department: typeof Department;
}

export const createDepartmentService = ({ Department }: Dependencies) => {
  return Object.freeze({
    createDepartment: async (body: CreateDepartmentDTO) => {
      const existingDepartment = await Department.findOne({ name: body.name });

      if (existingDepartment) {
        throw ApiError.badRequest(
          `${existingDepartment.name} alreadly exists.`
        );
      }

      const department = await Department.create(body);

      return department;
    },

    getDepartments: async (query: Record<string, string | number>) => {
      const { sort, limit, skip, filter } = extractQuery(
        query,
        (filter: Record<string, string | number>) => filter
      );

      const [departments, total] = await Promise.all([
        Department.find(filter).sort(sort).skip(skip).limit(limit),
        Department.count(filter),
      ]);

      return { departments, total };
    },

    getStartingDepartment: async () => {
      return await Department.findOne({ isStartingDepartment: true });
    },
  });
};

export type TDepartmentService = ReturnType<typeof createDepartmentService>;
