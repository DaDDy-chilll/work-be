const router = require('express').Router();

const documentController = require('../controllers/document.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');

const createDocumentSchema = require('../schema/createDocument.schema');
const formActionSchema = require('../schema/formAction.schema');
const updateDocumentSchema = require('../schema/updateDocument.schema');
const deleteDocumentSchema = require('../schema/deleteDocument.schema');
const authorize = require('../middlewares/authorize');
const {
  userRoles,
  documentActions,
  documentStatus,
  documentSections,
} = require('../constants');
const checkPermissions = require('../middlewares/checkFormPermissions');
const { upload } = require('../lib/multer');
const checkParamsId = require('../schema/checkParamsId.schema');

router.get(
  '/',
  authenticate,
  authorize([userRoles.superadmin]),
  documentController.getAllDocuments
);

router.get('/me', authenticate, documentController.getMyDocuments);

router.get('/me/admin', authenticate, (req, res) => {
  const params = new URLSearchParams({
    ...req.query,
    status: documentStatus.approved,
    section: documentSections.admin,
  }).toString();

  res.redirect(`/api/documents/me?${params}`);
});

router.get('/me/fad', authenticate, (req, res) => {
  const params = new URLSearchParams({
    ...req.query,
    status: documentStatus.approved,
    section: documentSections.fad,
  }).toString();

  res.redirect(`/api/documents/me?${params}`);
});

router.get('/requested', documentController.getRequestedDocuments);

router.get(
  '/fad',
  authenticate,
  authorize([userRoles.superadmin, userRoles.executive, userRoles.fad]),
  documentController.getDocumentsInFADSection
);

router.get(
  '/admin',
  authenticate,
  authorize([userRoles.superadmin, userRoles.executive, userRoles.admin]),
  documentController.getDocumentsInAdminSection
);

router.get(
  '/admin/approved',
  authenticate,
  authorize([userRoles.superadmin, userRoles.executive, userRoles.admin]),
  documentController.getAdminApprovedDocuments
);

router.get(
  '/:id',
  validate(checkParamsId),
  authenticate,
  documentController.getDocumentById
);

router.post(
  '/',
  authenticate,
  upload.array('attachments'),
  validate(createDocumentSchema),
  documentController.createDocument
);

router.post(
  '/fad/:id',
  validate(checkParamsId),
  authenticate,
  documentController.submitDocumentToFAD
);

router.patch(
  '/:id',
  authenticate,
  validate(updateDocumentSchema),
  documentController.updateDocument
);

router.delete(
  '/:id',
  authenticate,
  validate(checkParamsId),
  documentController.deleteDocument
);

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
