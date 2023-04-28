const router = require('express').Router();

const reviewerGroupsController = require('../controllers/reviewer-groups.controller');
const authenticate = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const checkParamsId = require('../schema/checkParamsId.schema');
const createReviewerSchema = require('../schema/createReviewerGroup');
const updateReviewerGroupSchema = require('../schema/updateReviewerGroupSchema');
const isSuperadmin = require('../middlewares/is-superadmin');

router.post(
  '/',
  authenticate,
  isSuperadmin,
  validate(createReviewerSchema),
  reviewerGroupsController.createReviewerGroup
);

router.get('/', authenticate, reviewerGroupsController.getReviewersGroup);

router.get(
  '/approval-eligibility/:dept',
  authenticate,
  reviewerGroupsController.getValidReviewerGroups
);

router.get(
  '/:id',
  authenticate,
  validate(checkParamsId),
  reviewerGroupsController.getGroupById
);

router.patch(
  '/:id',
  authenticate,
  isSuperadmin,
  validate(updateReviewerGroupSchema),
  reviewerGroupsController.updateReviewerGroup
);

module.exports = router;
