const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const assigneesGroupSchema = new Schema({
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
});

assigneesGroupSchema.pre('validate', async function () {
  if (!this.isNew) return;

  const [lastGroup] = await this.$model('AssigneeGroup')
    .find()
    .sort('-createdAt')
    .limit(1);

  if (!lastGroup) {
    this.groupId = 'AG-001';
    return;
  }

  const lastGroupIdNumber = parseInt(lastGroup.groupId.split('-')[1], 10);

  this.groupId = `AG-${(lastGroupIdNumber + 1).toString().padStart(3, '0')}`;
  return;
});

const AssigneeGroup = mongoose.model('AssigneeGroup', assigneesGroupSchema);

module.exports = AssigneeGroup;
