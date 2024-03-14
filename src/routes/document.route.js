const router = require('express').Router();

const { container } = require('../container');

const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');

const { upload } = require('../lib/multer');

const {
  GET_DOCUMENTS,
  CREATE_DOCUMENT,
  DOCUMENT_ACTION,
  UPDATE_DOCUMENT,
  DELETE_DOCUMENT,
  GET_DOCUMENT_FILE,
  MENTION_DOCUMENT,
  INVOKE_RETURN_ACTION,
} = require('../schema/document.schema');
const checkParamsId = require('../schema/checkParamsId.schema');

router.get(
  '/',
  authenticate,
  validate(GET_DOCUMENTS),
  container.resolve('documentController').getAllDocuments
);

router.post(
  '/',
  authenticate,
  upload.array('attachments'),
  validate(CREATE_DOCUMENT),
  container.resolve('documentController').createDocument
);

router.post(
  '/:id/choose-workflow',
  authenticate,
  container.resolve('documentController').chooseWorkflow
);

router.post(
  '/:id/actions/return',
  authenticate,
  upload.array('attachments'),
  validate(INVOKE_RETURN_ACTION),
  container.resolve('documentController').invokeReturnAction
);

router.post(
  '/:id/actions/:action',
  authenticate,
  upload.array('attachments'),
  validate(DOCUMENT_ACTION),
  container.resolve('documentController').invokeDocumentAction
);

router.post(
  '/:id/mention',
  authenticate,
  upload.array('attachments'),
  validate(MENTION_DOCUMENT),
  container.resolve('documentController').mentionDocument
);

router.post(
  '/:id/revisions',
  authenticate,
  container.resolve('documentController').requestRevision
);

router.patch(
  '/:id/revisions',
  authenticate,
  upload.array('attachments'),
  validate(UPDATE_DOCUMENT),
  container.resolve('documentController').reviseDocument
);

router.post(
  '/:documentId/revisions/:revisionId',
  authenticate,
  container.resolve('documentController').acknowledgeRevision
);

router.post(
  '/:id/reject',
  authenticate,
  upload.array('attachments'),
  container.resolve('documentController').rejectDocument
);

router.get(
  '/file/:key/:action',
  validate(GET_DOCUMENT_FILE),
  container.resolve('documentController').getDocumentFile
);

router.get(
  '/to-check',
  authenticate,
  container.resolve('documentController').getDocumentsToCheck
);

router.get(
  '/mention',
  authenticate,
  container.resolve('documentController').getMentionedDocuments
);

router.get(
  '/to-acknowledge',
  authenticate,
  container.resolve('documentController').getDocumentsToAcknowledge
);

router.get(
  '/me',
  authenticate,
  validate(GET_DOCUMENTS),
  container.resolve('documentController').getCurrentUserDocuments
);

router.get(
  '/:id',
  validate(checkParamsId),
  authenticate,
  container.resolve('documentController').getDocumentById
);

router.patch(
  '/:id',
  authenticate,
  upload.array('attachments'),
  validate(UPDATE_DOCUMENT),
  container.resolve('documentController').updateDocument
);

router.delete(
  '/:id',
  authenticate,
  validate(DELETE_DOCUMENT),
  container.resolve('documentController').deleteDocument
);

module.exports = router;
