const mongoose = require('mongoose');

const createCustomIdMiddleware = require('../helpers/model-customId-middleware.helper');

const Schema = mongoose.Schema;

const assigneesGroupSchema = new Schema(
  {
    groupId: { type: String, required: true, unique: true },
    assignees: [
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
    groupName: String,
  },
  {
    timestamps: true,
  }
);

assigneesGroupSchema.pre(
  'validate',
  createCustomIdMiddleware({
    modelName: 'AssigneeGroup',
    fieldName: 'groupId',
    prefix: 'AG',
  })
);

const AssigneeGroup = mongoose.model('AssigneeGroup', assigneesGroupSchema);

module.exports = AssigneeGroup;
