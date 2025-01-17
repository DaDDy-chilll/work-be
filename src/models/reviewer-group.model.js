const mongoose = require('mongoose');

const createCustomIdMiddleware = require('../utils/model-customId-middleware.helper');
const {
  REVIEWER_GROUP_TYPES,
  WORKFLOW_TYPES,
} = require('../constants/reviewer-group');

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
    type: {
      type: String,
      enum: [...Object.values(REVIEWER_GROUP_TYPES)],
      default: REVIEWER_GROUP_TYPES.NORMAL,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    workflowType: {
      type: String,
      enum: [...Object.values(WORKFLOW_TYPES)],
      default: WORKFLOW_TYPES.DEFAULT,
    },
    workflowOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'ReviewerGroup',
    },
  },
  {
    timestamps: true,
  }
);

reviewerGroupSchema.pre('validate', async function (next) {
  if (this.workflowType === WORKFLOW_TYPES.PURCHASE_REQUEST) {
    if (!this.workflowOrderId)
      return next(
        new Error(
          'workflowOrderId is required when workflowType is PURCHASE_REQUEST.'
        )
      );
    const isValidOrder = await mongoose
      .model('ReviewerGroup')
      .exists({ _id: this.workflowOrderId });
    if (!isValidOrder)
      return next(new Error('Invalid workflowOrderId provided.'));
  } else this.workflowOrderId = null;

  next();
});

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
