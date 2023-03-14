const mongoose = require('mongoose');

const { userRoles } = require('../constants');
const Count = require('./count.model');
const setCustomId = require('../helpers/setCustomId');

const Schema = mongoose.Schema;

const permissions = {
  requestForm: {
    read: {
      type: Boolean,
      default: false,
    },
    approve: {
      type: Boolean,
      default: false,
    },
    reject: {
      type: Boolean,
      default: false,
    },
    verify: {
      type: Boolean,
      default: false,
    },
    submit: {
      type: Boolean,
      default: false,
    },
    update: {
      type: Boolean,
      default: false,
    },
    delete: {
      type: Boolean,
      default: false,
    },
  },
};

const userSchema = new Schema({
  customId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    required: true,
    type: String,
  },
  username: {
    required: true,
    type: String,
    unique: true,
  },
  password: {
    required: true,
    type: String,
    select: false,
  },
  role: {
    type: String,
    enum: Object.values(userRoles),
  },
  permissions,
  jobLabel: {
    type: String,
    required: true,
  },
  approvalAmount: {
    type: Number,
    required: true,
  },
});

userSchema.pre('save', setCustomId({ prefix: 'U', modelName: 'user' }));

const User = mongoose.model('User', userSchema);

module.exports = User;
