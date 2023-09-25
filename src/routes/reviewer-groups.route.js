const router = require('express').Router();

const { container } = require('../container');

const authenticate = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const checkParamsId = require('../schema/checkParamsId.schema');
const isSuperadmin = require('../middlewares/is-superadmin');
const {
  CREATE_GROUP,
  UPDATE_GROUP,
  GET_WORKFLOWS,
} = require('../schema/reviewer-group.schema');

router.post(
  '/',
  authenticate,
  isSuperadmin,
  validate(CREATE_GROUP),
  container.resolve('reviewerGroupController').createReviewerGroup
);

router.get(
  '/',
  authenticate,
  validate(GET_WORKFLOWS),
  container.resolve('reviewerGroupController').getReviewersGroup
);

router.get(
  '/approval-eligibility/:dept',
  authenticate,
  container.resolve('reviewerGroupController').getValidReviewerGroups
);

router.get(
  '/:id',
  authenticate,
  validate(checkParamsId),
  container.resolve('reviewerGroupController').getGroupById
);

router.patch(
  '/:id',
  authenticate,
  isSuperadmin,
  validate(UPDATE_GROUP),
  container.resolve('reviewerGroupController').updateReviewerGroup
);

module.exports = router;
