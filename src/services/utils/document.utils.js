module.exports = {
  getCurrentReviewer: (document, userId) => {
    return document.adminReviewers.find((reviewer) =>
      reviewer.userId.equals(userId)
    );
  },
};
