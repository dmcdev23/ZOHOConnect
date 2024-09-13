const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const { ObjectId } = Schema.Types;
const wordPressProductSchema = mongoose.Schema(
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
    item_id: { type: String },
    zohoResponse: { type: mongoose.Schema.Types.Mixed }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
wordPressProductSchema.plugin(toJSON);
wordPressProductSchema.plugin(paginate);
wordPressProductSchema.index({ id: -1 });
wordPressProductSchema.index({ licenceNumber: -1, userId: -1 });
wordPressProductSchema.index({ licenceNumber: -1, isSyncedToZoho: -1 });
wordPressProductSchema.index({ userId: -1, id: -1, licenceNumber: -1 }, { unique: true });

const wordPressProduct = mongoose.model('wordPressProduct', wordPressProductSchema);
module.exports = wordPressProduct;
