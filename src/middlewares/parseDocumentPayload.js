/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
module.exports = (req, res, next) => {
  if (typeof req.body.adminReviewers === 'string') {
    req.body.adminReviewers = JSON.parse(req.body.adminReviewers);
  }
  next();
};
