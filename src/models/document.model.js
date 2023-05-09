const mongoose = require('mongoose');

const createCustomIdMiddlware = require('../helpers/model-customId-middleware.helper');

const {
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  DOCUMENT_ACTIONS,
} = require('../constants/document');
const { AUTHORIZED_DEPARTMENTS } = require('../constants/user');

const Schema = mongoose.Schema;

const reviewerSchema = {
  order: {
    type: Number,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    enum: ['pending', 'verified', 'approved', 'rejected', 'acknowledge'],
    default: 'pending',
  },
};

const documentSchema = new Schema(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(DOCUMENT_TYPES),
    },
    amount: {
      type: Number,
      required: true,
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
      required: true,
    },
    isCaseClosed: {
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

    reviewers: {
      currentReviewerIndex: {
        type: Number,
        default: 0,
      },
      currentDepartment: {
        type: String,
        enum: Object.values(AUTHORIZED_DEPARTMENTS),
        default: AUTHORIZED_DEPARTMENTS.OFFICE_ADMIN,
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
            type: String,
            required: true,
            enum: Object.values(AUTHORIZED_DEPARTMENTS),
          },
          canPrepare: Boolean,
          canEdit: Boolean,
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
    },

    adminReviewers: [reviewerSchema], // deprecated
    fadReviewers: [reviewerSchema], // deprecated
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
    prefix: 'D',
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

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
