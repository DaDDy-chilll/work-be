const ApiError = require('../helpers/apiError');
const AssigneeGroup = require('../models/assignees-group.model');

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

    return await AssigneeGroup.create(data);
  };

  return { getAssigneesGroup, createAssigneeGroup };
};

module.exports = createDocumentAssigneesService();
