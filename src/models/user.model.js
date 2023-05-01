const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const createCustomIdMiddleware = require('../helpers/model-customId-middleware.helper');
const { USER_ROLES, AUTHORIZED_DEPARTMENTS } = require('../constants/user');

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
      // deprecated
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.normal,
    },
    // permissions, // deprecated
    jobLabel: {
      type: String,
      required: true,
    },
    approvalAmount: {
      type: Number,
      default: 0,
    },
    isSuperadmin: {
      type: Boolean,
      default: false,
    },
    department: {
      type: String,
      required: true,
    },
    permissions: {
      canApprove: {
        type: Boolean,
        default: false,
      },
      canEdit: {
        type: Boolean,
        default: true,
      },
      canPrepare: {
        type: Boolean,
        default: true,
      },
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
