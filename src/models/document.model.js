const mongoose = require('mongoose');

const Count = require('./count.model');
const { paymentType, documentStatus } = require('../constants');

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
    required: true,
  },
  verifiedBy: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
  ],
  approvedBy: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
});

documentSchema.pre('validate', async function (next) {
  if (!this.isNew) return next();
  const countDoc = await Count.findOneAndUpdate(
    { model: 'document' },
    {
      model: 'document',
      $inc: {
        count: 1,
      },
    },
    { new: true, upsert: true },
  );

  this.customId = 'D-' + countDoc.count.toString().padStart(3, '0');
  next();
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
