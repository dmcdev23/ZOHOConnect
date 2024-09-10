const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const { ObjectId } = Schema.Types;
const syncHistorySchema = mongoose.Schema({
  licenseNumber: {
    type: ObjectId,
    required: true,
    ref: 'License',
  },
  status: {
    type: String,
    required: true,
  },
  totalCount: {
    type: Number,
  },
  syncedCount: {
    type: Number,
  },
});

syncHistorySchema.plugin(toJSON);
syncHistorySchema.plugin(paginate);

const SyncHistory = mongoose.model('SyncHistory', syncHistorySchema);
module.exports = SyncHistory;
