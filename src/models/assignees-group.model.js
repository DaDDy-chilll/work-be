const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const assigneesGroupSchema = new Schema({
  groupId: { type: String, required: true, unique: true },
  assignees: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  groupName: String,
});

assigneesGroupSchema.pre('validate', async function () {
  if (!this.isNew) return;

  const lastGroup = await this.$model('AssigneeGroups').find();
});
