const FormData = require('form-data');
const API_SERVICE = require('../commonServices/api.service');
const { licenceService } = require('../services');
const httpStatus = require('http-status');
const licenceValidator = async (req, res, next) => {
try{
  if (req.user.licence[req.query.licenceNumber]?.isLicenceExpired) {
    throw 'Licence Expired';
  }else if(req.user?.licence[req.query.licenceNumber].isExpired){
    req.user.licence[req.query.licenceNumber] = await refreshToken(req.user?.licence[req.query.licenceNumber]);
    req.user.licence[req.query.licenceNumber].isExpired = false;
    //need to refresh token in case of token expiery
  }else if(!req.user?.licence || !req.query.licenceNumber){
    throw 'Licence is required to perform this operation';
  }
  next();
}catch (e) {
  res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
}
};
const refreshToken = async (licence)=>{
try{
  let data = new FormData();
  data.append('client_id', licence.clientId);
  data.append('client_secret', licence.clientSecret);
  data.append('refresh_token', licence.refreshToken);
  data.append('grant_type', 'refresh_token');
  const res = await API_SERVICE.refreshToken(data,licence);
  const now = new Date();
  now.setMinutes(now.getMinutes() + 55);
  if(res.access_token){
    licence = await licenceService.findOneAndUpdate( licence._id, {accessToken: res.access_token, expireAt: now});
  }else{
    return res.data;
  }

  return licence._doc;
}catch (e) {
  throw e;
}
}

module.exports = { licenceValidator };
