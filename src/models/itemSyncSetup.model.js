const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { ObjectId } = Schema.Types;

const ItemSyncSetupSchema = mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    licenseNumber: {
      type: ObjectId,
      required: true,
      ref: 'licences',
    },
    syncMethod: {
      type: String,
      enum: ['ITEM', 'SKU', 'BARCODE'],
      required: true,
    },
    itemSync: {
      type: Boolean,
      default: false,
    },
    skuSync: {
      type: Boolean,
      default: false,
    },
    barcodeSync: {
      type: Boolean,
      default: false,
    },
    itemSyncSource: {
      type: String,
      enum: ['ZOHO', 'WOOCOMMERCE'],
      required: true,
    },
    itemSyncIntermediateDestination: {
      type: String,
      enum: ['PHYGITAL_COMMERCE'],
      required: true,
    },
    itemSyncFinalDestination: {
      type: String,
      enum: ['ZOHO', 'WOOCOMMERCE'],
      required: true,
    },
    syncParametersFirst: {
      type: String,
      required: true,
    },
    syncParametersSecond: {
      type: String,
      required: true,
    },
    syncFrequency: {
      forAll: { type: Boolean, default: false },
      forItem: { type: Boolean, default: false },
      forPrice: { type: Boolean, default: false },
      forInventory: { type: Boolean, default: false },
    },
    manualSync: {
      overrideAll: { type: Boolean, default: false },
      incrementalSync: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
ItemSyncSetupSchema.plugin(toJSON);
ItemSyncSetupSchema.plugin(paginate);

const ItemSyncSetup = mongoose.model('ItemSyncSetup', ItemSyncSetupSchema);
module.exports = ItemSyncSetup;
