const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { userRoles } = require('../constants');
const Count = require('./count.model');

const Schema = mongoose.Schema;

const permissions = {
  adminSection: {
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
  fadSection: {
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
};

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    customId: {
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
      enum: Object.values(userRoles),
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
    id: false,
  }
);

userSchema.pre('validate', async function (next) {
  if (!this.isNew) return next();
  const countDoc = await Count.findOneAndUpdate(
    { model: 'user' },
    {
      model: 'user',
      $inc: {
        count: 1,
      },
    },
    { new: true, upsert: true }
  );

  this.customId = 'U-' + countDoc.count.toString().padStart(3, '0');
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.virtual('id').get(function () {
  return this.customId;
});

const User = mongoose.model('User', userSchema);

module.exports = User;
