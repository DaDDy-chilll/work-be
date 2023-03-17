const { z } = require('zod');
const registerUserBodySchema = require('./registerUserBody.schema');

module.exports = z.object({
  body: registerUserBodySchema,
});
