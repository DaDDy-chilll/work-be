const router = require('express').Router();

const documentController = require('../controllers/document.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');

const createDocumentSchema = require('../schema/createDocument.schema');
const formActionSchema = require('../schema/formAction.schema');
const updateDocumentSchema = require('../schema/updateDocument.schema');
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
const { DOCUMENT_ACTIONS } = require('../constants/document');
const { USER_ROLES } = require('../constants/user');
const submitFadDocumentSchema = require('../schema/submitFadDocument.schema');

router.get(
  '/',
  authenticate,
  authorize([userRoles.superadmin]),
  documentController.getAllDocuments
);

router.post(
  '/',
  authenticate,
  upload.array('attachments'),
  validate(createDocumentSchema),
  documentController.createDocument
);

router.patch(
  '/:id/admin-approve',
  authenticate,
  authorize([USER_ROLES.executive, USER_ROLES.superadmin, USER_ROLES.admin]),
  validate(formActionSchema),
  checkPermissions(DOCUMENT_ACTIONS.approve),
  documentController.adminApproveDocument
);

router.patch(
  '/:id/admin-reject',
  authenticate,
  authorize([USER_ROLES.executive, USER_ROLES.superadmin, USER_ROLES.admin]),
  validate(formActionSchema),
  checkPermissions(DOCUMENT_ACTIONS.reject),
  documentController.adminRejectDocument
);

router.patch(
  '/:id/fad-approve',
  authenticate,
  authorize([USER_ROLES.executive, USER_ROLES.fad]),
  validate(formActionSchema),
  checkPermissions(DOCUMENT_ACTIONS.approve),
  documentController.fadApproveDocument
);

router.patch(
  '/:id/fad-reject',
  authenticate,
  authorize([USER_ROLES.executive, USER_ROLES.fad]),
  validate(formActionSchema),
  checkPermissions(DOCUMENT_ACTIONS.reject),
  documentController.fadRejectDocument
);

router.post(
  '/fad/:id',
  validate(submitFadDocumentSchema),
  authenticate,
  documentController.submitDocumentToFAD
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

/**
 * The routes below are not necesary anymore.
 * Will delete them soon.
 */
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
