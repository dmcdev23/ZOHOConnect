const { authPost } = require('./axios.service');

const refreshToken = async (data, licence) => {
  try {
    const config = {
      endpoint: 'token',
      data,
    };
    return await authPost(config, licence.licenceNumber);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
module.exports = { refreshToken };
