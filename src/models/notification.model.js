const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// noti to people who have to acknowledge
// ['ACKNOWLEDGE']
const notificationSchema = new Schema({
  to: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['ACKNOWLEDGE'],
  },
  documentId: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
