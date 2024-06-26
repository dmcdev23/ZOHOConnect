const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { Schema } = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const licenceSchema = mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    expireAt: {
      type: Date,
      default: () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 55);
        return now;
      },
    },
    clientId: {
      type: String,
      required: true,
    },
    clientSecret: {
      type: String,
      required: true,
    },
    licenceNumber: { type: String },
    licenceExpiry: {
      type: Date,
      default: () => {
        const now = new Date();
        now.setMonth(now.getMonth() + 1);
        return now;
      },
    },
    storeUrl: {
      type: String,
    },
    WPKey: {
      type: String,
    },
    WPSecret: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
licenceSchema.plugin(toJSON);
licenceSchema.plugin(paginate);

/**
 * @typedef licenceSchema
 */
licenceSchema.index({ userId: -1, clientId: -1, licenceNumber: -1 }, { unique: true });

const Licence = mongoose.model('Licence', licenceSchema);
module.exports = Licence;
