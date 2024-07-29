const mongoose = require('mongoose');

const orderSyncSetupSchema = new mongoose.Schema({
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
    
    isAuto: { type: Boolean, default: false },
    setTime: { type: String, match: [/^(0[0-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/, 'is invalid'] },
    timeZone: { type: String },
    fixFrequency: { type: String, enum: ['1 HOUR', '3 HOURS', '6 HOURS', '12 HOURS', '24 HOURS'] },
  },
  alertEmailId: {
    type: String,
    required: true,
    match: [/\S+@\S+\.\S+/, 'is invalid']
  },
  manualSync: {
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  }
}, { timestamps: true });

const orderSyncSetup = mongoose.model('orderSyncSetup', orderSyncSetupSchema);

module.exports = orderSyncSetup;
