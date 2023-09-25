const mongoose = require('mongoose');

const createCustomIdMiddleware = require('../utils/model-customId-middleware.helper');

const Schema = mongoose.Schema;

const reviewerGroupSchema = new Schema(
  {
    groupId: { type: String, required: true, unique: true },
    reviewers: [
      {
        index: {
          type: Number,
          required: true,
        },
        reviewer: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        department: {
          type: Schema.Types.ObjectId,
          ref: 'Department',
          required: true,
        },
      },
    ],
    name: String,
    description: String,
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
