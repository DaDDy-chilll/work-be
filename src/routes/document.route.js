const router = require('express').Router();

const documentController = require('../controllers/document.controller');

const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const checkPermissions = require('../middlewares/checkFormPermissions');

const { upload } = require('../lib/multer');

const {
  DOCUMENT_ACTIONS,
  DOCUMENT_STATUSES,
  DOCUMENT_SECTIONS,
} = require('../constants/document');
const { USER_ROLES } = require('../constants/user');

const {
  GET_DOCUMENTS,
  CREATE_DOCUMENT,
  DOCUMENT_ACTION,
  SUBMIT_TO_FAD,
  UPDATE_DOCUMENT,
  DELETE_DOCUMENT,
} = require('../schema/document.schema');
const checkParamsId = require('../schema/checkParamsId.schema');
const parseDocumentPayload = require('../middlewares/parseDocumentPayload');
const checkDocumentAction = require('../middlewares/check-document-action');

router.get(
  '/',
  authenticate,
  authorize([USER_ROLES.superadmin]),
  validate(GET_DOCUMENTS),
  documentController.getAllDocuments
);

router.post(
  '/',
  authenticate,
  upload.array('attachments'),
  parseDocumentPayload,
  validate(CREATE_DOCUMENT),
  documentController.createDocument
);

router.post(
  '/:id/prepare',
  authenticate,
  validate(checkParamsId),
  checkDocumentAction,
  documentController.prepareDocument
);

// TODO: Refactor the routes to be more dynamic
router.patch(
  '/:id/admin-approve',
  authenticate,
  authorize([USER_ROLES.executive, USER_ROLES.superadmin, USER_ROLES.admin]),
  validate(DOCUMENT_ACTION),
  checkPermissions(DOCUMENT_ACTIONS.approve),
  documentController.adminApproveDocument
);

router.patch(
  '/:id/admin-reject',
  authenticate,
  authorize([USER_ROLES.admin, USER_ROLES.executive]),
  validate(DOCUMENT_ACTION),
  checkPermissions(DOCUMENT_ACTIONS.verify),
  documentController.adminVerifyDocument
);

router.patch(
  '/:id/admin-verify',
  authenticate,
  authorize([USER_ROLES.executive, USER_ROLES.superadmin, USER_ROLES.admin]),
  validate(DOCUMENT_ACTION),
  checkPermissions(DOCUMENT_ACTIONS.reject),
  documentController.adminRejectDocument
);

router.patch(
  '/:id/fad-approve',
  authenticate,
  authorize([USER_ROLES.executive, USER_ROLES.fad]),
  validate(DOCUMENT_ACTION),
  checkPermissions(DOCUMENT_ACTIONS.approve),
  documentController.fadApproveDocument
);

router.patch(
  '/:id/fad-verify',
  authenticate,
  authorize([USER_ROLES.executive, USER_ROLES.superadmin, USER_ROLES.fad]),
  validate(DOCUMENT_ACTION),
  checkPermissions(DOCUMENT_ACTIONS.reject),
  documentController.fadVerifyDocument
);

router.patch(
  '/:id/fad-reject',
  authenticate,
  authorize([USER_ROLES.executive, USER_ROLES.fad]),
  validate(DOCUMENT_ACTION),
  checkPermissions(DOCUMENT_ACTIONS.reject),
  documentController.fadRejectDocument
);

router.patch(
  '/:id/comment',
  authenticate,
  authorize([USER_ROLES.executive, USER_ROLES.admin, USER_ROLES.fad]),
  validate(DOCUMENT_ACTION),
  documentController.commentOnDocument
);

router.post(
  '/fad/:id',
  authenticate,
  upload.none(),
  parseDocumentPayload,
  validate(SUBMIT_TO_FAD),
  documentController.submitDocumentToFAD
);

router.get(
  '/me',
  authenticate,
  validate(GET_DOCUMENTS),
  documentController.getMyDocuments
);

router.get('/me/admin', authenticate, (req, res) => {
  const params = new URLSearchParams({
    ...req.query,
    status: DOCUMENT_STATUSES.approved,
    section: DOCUMENT_SECTIONS.admin,
  }).toString();

  res.redirect(`/api/documents/me?${params}`);
});

router.get('/me/fad', authenticate, (req, res) => {
  const params = new URLSearchParams({
    ...req.query,
    status: DOCUMENT_STATUSES.approved,
    section: DOCUMENT_SECTIONS.fad,
  }).toString();

  res.redirect(`/api/documents/me?${params}`);
});

router.get(
  ['/requested', '/approval-requested'],
  authenticate,
  validate(GET_DOCUMENTS),
  documentController.getRequestedDocuments
);

router.get(
  '/fad',
  authenticate,
  authorize([USER_ROLES.superadmin, USER_ROLES.executive, USER_ROLES.fad]),
  validate(GET_DOCUMENTS),
  documentController.getDocumentsInFADSection
);

router.get(
  '/admin',
  authenticate,
  authorize([USER_ROLES.superadmin, USER_ROLES.executive, USER_ROLES.admin]),
  validate(GET_DOCUMENTS),
  documentController.getDocumentsInAdminSection
);

router.get(
  '/admin/approved',
  authenticate,
  authorize([USER_ROLES.superadmin, USER_ROLES.executive, USER_ROLES.admin]),
  validate(GET_DOCUMENTS),
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
  validate(UPDATE_DOCUMENT),
  documentController.updateDocument
);

router.delete(
  '/:id',
  authenticate,
  validate(DELETE_DOCUMENT),
  documentController.deleteDocument
);

module.exports = router;
