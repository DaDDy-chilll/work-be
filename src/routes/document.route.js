const router = require('express').Router();

const documentController = require('../controllers/document.controller');

const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const isSuperadmin = require('../middlewares/is-superadmin');

const { upload } = require('../lib/multer');
const { USER_ROLES } = require('../constants/user');

const {
  GET_DOCUMENTS,
  CREATE_DOCUMENT,
  DOCUMENT_ACTION,
  UPDATE_DOCUMENT,
  DELETE_DOCUMENT,
} = require('../schema/document.schema');
const checkParamsId = require('../schema/checkParamsId.schema');
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
  validate(CREATE_DOCUMENT),
  documentController.createDocument
);

router.post(
  '/:id/actions/:action',
  authenticate,
  validate(DOCUMENT_ACTION),
  documentController.invokeDocumentAction
);

router.post('/:id/revisions', authenticate, documentController.requestRevision);

router.patch(
  '/:id/revisions',
  authenticate,
  validate(UPDATE_DOCUMENT),
  checkDocumentAction,
  documentController.reviseDocument
);

router.patch(
  '/:id/comment',
  authenticate,
  authorize([USER_ROLES.executive, USER_ROLES.admin, USER_ROLES.fad]),
  validate(DOCUMENT_ACTION),
  documentController.commentOnDocument
);

router.get('/to-check', authenticate, documentController.getDocumentsToCheck);

router.get(
  '/me',
  authenticate,
  validate(GET_DOCUMENTS),
  documentController.getCurrentUserDocuments
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
