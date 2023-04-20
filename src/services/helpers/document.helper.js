module.exports = {
  getCurrentAssignee: (document, userId) => {
    return document.adminAssignees.find((assignee) =>
      assignee.userId.equals(userId)
    );
  },
};
