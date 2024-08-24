const mongoose = require('mongoose');
//const { Schema } = require('mongoose');
const { toJSON, paginate } = require('./plugins');

//const { ObjectId } = Schema.Types;
const wordPressSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    id: {
      type: Number,
      required: true,
    },
    data: { type: mongoose.Schema.Types.Mixed },
    licenceNumber: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Licences' },
    isSyncedToZoho: { type: Boolean, default: false }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
wordPressSchema.plugin(toJSON);
wordPressSchema.plugin(paginate);

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
 * @typedef wordPressSchema
 */
wordPressSchema.index({ id: -1 });
wordPressSchema.index({ licenceNumber: -1, userId: -1 });
wordPressSchema.index({ licenceNumber: -1, userId: -1, id: -1 });
wordPressSchema.index({ userId: -1, id: -1 }, { unique: true });

const wordPress = mongoose.model('wordPress', wordPressSchema);
module.exports = wordPress;
