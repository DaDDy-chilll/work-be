const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const mentionSchema = new Schema(
  {
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    reviewers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    remark: {
      type: String,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reciever: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [
      {
        url: String,
        key: String,
        filename: String,
        mimetype: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Mention = mongoose.model('Mention', mentionSchema);

module.exports = Mention;
