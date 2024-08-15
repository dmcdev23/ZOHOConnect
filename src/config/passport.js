const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const mongoose = require('mongoose');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const { User } = require('../models');

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }
    const [user] = await User.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(payload.sub),
        },
      },
      {
        $lookup: {
          from: 'licences',
          localField: '_id',
          foreignField: 'userId',
          as: 'licence',
        },
      },
    ]);
    if (!user) {
      return done(null, false);
    }
    if(user?.licence.length){
      user.licence = user.licence.reduce((acc,curr)=>{
        acc[curr._id] = {...curr,
          isExpired: !curr.expireAt || new Date() > new Date(curr.expireAt),
          isLicenceExpired: new Date() > new Date(curr.licenceExpiry),
        };
        return acc;
      },{})
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
