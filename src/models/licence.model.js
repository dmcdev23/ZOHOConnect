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
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
licenceSchema.plugin(toJSON);
licenceSchema.plugin(paginate);

// /**
//  * Check if email is taken
//  * @param {string} email - The user's email
//  * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
//  * @returns {Promise<boolean>}
//  */
// userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
//   const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
//   return !!user;
// };
//
// /**
//  * Check if password matches the user's password
//  * @param {string} password
//  * @returns {Promise<boolean>}
//  */
// userSchema.methods.isPasswordMatch = async function (password) {
//   const user = this;
//   return bcrypt.compare(password, user.password);
// };
//
// userSchema.pre('save', async function (next) {
//   const user = this;
//   if (user.isModified('password')) {
//     user.password = await bcrypt.hash(user.password, 8);
//   }
//   next();
// });

/**
 * @typedef licenceSchema
 */
licenceSchema.index({ userId: -1, clientId: -1, licenceNumber: -1 }, { unique: true });

const Licence = mongoose.model('Licence', licenceSchema);
module.exports = Licence;
