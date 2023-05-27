const mongoose = require('mongoose');

const { DOCUMENT_ACTIONS } = require('../constants/document');

const Schema = mongoose.Schema;

const historySchema = new Schema(
  {
    content: {
      type: String,
    },
    actor: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      required: true,
      enum: Object.values(DOCUMENT_ACTIONS),
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now(),
    },
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const History = mongoose.model('History', historySchema);

module.exports = History;
