const { SyncHistory } = require('../models');

/**
 * Create or update sync history for a user
 * @param {ObjectId} userId
 * @param {Object} syncData
 * @returns {Promise<SyncHistory>}
 */
const createOrUpdateSyncHistory = async (licenseNumber, syncData) => {
  let syncHistory = await SyncHistory.findOne({ licenseNumber });

  if (syncHistory) {
    // Update existing document
    Object.assign(syncHistory, syncData);
    await syncHistory.save();
  } else {
    // Create new document
    syncHistory = new SyncHistory({ licenseNumber, ...syncData });
    await syncHistory.save();
  }

  return syncHistory;
};

const getSyncHistory = async (licenseNumber) => {
  return SyncHistory.findOne({ licenseNumber });
};

module.exports = {
  createOrUpdateSyncHistory,
  getSyncHistory,
};
