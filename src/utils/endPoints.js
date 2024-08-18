const { zohoEndPoint } = require('./constant');
module.exports = {
  GET_ORGNIZATION: (region) => `${zohoEndPoint[region]}organizations`,
  GET_ITEMS: (region) => `${zohoEndPoint[region]}items`,
  GET_CONTACTS: (region) => `${zohoEndPoint[region]}contacts`,
};
