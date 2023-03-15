const router = require('express').Router();

const documentController = require('../controllers/document.controller');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const createDocumentSchema = require('../schema/createDocument.schema');

router.get('/', (req, res) => {
  res.send('Get all documents');
});

router.post(
  '/',
  authenticate,
  validate(createDocumentSchema),
  documentController.createDocument,
);

router.patch('/:id', (req, res) => {
  res.send('update a document');
});

router.delete('/:id', (req, res) => {
  res.send('delete a document.');
});

router.get('/me', (req, res) => {
  res.send('Get my documents');
});

router.get('/requested', (req, res) => {
  res.send('get all requested documents(pending, approved, rejected)');
});

router.patch('/:id/verify', (req, res) => {
  res.send('Verify a document');
});

router.patch('/:id/approve', (req, res) => {
  res.send('Approve a document.');
});

router.patch('/:id/reject', (req, res) => {
  res.send('Reject a document');
});

module.exports = router;
