const ApiError = require('../helpers/apiError');
const AssigneeGroup = require('../models/assignees-group.model');

const createAssigneesService = () => {
  const _areOrdersDuplicated = (assignees) => {
    const numberOfAssignees = assignees.length;

    for (let i = 0; i < numberOfAssignees; i++) {
      for (let j = i + 1; j < numberOfAssignees; j++) {
        if (assignees[i].order === assignees[j].order) {
          return true;
        }
      }
    }

    return false;
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

  const getAssigneeGroupById = async (id) => {
    return await AssigneeGroup.findById(id);
  };

  return { getAssigneesGroup, createAssigneeGroup, getAssigneeGroupById };
};

module.exports = createAssigneesService();
