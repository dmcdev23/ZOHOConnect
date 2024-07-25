const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const { ObjectId } = Schema.Types;
const wordPressCustomerSchema = mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    id: {
      type: Number,
      required: true,
    },
    data: {
      type: Object,
    },
    licenceNumber: { type: ObjectId, required: true, ref: 'licences' },
    isSyncedToZoho: { type: Boolean, default: false },
    contact_id: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
wordPressCustomerSchema.plugin(toJSON);
wordPressCustomerSchema.plugin(paginate);
wordPressCustomerSchema.index({ id: -1 });
wordPressCustomerSchema.index({ licenceNumber: -1, userId: -1 });
wordPressCustomerSchema.index({ licenceNumber: -1, isSyncedToZoho: -1 });
wordPressCustomerSchema.index({ licenceNumber: -1, userId: -1, id: -1 });

const wordPressCustomer = mongoose.model('wordPressCustomer', wordPressCustomerSchema);
module.exports = wordPressCustomer;
