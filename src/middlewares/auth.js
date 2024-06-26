const passport = require('passport');
const httpStatus = require('http-status');
const moment = require('moment/moment');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');
const config = require('../config/config');
const { tokenTypes } = require('../config/tokens');
const { generateToken } = require('../services/token.service');
const { Licence } = require('../models');

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.user = user;

  if (requiredRights.length) {
    const userRights = roleRights.get(user.role);
    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
    if (!hasRequiredRights && req.params.userId !== user.id) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }
  }

  resolve();
};

const auth =
  (...requiredRights) =>
  async (req, res, next) => {
    const s2sKey = 'RFqjc7x6lVTv3EereJCCg4KuL6q7zzwS';
    if (req.headers.s2s === s2sKey && !!req.headers.licencenumber) {
      const user = await Licence.findOne({ licenceNumber: req.headers.licencenumber }).lean();
      const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
      console.log(user._id.toString(), user);
      const accessToken = generateToken(user.userId, accessTokenExpires, tokenTypes.ACCESS);
      req.headers.authorization = `Bearer ${accessToken}`;
    }
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
      .then(() => next())
      .catch((err) => {
        console.log(err);
        next(err);
      });
  };

module.exports = auth;
