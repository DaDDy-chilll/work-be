const mongoose = require('mongoose');

const createCustomIdMiddlware = require('../utils/model-customId-middleware.helper');

const {
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  DOCUMENT_ACTIONS,
} = require('../constants/document');

const Schema = mongoose.Schema;

const documentSchema = new Schema(
  {
    isOrderDocument: {
      type: Boolean,
      default: true,
    },
    documentRequestId: {
      id: {
        type: String,
        required: true,
      },
      documentId: {
        type: String,
        required: true,
      },
    },
    documentId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(DOCUMENT_TYPES),
    },
    amount: {
      type: Number,
    },
    attachments: [
      {
        url: String,
        key: String,
        filename: String,
        mimetype: String,
      },
    ],
    description: {
      type: String,
    },
    isCaseClosed: {
      type: Boolean,
      default: false,
    },

    isWorkflowAssigned: {
      type: Boolean,
      default: false,
    },

    remarks: [
      {
        content: {
          type: String,
          default: 'No remark.',
        },
        remarker: {
          type: mongoose.Types.ObjectId,
          ref: 'User',
        },
        action: {
          type: String,
          required: true,
          enum: Object.values(DOCUMENT_ACTIONS),
        },
        date: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    // histories: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: 'History',
    //   },
    // ],
    status: {
      type: String,
      enum: Object.values(DOCUMENT_STATUSES),
      default: DOCUMENT_STATUSES.PENDING,
    },
    requester: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedByDepartment: {
      type: mongoose.Types.ObjectId,
      ref: 'Department',
    },

    reviewers: {
      currentReviewerIndex: {
        type: Number,
        default: 0,
      },
      currentDepartment: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
      },
      list: [
        {
          reviewer: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
          },
          index: {
            type: Number,
            required: true,
          },
          department: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Department',
          },
          status: {
            type: String,
            enum: [
              'PENDING',
              DOCUMENT_ACTIONS.APPROVED,
              DOCUMENT_ACTIONS.AUTHORIZE,
              DOCUMENT_ACTIONS.REJECTED,
              DOCUMENT_ACTIONS.COMMENTED,
              DOCUMENT_ACTIONS.VERIFIED,
              DOCUMENT_ACTIONS.PREPARED,
              DOCUMENT_ACTIONS.FORWARDED,
              DOCUMENT_ACTIONS.ACKNOWLEDGED,
            ],
            default: 'PENDING',
          },
          canPrepare: Boolean,
          canEdit: Boolean,
          canAuthorize: Boolean,
          canApprove: Boolean,
          canVerify: Boolean,
        },
      ],
    },
    revisions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Revision',
      },
    ],
    currentReviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    isClaimDocument: {
      type: Boolean,
      default: false,
    },
    originalDocument: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
    },
    lastStep: {
      type: Object,
      default: null,
      required: false,
    },
    orderWorkflow: {
      type: Schema.Types.ObjectId,
      ref: 'ReviewerGroup',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

documentSchema.pre(
  'validate',
  createCustomIdMiddlware({
    modelName: 'Document',
    prefix: 'PO',
    fieldName: 'documentId',
  })
);

documentSchema.virtual('lastActivity', {
  ref: 'History',
  localField: '_id',
  foreignField: 'document',
  justOne: true,
  options: {
    sort: '-createdAt',
  },
});

const OrderDocument = mongoose.model('OrderDocument', documentSchema);

module.exports = OrderDocument;
