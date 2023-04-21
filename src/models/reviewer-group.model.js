const mongoose = require('mongoose');

const createCustomIdMiddleware = require('../helpers/model-customId-middleware.helper');

const Schema = mongoose.Schema;

const reviewerGroupSchema = new Schema(
  {
    groupId: { type: String, required: true, unique: true },
    reviewers: [
      {
        order: {
          type: Number,
          required: true,
        },
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    groupName: String,
  },
  {
    timestamps: true,
  }
);

reviewerGroupSchema.pre(
  'validate',
  createCustomIdMiddleware({
    modelName: 'ReviewerGroup',
    fieldName: 'groupId',
    prefix: 'RG',
  })
);

const ReviewerGroup = mongoose.model('ReviewerGroup', reviewerGroupSchema);

module.exports = ReviewerGroup;
