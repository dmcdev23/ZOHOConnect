
const { ScheduledJobForSyncItem } = require('../models');

exports.
runSyncJob = async () => {
    try {
      const syncItem = { /* Your sync payload object */ };
      console.log('Running sync job...');
      console.log('Sync job completed successfully.');
      const scheduledJob = await ScheduledJobForSyncItem.findOne({ licenseNumber:"66afb538f2887c252f668f77" }).sort({ nextIterationTime: -1 });
      if (!scheduledJob && scheduledJob.nextIterationTime <= new Date()) {
          console.log("scheduledJob match", scheduledJob)
      }
     // Log the current job execution
    const currentIterationTime = new Date();
    await saveCurrentIterationForSyncItem("66afb538f2887c252f668f77", currentIterationTime, true, true, false, 'Sync completed successfully', syncItem);

    // Schedule the next job iteration
    const nextIterationTime = new Date(Date.now() + 5 * 60000); // 5 minutes
    await scheduleNextIterationForSyncItem("66afb538f2887c252f668f77", nextIterationTime, false, 'Sync will scheduled after 30 minutes', syncItem);

   
    } catch (error) {
      console.error('Error during sync job:', error);
      const nextIterationTime = new Date(Date.now() + 30 * 60000);
      await saveCurrentIterationForSyncItem("66afb538f2887c252f668f77", nextIterationTime, true, false, true, error.message, syncItem);

    }
  };

  
  const saveCurrentIterationForSyncItem = async (licenseNumber, currentIterationTime, isRun, isSuccess, isFail, message, syncItem) => {
    const ScheduledJobSyncItemEntry = new ScheduledJobForSyncItem({
      licenseNumber,
      jobExecutedTime: currentIterationTime,
      isRun,
      isSuccess,
      isFail,
      errorMessage: isFail ? message : '',
      successMessage: isSuccess ? message : '',
      syncItem,
    });
    await ScheduledJobSyncItemEntry.save();
  }

  const scheduleNextIterationForSyncItem = async (licenseNumber, nextIterationTime, isRun, message, syncItem) => {
  
    const ScheduledJobSyncItemEntry = new ScheduledJobForSyncItem({
      licenseNumber,
      nextIterationTime,
      isRun,
      isSuccess: false,
      isFail: false,
      errorMessage: '',
      successMessage: message,
      syncItem,
    });
    await ScheduledJobSyncItemEntry.save();
  };