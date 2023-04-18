const mongoose = require('mongoose');

const createCustomIdMiddlware = require('../helpers/model-customId-middleware.helper');
const {
  paymentType,
  documentStatus,
  documentSections,
  documentActions,
} = require('../constants');

const Schema = mongoose.Schema;

const documentSchema = new Schema(
  {
    customId: {
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
      enum: Object.values(paymentType),
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
          enum: Object.values(documentActions),
        },
        section: {
          type: String,
          required: true,
          enum: Object.values(documentSections),
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
        enum: Object.values(documentStatus),
        default: documentStatus.pending,
      },
      section: {
        type: String,
        enum: Object.values(documentSections),
        default: documentSections.admin,
      },
    },
    requestedBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documentAssignees: [
      {
        order: {
          type: Number,
          required: true,
        },
        person: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
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
    fieldName: 'customId',
  })
);

documentSchema.virtual('id').get(function () {
  return this.customId;
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
