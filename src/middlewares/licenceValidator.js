const FormData = require('form-data');
const API_SERVICE = require('../commonServices/api.service');
const { licenceService } = require('../services');
const licenceValidator = async (req, res, next) => {
  if (req.user?.license[req.headers.licenceNumber]?.isLicenceExpired) {
    throw 'Licence Expired';
  }else if(req.user?.license[req.headers.licenceNumber].isExpired){
    await refreshToken(req.user?.license[req.headers.licenceNumber]);
    req.user.license[req.headers.licenceNumber].isExpired = false;
    //need to refresh token in case of token expiery
  }else if(!req.user?.license || !req.headers.licenceNumber){
    throw 'Licence is required to perform this operation';
  }
  next();
};
const refreshToken = async (licence)=>{
  let data = new FormData();
  data.append('client_id', licence.clientId);
  data.append('client_secret', licence.clientSecret);
  data.append('refresh_token', licence.refreshToken);
  data.append('grant_type', 'refresh_token');
  const res = await API_SERVICE.refreshToken(data);
  const now = new Date();
  now.setMinutes(now.getMinutes() + 55);
  licence = await licenceService.findOneAndUpdate(licence._id, {access_token: res.access_token, expireAt: now});
}

module.exports = { licenceValidator };
