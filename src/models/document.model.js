const mongoose = require('mongoose');

const createCustomIdMiddlware = require('../helpers/model-customId-middleware.helper');

const {
  DOCUMENT_SECTIONS,
  PAYMENT_TYPES,
  DOCUMENT_STATUSES,
  DOCUMENT_ACTIONS,
} = require('../constants/document');

const Schema = mongoose.Schema;

const assigneeSchema = {
  order: {
    type: Number,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  hasApproved: {
    type: Boolean,
    default: false,
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
    paymentType: {
      type: String,
      required: true,
      enum: Object.values(PAYMENT_TYPES),
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
        section: {
          type: String,
          required: true,
          enum: Object.values(DOCUMENT_SECTIONS),
        },
        date: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    state: {
      status: {
        type: String,
        required: true,
        enum: Object.values(DOCUMENT_STATUSES),
        default: DOCUMENT_STATUSES.pending,
      },
      section: {
        type: String,
        enum: Object.values(DOCUMENT_SECTIONS),
      },
      currentAssignee: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    requestedBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    adminAssignees: [assigneeSchema],
    fadAssignees: [assigneeSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    id: false,
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

documentSchema.virtual('id').get(function () {
  return this.documentId;
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
