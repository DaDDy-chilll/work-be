const router = require('express').Router();

const documentController = require('../controllers/document.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const checkFormPermissions = require('../middlewares/checkFormPermissions');

const createDocumentSchema = require('../schema/createDocument.schema');
const formRemarkSchema = require('../schema/formRemark.schema');
const submitDraftSchema = require('../schema/submitDraft.schema');
const updateDocumentSchema = require('../schema/updateDocument.schema');
const deleteDocumentSchema = require('../schema/deleteDocument.schema');

router.get('/', authenticate, documentController.getAllDocuments);

router.get('/me', authenticate, documentController.getMyDocuments);

router.get('/:id', authenticate, documentController.getDocumentById);

router.get('/requested', documentController.getRequestedDocuments);

router.post(
  '/',
  authenticate,
  validate(createDocumentSchema),
  documentController.createDocument
);

// router.patch(
//   '/:id/submit',
//   authenticate,
//   checkFormPermissions('submit'),
//   validate(submitDraftSchema),
//   documentController.submitDraft
// );

// router.patch(
//   '/:id',
//   authenticate,
//   checkFormPermissions('update'),
//   validate(updateDocumentSchema),
//   documentController.updateDocument
// );

// router.delete(
//   '/:id',
//   authenticate,
//   checkFormPermissions('delete'),
//   validate(deleteDocumentSchema),
//   documentController.deleteDocument
// );

// router.patch(
//   '/:id/verify',
//   authenticate,
//   checkFormPermissions('verify'),
//   validate(formRemarkSchema),
//   documentController.verifyDocument
// );

// router.patch(
//   '/:id/approve',
//   authenticate,
//   checkFormPermissions('approve'),
//   validate(formRemarkSchema),
//   documentController.approveDocument
// );

// router.patch(
//   '/:id/reject',
//   authenticate,
//   checkFormPermissions('reject'),
//   validate(formRemarkSchema),
//   documentController.rejectDocument
// );

// router.patch(
//   '/:id/acknowledge',
//   authenticate,
//   checkFormPermissions('acknowledge'),
//   validate(formRemarkSchema),
//   documentController.acknowledgeDocument
// );

module.exports = router;
