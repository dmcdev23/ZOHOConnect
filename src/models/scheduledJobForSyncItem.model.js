const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { ObjectId } = Schema.Types;

const scheduledJobForSyncItemSchema = new mongoose.Schema({
  licenseNumber: {
    type: ObjectId,
    required: true,
    ref: 'licences'
  },
  nextIterationTime: { type: Date, default: null },
  jobExecutedTime: { type: Date, default: null }, 
  isRun: { type: Boolean, default: false },
  isSuccess: { type: Boolean, default: false },
  isFail: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  successMessage: { type: String, default: '' },
  syncItem: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

const scheduledJobForSyncItem = mongoose.model('ScheduledJobForSyncItem', scheduledJobForSyncItemSchema);

module.exports = scheduledJobForSyncItem;

