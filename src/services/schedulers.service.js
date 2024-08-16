
const { ScheduledJobForSyncItem, OrderSyncSetup } = require('../models');
const wordPressController = require('../controllers/wordPress.controller');



exports.
  runSyncJob = async (req, res) => {
    try {
      const syncItem = { /* Your sync payload object */ };
      console.log('Running sync job...');
      console.log('Sync job completed successfully.');
      // const scheduledJob = await ScheduledJobForSyncItem.findOne({ licenseNumber:"66afb538f2887c252f668f77" }).sort({ nextIterationTime: -1 });
      // if (!scheduledJob && scheduledJob.nextIterationTime <= new Date()) {
      //     console.log("scheduledJob match", scheduledJob)
      // }

      const orderSyncs = await OrderSyncSetup.find({});
      console.log("orderSyncs", orderSyncs);
      if (orderSyncs) {
        for (const orderSync of orderSyncs) {

          try {
            req.query.licenceNumber = orderSync.licenseNumber;
            const productSync = wordPressController.syncProduct(req, res);
            console.log("productSync", productSync)
            if (productSync) {
              // Log the current job execution
              const currentIterationTime = new Date();
              await saveCurrentIterationForSyncItem(orderSync.licenseNumber, currentIterationTime, true, true, false, 'Sync completed successfully', syncItem);

              // Schedule the next job iteration
              // const nextIterationTime = new Date(Date.now() + 5 * 60000); // 5 minutes
              //await scheduleNextIterationForSyncItem(orderSync.licenseNumber, nextIterationTime, false, 'Sync will scheduled after 30 minutes', syncItem);

            }
          }
          catch (error) {
            console.error('Error during sync job:', error);
            //const nextIterationTime = new Date(Date.now() + 30 * 60000);
            await saveCurrentIterationForSyncItem(orderSync.licenseNumber, null, true, false, true, error.message, syncItem);

          }

        }

      }
    } catch (error) {
      throw error;
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