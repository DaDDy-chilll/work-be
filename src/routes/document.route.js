const router = require('express').Router();

const documentController = require('../controllers/document.controller');

const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const isSuperadmin = require('../middlewares/is-superadmin');

const { upload } = require('../lib/multer');

const {
  DOCUMENT_STATUSES,
  DOCUMENT_SECTIONS,
} = require('../constants/document');
const { USER_ROLES } = require('../constants/user');

const {
  GET_DOCUMENTS,
  CREATE_DOCUMENT,
  DOCUMENT_ACTION,
  UPDATE_DOCUMENT,
  DELETE_DOCUMENT,
} = require('../schema/document.schema');
const checkParamsId = require('../schema/checkParamsId.schema');
const parseDocumentPayload = require('../middlewares/parseDocumentPayload');
const checkDocumentAction = require('../middlewares/check-document-action');

router.get(
  '/',
  authenticate,
  isSuperadmin,
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

router.post(
  '/:id/verify',
  authenticate,
  validate(checkParamsId),
  checkDocumentAction,
  documentController.verifyDocument
);

router.post(
  '/:id/approve',
  authenticate,
  // validate(checkParamsId),
  checkDocumentAction,
  documentController.approveDocument
);

router.patch(
  '/:id/comment',
  authenticate,
  authorize([USER_ROLES.executive, USER_ROLES.admin, USER_ROLES.fad]),
  validate(DOCUMENT_ACTION),
  documentController.commentOnDocument
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
