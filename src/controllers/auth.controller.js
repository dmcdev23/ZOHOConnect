const httpStatus = require('http-status');
const axios = require('axios');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService, licenceService } = require('../services');
const logger = require('../utils/logger');

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
const recieveToken = catchAsync(async (req, res) => {
  try {
    console.log(req.query);
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `https://accounts.zoho.com/oauth/v2/token?code=${req.query.code}&client_id=1000.0AV2T1IN2BJ8UQF6HNRJ6SZUBZW0PF&client_secret=3488dc9db9f10d32184522a46c0c1d43a9973e7730&redirect_uri=https://zoho-connect-ravi-pratap-singhs-projects-df76afa5.vercel.app/bg_prod&grant_type=authorization_code&access_type=offline`,
    };
    const response = await axios.request(config);
    res.status(httpStatus.OK).send(JSON.stringify(response.data));
  } catch (e) {
    console.error(e);
    throw e;
  }
});

const linkZOHO = catchAsync(async (req, res) => {
  try {
    const licenceNumber = await licenceService.getLicenceById(req.body.licenceNumber);
    const URL = `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoInventory.fullaccess.all&client_id=${
      req.query.client_id
    }&response_type=code&redirect_uri=http://localhost:8888/bg_prod&access_type=offline&prompt=consent&state=${req.user._id.toString()}`;
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
