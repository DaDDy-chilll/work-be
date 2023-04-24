const router = require('express').Router();

const { userRoles } = require('../constants');
const { USER_ROLES } = require('../constants/user');
const reviewerGroupsController = require('../controllers/reviewer-groups.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const createReviewerSchema = require('../schema/createReviewerGroup');
const updateReviewerGroupSchema = require('../schema/updateReviewerGroupSchema');

router.post(
  '/',
  authenticate,
  authorize([userRoles.superadmin]),
  validate(createReviewerSchema),
  reviewerGroupsController.createReviewerGroup
);

router.get('/', authenticate, reviewerGroupsController.getReviewersGroup);

router.patch(
  '/:id',
  authenticate,
  authorize([USER_ROLES.superadmin]),
  validate(updateReviewerGroupSchema),
  reviewerGroupsController.updateReviewerGroup
);

module.exports = router;
