const ApiError = require('../helpers/apiError');
const AssigneeGroup = require('../models/assignees-group.model');

const createAssigneesService = () => {
  const _areOrdersDuplicated = (assignees) => {
    const numberOfAssignees = assignees.length;

    for (let i = 0; i < numberOfAssignees; i++) {
      for (let j = i + 1; j < numberOfAssignees; j++) {
        if (assignees[i].order === assignees[j].order) {
          return false;
        }
      }
    }

    return true;
  };

  const getAssigneesGroup = async () => {
    const groups = await AssigneeGroup.find();
    const total = await AssigneeGroup.count();
    return { groups, total };
  };

  const createAssigneeGroup = async (data) => {
    if (_areOrdersDuplicated(data.assignees)) {
      throw ApiError.badRequest('Orders are duplicated.');
    }

    return await AssigneeGroup.create(data);
  };

  return { getAssigneesGroup, createAssigneeGroup };
};

module.exports = createAssigneesService();
