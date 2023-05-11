const { describe, it, before, beforeEach } = require('mocha');

const loadDb = require('./setups/load-db');
const Document = require('../models/document.model');

before(async () => {
  await loadDb();
});

describe('Document Endpoints', () => {
  describe('POST /:id/actions/prepare', () => {
    beforeEach(async () => {
      await Document.deleteMany({});
    });

    it('prepares a valid document', () => {});
  });
});
