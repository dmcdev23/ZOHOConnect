const { zohoEndPoint } = require('./constant');
module.exports = {
  GET_ORGNIZATION: (region) => `${zohoEndPoint[region]}v1/organizations`,
  GET_ITEMS: (region) => `${zohoEndPoint[region]}v1/items`,
  GET_CONTACTS: (region) => `${zohoEndPoint[region]}v1/contacts`,
};
