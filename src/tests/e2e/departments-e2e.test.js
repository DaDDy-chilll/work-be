const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const loadDb = require('../utils/load-db');
const seedDb = require('../utils/seed-db');
const { container } = require('../../container');
const {
  SUPERADMIN_EMAIL,
  SUPERADMIN_PASSWORD,
} = require('../constants/superadmin-credentials.constant');

const api = request(app);

/**
 * @type {import('mongodb-memory-server').MongoMemoryServer}
 */
let mongodb;

let superadminAccessToken;

describe('Departments API', () => {
  beforeAll(async () => {
    mongodb = await loadDb();
    await seedDb();
    /**
     * @type {ReturnType<import('../../services/auth.service')>} AuthService
     */
    const authService = container.resolve('authService');
    const { accessToken } = await authService.login({
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
    });
    superadminAccessToken = accessToken;
  });

  afterAll(async () => {
    if (typeof mongodb !== 'undefined') {
      await mongoose.disconnect();
      await mongodb.stop();
    }
  });

  describe('POST /departments', () => {
    it('Creates a department', async () => {
      const result = await api
        .post('/api/departments')
        .set('Authorization', `Bearer ${superadminAccessToken}`)
        .send({
          name: 'Testing',
          type: 'normal',
        });
      expect(result.status).toBe(200);
      expect(result.body.payload.name).toEqual('Testing');
    });
  });
});
