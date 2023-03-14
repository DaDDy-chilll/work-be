const mongoose = require('mongoose');
const { paymentType, documentStatus } = require('../constants');
const setCustomId = require('../helpers/setCustomId');

const Schema = mongoose.Schema;

const documentSchema = new Schema({
  customId: {
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
    enum: Object.values(paymentType),
  },
  amount: {
    type: Number,
    required: true,
  },
  attachments: [
    {
      type: String,
    },
  ],
  description: {
    type: String,
    required: true,
  },
  remarks: [
    {
      content: String,
      remarker: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  status: {
    type: String,
    default: documentStatus.pending,
    enum: Object.values(documentStatus),
  },
  requestedBy: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
  verifiedBy: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
  approvedBy: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
});

documentSchema.pre('save', setCustomId({ prefix: 'D', modelName: 'document' }));

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
