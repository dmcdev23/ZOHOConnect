const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { ObjectId } = Schema.Types;

const OrderSyncSetupSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  licenseNumber: {
    type: ObjectId,
    required: true,
    ref: 'licences'
  },
  licenseNumber: {
    type: ObjectId,
    required: true,
    ref: 'licences'
  },
  organizationId:{ type: String },
  zohoId: {
    type: String,
    //required: true
  },
  wooCommerceId: {
    type: String,
    //required: true
  },
  orderSyncNumberSeriesType: {
    type: String,
    enum: ['SUFFIX', 'PREFIX'],
    required: true
  },
  orderSyncNumberSeriesValue: {
    type: String,
    required: true
  },
  customSyncParameter: {
    type: String,
    enum: ['EMAIL_ID', 'MOBILE'],
    required: true
  },
  syncFrequencyType: {
    auto: { type: Boolean, default: false },
    hourly: { type: Boolean, default: false },
    custom: { type: String }
  },
  syncFrequencyValue: {
    auto: { type: Boolean, default: false },
    fixFrequency: {
      hourMinute: { type: String, match: [/^(0[0-9]|1[0-2]):([0-5][0-9])$/, 'is invalid'] },
      period: { type: String, enum: ['AM', 'PM'], default: 'AM' }
      // fullTime: { type: String, match: [/^(0[0-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/, 'is invalid'] } // Optional: If you still want to store the combined value
    },
    timeZone: { type: String },
    fixFrequency: { type: String, enum: ['1 HOUR', '3 HOURS', '6 HOURS', '12 HOURS', '24 HOURS'] },
  },

  alertEmail: {
    type: String,
    required: true,
    match: [/\S+@\S+\.\S+/, 'is invalid']
  },
  manualSync: {
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  }
}, { timestamps: true });


// add plugin that converts mongoose to json
OrderSyncSetupSchema.plugin(toJSON);
OrderSyncSetupSchema.plugin(paginate);

const OrderSyncSetup = mongoose.model('OrderSyncSetup', OrderSyncSetupSchema);
module.exports = OrderSyncSetup;

