const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const createCustomIdMiddleware = require('../helpers/model-customId-middleware.helper');
const { USER_ROLES } = require('../constants/user');

const Schema = mongoose.Schema;

const permissions = {
  admin: {
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
  },
  fad: {
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
    acknowledge: {
      type: Boolean,
      default: false,
    },
  },
  canSubmit: {
    type: Boolean,
    default: true,
  },
};

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      required: true,
      type: String,
    },
    password: {
      required: true,
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
    },
    permissions,
    jobLabel: {
      type: String,
      required: true,
    },
    approvalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

userSchema.pre(
  'validate',
  createCustomIdMiddleware({
    modelName: 'User',
    prefix: 'U',
    fieldName: 'userId',
  })
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
