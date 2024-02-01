const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const loadDb = require('./utils/load-db');

const api = request(app);

let mongodb;

describe('Departments API', () => {
  beforeAll(async () => {
    mongodb = await loadDb();
  });

  afterAll(async () => {
    if (mongodb) {
      await mongodb.stop();
    }
  });

  describe('POST /departments', () => {
    it('Creates a department', async () => {
      const result = await api.post('/api/departments').send({
        name: 'Testing',
        type: 'normal',
      });
      expect(result.status).toBe(200);
    });
  });
});
