const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { userRoles } = require('../constants');
const Count = require('./count.model');

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
      requried: true,
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

const User = mongoose.model('User', userSchema);

module.exports = User;
