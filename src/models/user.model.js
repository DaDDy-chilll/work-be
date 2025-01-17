const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const createCustomIdMiddleware = require('../utils/model-customId-middleware.helper');

const Schema = mongoose.Schema;

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
    // role: {
    //   type: String,
    //   enum: Object.values(['SUPERADMIN', 'AUTHORIZED', 'BASIC']),
    //   default: 'BASIC',
    // },
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
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    permissions: {
      canAuthorize: {
        type: Boolean,
        default: false,
      },
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
      canVerify: {
        type: Boolean,
        default: true,
      },
      canEditAmount: {
        type: Boolean,
        default: false,
      },
      canForward: {
        type: Boolean,
        default: false,
      },
      canMention: {
        type: Boolean,
        default: false,
      },
      canNormalReturn: {
        type: Boolean,
        default: false,
      },
      canAdvanceReturn: {
        type: Boolean,
        default: false,
      },
    },
    favouriteWorkflows: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReviewerGroup',
      },
    ],
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

userSchema.virtual('role').get(function () {
  if (this.isSuperadmin) {
    return 'SUPERADMIN';
  }

  return Object.values(this.permissions).every((p) => !p)
    ? 'BASIC'
    : 'AUTHORIZED';
});

const User = mongoose.model('User', userSchema);

module.exports = User;
