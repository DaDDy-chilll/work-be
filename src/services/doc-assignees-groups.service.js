const { userRoles } = require('../constants');
const ApiError = require('../helpers/apiError');
const AssigneeGroup = require('../models/assignees-group.model');
const User = require('../models/user.model');

const createDocumentAssigneesService = () => {
  const getAssigneesGroup = async () => {
    const groups = await AssigneeGroup.find();
    const total = await AssigneeGroup.count();
    return { groups, total };
  };

  const createAssigneeGroup = async (data) => {
    const numberOfAssignees = data.assignees.length;

    for (let i = 0; i < numberOfAssignees; i++) {
      for (let j = i + 1; j < numberOfAssignees; j++) {
        if (data.assignees[i].order === data.assignees[j].order) {
          throw ApiError.badRequest('Order is duplicated.');
        }
      }
    }

    await Promise.all(
      data.assignees.map(async (item) => {
        const user = await User.findById(item.person);

        if (
          !user ||
          ![
            userRoles.superadmin,
            userRoles.admin,
            userRoles.executive,
          ].includes(user.role)
        ) {
          throw ApiError.badRequest('User not eligible to be an assignee.');
        }

        return user;
      })
    );

    return await AssigneeGroup.create(data);
  };

  return { getAssigneesGroup, createAssigneeGroup };
};

module.exports = createDocumentAssigneesService();
