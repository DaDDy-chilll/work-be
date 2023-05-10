const mongoose = require('mongoose');
const { DOCUMENT_ACTIONS } = require('../constants/document');

const Schema = mongoose.Schema;

// noti to people who have to acknowledge
// ['ACKNOWLEDGE']
const notificationSchema = new Schema(
  {
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: Object.values(DOCUMENT_ACTIONS),
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
