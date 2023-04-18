const router = require('express').Router();

const docAssigneesGroupsController = require('../controllers/doc-assignees-groups.controller');
const validate = require('../middlewares/validate');
const createAssigneeSchema = require('../schema/createAssigneesGroup');

router.post(
  '/',
  validate(createAssigneeSchema),
  docAssigneesGroupsController.createAssigneeGroup
);

router.get('/', docAssigneesGroupsController.getAssigneesGroup);

module.exports = router;
