
const { ScheduledJobForSyncItem } = require('../models');

exports.
runSyncJob = async () => {
    try {
      const syncItem = { /* Your sync payload object */ };
      console.log('Running sync job...');
      console.log('Sync job completed successfully.');
      const nextIterationTime = new Date(Date.now() + 30 * 60000);
      await saveNextIterationForSyncItem("66afb538f2887c252f668f77", nextIterationTime, true, true, false, 'Sync completed successfully', syncItem);

    } catch (error) {
      console.error('Error during sync job:', error);
      const nextIterationTime = new Date(Date.now() + 30 * 60000);
      await saveNextIterationForSyncItem("66afb538f2887c252f668f77", nextIterationTime, true, false, true, error.message, syncItem);

    }
  };

  const saveNextIterationForSyncItem = async (licenseNumber, nextIterationTime, isRun, isSuccess, isFail, message, syncItem) => {
    const ScheduledJobSyncItemEntry = new ScheduledJobForSyncItem({
      licenseNumber,
      nextIterationTime,
      isRun,
      isSuccess,
      isFail,
      errorMessage: isFail ? message : '',
      successMessage: isSuccess ? message : '',
      syncItem,
    });
    await ScheduledJobSyncItemEntry.save();
  }