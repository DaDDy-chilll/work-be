module.exports = function (req, res, next) {
  if (typeof req.body.adminReviewers === 'string') {
    req.body.adminReviewers = JSON.parse(req.body.adminReviewers);
  }
  if (typeof req.body.fadReviewers === 'string') {
    req.body.fadReviewers = JSON.parse(req.body.fadReviewers);
  }

  next();
};
