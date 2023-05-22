const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const createCustomIdMiddleware = require('../helpers/model-customId-middleware.helper');

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
    role: {
      type: String,
      enum: Object.values(['SUPERADMIN', 'AUTHORIZED', 'BASIC']),
      default: 'BASIC',
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
      type: Schema.Types.ObjectId,
      ref: 'Department',
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
      canVerify: {
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
