const router = require('express').Router();

const documentController = require('../controllers/document.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const checkFormPermissions = require('../middlewares/checkFormPermissions');

const createDocumentSchema = require('../schema/createDocument.schema');
const formActionSchema = require('../schema/formAction.schema');
const submitDraftSchema = require('../schema/submitDraft.schema');
const updateDocumentSchema = require('../schema/updateDocument.schema');
const deleteDocumentSchema = require('../schema/deleteDocument.schema');
const authorize = require('../middlewares/authorize');
const { userRoles, documentActions } = require('../constants');
const checkPermissions = require('../middlewares/checkFormPermissions');

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

router.post('/fad/:id', authenticate, documentController.submitDocumentToFAD);

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

router.patch(
  '/:id/verify',
  authenticate,
  authorize([
    userRoles.executive,
    userRoles.superadmin,
    userRoles.fad,
    userRoles.admin,
  ]),
  validate(formActionSchema),
  checkPermissions(documentActions.verify),
  documentController.verifyDocument
);

router.patch(
  '/:id/approve',
  authenticate,
  authorize([
    userRoles.executive,
    userRoles.superadmin,
    userRoles.fad,
    userRoles.admin,
  ]),
  validate(formActionSchema),
  checkPermissions(documentActions.approve),
  documentController.approveDocument
);

router.patch(
  '/:id/reject',
  authenticate,
  authorize([
    userRoles.executive,
    userRoles.superadmin,
    userRoles.fad,
    userRoles.admin,
  ]),
  validate(formActionSchema),
  documentController.rejectDocument
);

router.patch(
  '/:id/acknowledge',
  authenticate,
  authorize([userRoles.executive, userRoles.superadmin, userRoles.fad]),
  validate(formActionSchema),
  documentController.acknowledgeDocument
);

module.exports = router;
