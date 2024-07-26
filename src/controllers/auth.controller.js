const httpStatus = require('http-status');
const axios = require('axios');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService, licenceService } = require('../services');
const logger = require('../utils/logger');
const { Licence } = require('../models');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});
const generateToken = catchAsync(async (req, res) => {
  res.status(httpStatus.NO_CONTENT).send();
});
// const recieveToken = catchAsync(async (req, res) => {
//   try {
//     console.log(req.query);
//     const [_id,redirectionURL] = req.query.state.split('|')
//     let licence = await Licence.findOne({ _id: _id }).lean();
//     const config = {
//       method: 'post',
//       maxBodyLength: Infinity,
//       url: `https://accounts.zoho.com/oauth/v2/token?code=${req.query.code}&client_id=${licence.clientId}&client_secret=${licence.clientSecret}&redirect_uri=${!!redirectionURL ? redirectionURL : 'https://zoho-connect-ravi-pratap-singhs-projects-df76afa5.vercel.app/bg_prod'}&grant_type=authorization_code&access_type=offline`,
//     };
//     const response = await axios.request(config);
//     licence = await Licence.updateOne(
//       { _id: req.query.state },
//       {
//         $set: {
//           accessToken: response.data?.access_token,
//           refreshToken: response.data?.refresh_token,
//         },
//       }
//     );
//     res.status(httpStatus.OK).send(
//       {
//         status: 200,
//         message: 'Success'
//       });
//   } catch (e) {
//     console.error(e);
//     res.status(httpStatus.OK).send(
//       {
//         status: 500,
//         message: 'Error',
//         data: e
//       });
//   }
// });

// const linkZOHO = catchAsync(async (req, res) => {
//   try {
//     const licenceNumber = await licenceService.createLicence(
//       { clientId: req.query.client_id, clientSecret: req.query.client_secret, licenceNumber: req.query.licenceNumber },
//       req.user._id.toString()
//     );
//     const URL = `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoInventory.fullaccess.all&client_id=${
//       req.query.client_id
//     }&response_type=code&redirect_uri=https://zoho-connect-ravi-pratap-singhs-projects-df76afa5.vercel.app/bg_prod&state=${licenceNumber._id.toString()}|${req.headers.redirecturl}`;
//     res.status(httpStatus.OK).send({ URL });
//   } catch (e) {
//     console.error(e);
//     throw e;
//   }
// });

const recieveToken = catchAsync(async (req, res) => {
  try {
    console.log(req.query);
    const licenceCheck = await Licence.findOne(
      { _id: req.query.state },
    ).lean();
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `https://accounts.zoho.com/oauth/v2/token?code=${req.query.code}&client_id=${licenceCheck.clientId}&client_secret=${licenceCheck.clientSecret}&redirect_uri=https://zoho-connect-ravi-pratap-singhs-projects-df76afa5.vercel.app/bg_prod&grant_type=authorization_code&access_type=offline`,
    };
    const response = await axios.request(config);
    console.log(response);
    if(!response.data?.access_token) {
      res.send(response.data);
    //   res.send({
    //   msg: "response.data?.access_token bnot found",
    //   data: {
    //     res: response.data,
    //     status: response.status
    //   }
    // });
    }
    const licence = await Licence.updateOne(
      { _id: req.query.state },
      {
        $set: {
          accessToken: response.data?.access_token,
          refreshToken: response.data?.refresh_token,
        },
      }
    );
    // res.status(httpStatus.OK).send({
    //   status: 200,
    //   message: 'Success',
    // });
    res.redirect(`https://connector-steel.vercel.app/zoho-redirect?success=${JSON.stringify(response.data)}`);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.OK).send({
      status: 500,
      message: 'Error',
      data: e,
    });
  }
});

const linkZOHO = catchAsync(async (req, res) => {
  try {
    const licenceNumber = await licenceService.createLicence(
      { clientId: req.query.client_id, clientSecret: req.query.client_secret, licenceNumber: req.query.licenceNumber },
      req.user._id.toString()
    );
    const URL = `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoInventory.fullaccess.all&client_id=${
      req.query.client_id
    }&response_type=code&redirect_uri=https://zoho-connect-ravi-pratap-singhs-projects-df76afa5.vercel.app/bg_prod&access_type=offline&prompt=consent&state=${licenceNumber._id.toString()}`;
    res.status(httpStatus.OK).send({ URL });
  } catch (e) {
    console.error(e);
    throw e;
  }
});

const createLicence = catchAsync(async (req, res) => {
  try {
    const licence = await licenceService.createLicence(req.body, req.user._id);
    res.status(httpStatus.OK).send(licence);
  } catch (e) {
    console.error(e);
    throw e;
  }
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  generateToken,
  recieveToken,
  linkZOHO,
  createLicence,
};
