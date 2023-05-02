const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const reversalSchema = new Schema(
  {
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    isActive: Boolean,
    reversedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reversedByDepartment: String,
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgements: [
      {
        user: {
          type: Schema.Types.ObjectId,
          hasAcknowledged: {
            type: Boolean,
            default: false,
          },
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

const Reversal = mongoose.model('Reversal', reversalSchema);

module.exports = Reversal;
