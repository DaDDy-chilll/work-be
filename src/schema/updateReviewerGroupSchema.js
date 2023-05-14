const checkParamsId = require('./checkParamsId.schema');
const createReviewerGroupSchema = require('./createReviewerGroup');

module.exports = createReviewerGroupSchema.partial().merge(checkParamsId);
