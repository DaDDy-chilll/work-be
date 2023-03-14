const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const countSchema = new Schema({
  model: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});

const Count = mongoose.model('Count', countSchema);

module.exports = Count;
