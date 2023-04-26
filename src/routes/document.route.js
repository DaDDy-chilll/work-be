const router = require('express').Router();

const documentController = require('../controllers/document.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');

const createDocumentSchema = require('../schema/createDocument.schema');
const formActionSchema = require('../schema/formAction.schema');
const updateDocumentSchema = require('../schema/updateDocument.schema');
const authorize = require('../middlewares/authorize');
const { userRoles, documentStatus, documentSections } = require('../constants');
const checkPermissions = require('../middlewares/checkFormPermissions');
const { upload } = require('../lib/multer');
const checkParamsId = require('../schema/checkParamsId.schema');
const { DOCUMENT_ACTIONS } = require('../constants/document');
const { USER_ROLES } = require('../constants/user');
const submitFadDocumentSchema = require('../schema/submitFadDocument.schema');
const {
  GET_DOCUMENTS,
  CREATE_DOCUMENT,
  DOCUMENT_ACTION,
  SUBMIT_TO_FAD,
} = require('../schema/document.schema');

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
  function (req, res, next) {
    if (typeof req.body.adminReviewers === 'string') {
      req.body.adminReviewers = JSON.parse(req.body.adminReviewers);
    }
    if (typeof req.body.fadReviewers === 'string') {
      req.body.fadReviewers = JSON.parse(req.body.fadReviewers);
    }

    next();
  },
  validate(CREATE_DOCUMENT),
  documentController.createDocument
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
  validate(formActionSchema),
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
  validate(SUBMIT_TO_FAD),
  authenticate,
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

router.get(
  ['/requested', '/approval-requested'],
  authenticate,
  documentController.getRequestedDocuments
);

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

module.exports = router;
