const router = require('express').Router();

const docAssigneesGroupsController = require('../controllers/doc-assignees-groups.controller');

router.post('/', (req, res) => {
  res.send('POST /doc-assignees-groups');
});

router.get('/', docAssigneesGroupsController.getAssigneesGroup);

module.exports = router;
