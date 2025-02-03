const mongoose = require('mongoose');
const { DOCUMENT_ACTIONS } = require('../constants/document');
const { WORKFLOW_TYPES } = require('../constants/reviewer-group');

const Schema = mongoose.Schema;

// noti to people who have to acknowledge
// ['ACKNOWLEDGE']
const notificationSchema = new Schema(
  {
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(DOCUMENT_ACTIONS),
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    workflowType: {
      type: String,
      enum: Object.values(WORKFLOW_TYPES),
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
