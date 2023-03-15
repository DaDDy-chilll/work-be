const router = require('express').Router();

const documentController = require('../controllers/document.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const checkFormPermissions = require('../middlewares/checkFormPermissions');

const createDocumentSchema = require('../schema/createDocument.schema');
const formRemarkSchema = require('../schema/formRemark.schema');

router.get('/', (req, res) => {
  res.send('Get all documents');
});

router.post(
  '/',
  authenticate,
  checkFormPermissions('submit'),
  validate(createDocumentSchema),
  documentController.createDocument
);

router.patch('/:id', (req, res) => {
  res.send('update a document');
});

router.delete('/:id', (req, res) => {
  res.send('delete a document.');
});

router.get('/me', authenticate, documentController.getMyDocuments);

router.get('/requested', documentController.getRequestedDocuments);

router.patch(
  '/:id/verify',
  authenticate,
  checkFormPermissions('verify'),
  validate(formRemarkSchema),
  documentController.verifyDocument
);

router.patch(
  '/:id/approve',
  authenticate,
  checkFormPermissions('approve'),
  validate(formRemarkSchema),
  documentController.approveDocument
);

router.patch(
  '/:id/reject',
  authenticate,
  checkFormPermissions('reject'),
  validate(formRemarkSchema),
  documentController.rejectDocument
);

router.patch(
  '/:id/acknowledge',
  authenticate,
  checkFormPermissions('acknowledge'),
  validate(formRemarkSchema),
  documentController.acknowledgeDocument
);

module.exports = router;
