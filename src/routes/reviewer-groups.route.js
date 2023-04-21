const router = require('express').Router();

const { userRoles } = require('../constants');
const reviewerGroupsController = require('../controllers/reviewer-groups.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const createReviewerSchema = require('../schema/createReviewerGroup');

router.post(
  '/',
  authenticate,
  authorize([userRoles.superadmin]),
  validate(createReviewerSchema),
  reviewerGroupsController.createReviewerGroup
);

router.get('/', authenticate, reviewerGroupsController.getReviewersGroup);

module.exports = router;
