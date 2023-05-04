const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const revisionSchema = new Schema(
  {
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedByDepartment: String,
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewDepartment: {
      type: String,
      required: true,
    },
    acknowledgements: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        hasAcknowledged: {
          type: Boolean,
          default: false,
        },
      },
    ],
    history: {
      type: Schema.Types.ObjectId,
      ref: 'History',
    },
  },
  {
    timestamps: true,
  }
);

const Revision = mongoose.model('Revision', revisionSchema);

module.exports = Revision;
