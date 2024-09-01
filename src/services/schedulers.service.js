
const { ScheduledJobForSyncItem, OrderSyncSetup } = require('../models');
const { WordPressModel, wordPressCustomer, wordPressProduct, Licence } = require('../models');
const { wordPressService, licenceService } = require('../services');
const { post, put, getDynamic, get } = require('../commonServices/axios.service');
const axios = require('axios');

const { refreshToken } = require('../middlewares/licenceValidator')

exports.
  createCronJobForSyncOrder = async (req, res) => {
    try {
      //  const syncItem = { /* Your sync payload object */ };
      console.log('Running sync job...');
      console.log('Sync job completed successfully.');
      // const scheduledJob = await ScheduledJobForSyncItem.findOne({ licenseNumber:"66afb538f2887c252f668f77" }).sort({ nextIterationTime: -1 });
      // if (!scheduledJob && scheduledJob.nextIterationTime <= new Date()) {
      //     console.log("scheduledJob match", scheduledJob)
      // }

      const orderSyncs = await OrderSyncSetup.find({});
      //  console.log("orderSyncs", orderSyncs);
      if (orderSyncs) {
        for (const orderSync of orderSyncs) {
          try {
            console.log("orderSync.licenseNumber && orderSync.organizationId", orderSync.licenseNumber , orderSync.organizationId)
            if (orderSync.licenseNumber && orderSync.organizationId) {
              const orderSyncZoho = postOrderInZoho(orderSync.licenseNumber, orderSync.organizationId);
             // console.log("orderSyncZoho res", orderSyncZoho)
              if (orderSyncZoho) {
                // Log the current job execution
                const currentIterationTime = new Date();
                await saveCurrentIterationForSyncItem(orderSync.licenseNumber, currentIterationTime, true, true, false, 'Sync completed successfully', orderSyncZoho);

                // Schedule the next job iteration
                // const nextIterationTime = new Date(Date.now() + 5 * 60000); // 5 minutes
                //await scheduleNextIterationForSyncItem(orderSync.licenseNumber, nextIterationTime, false, 'Sync will scheduled after 30 minutes', syncItem);

              }
            }
          }
          catch (error) {
            console.error('Error during sync job:', error);
            //const nextIterationTime = new Date(Date.now() + 30 * 60000);
            await saveCurrentIterationForSyncItem(orderSync.licenseNumber, null, true, false, true, error.message, orderSyncZoho);
          }
        }
        return;
      }
    } catch (error) {
      throw error;
    }
  };

exports.createCronJobForSyncItemInventory = async (req, res) => {
  try {
    console.log("call createCronJobForSyncItemInventory")

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startOfDayUTC = new Date(startOfDay.toISOString());
    const endOfDayUTC = new Date(endOfDay.toISOString());
    console.log("startOfDayUTC, endOfDayUTC", startOfDayUTC, endOfDayUTC)
    await saveCurrentIterationForSyncItem("", null, false, false, true, "call  createCronJobForSyncItemInventory", { startOfDayUTC, endOfDayUTC });

    const licenses = await Licence.find({
      expireAt: {
        $gte: startOfDayUTC
       // $lt: endOfDayUTC
      }
    });

   // console.log("licenses",startOfDay, endOfDay, licenses);
   await saveCurrentIterationForSyncItem("", null, false, false, true, "fetch licenses", licenses);
    if (licenses) {
      for (const license of licenses) {
        if (license.zohoOrganizationId) {
          //console.log("license",license )
          const newRefreshToken = await refreshToken(license);
          const orderSyncZoho = await postOrderInZoho(newRefreshToken._id, newRefreshToken.zohoOrganizationId);
          //console.log("newRefreshToken", newRefreshToken)
          if (newRefreshToken) {
            //console.log("newRefreshToken", newRefreshToken)
            let config = {
              method: 'get',
              maxBodyLength: Infinity,
              url: `https://www.zohoapis.in/inventory/v1/items?organization_id=${license.zohoOrganizationId}`,
              headers: {
                'Authorization': `Bearer ${newRefreshToken.accessToken}`
              }
            };
           // console.log("config", config);
            const zohoResponse = await axios.request(config);
            await saveCurrentIterationForSyncItem(license._id, null, false, false, true, "fetch item Zoho", zohoResponse.data.message);
             //console.log("zohoResponse",  zohoResponse.data.message);
            if (zohoResponse.data.items.length) {
              for (const item of zohoResponse.data.items) {
               //  console.log("item", item)
                const wordPressProductItem = await wordPressProduct.findOne({ item_id: item.item_id }).lean(true);
                if (wordPressProductItem) {
                  await saveCurrentIterationForSyncItem(license._id, null, false, false, true, "fetch item", wordPressProductItem.data);
                 // console.log(item.stock_on_hand, wordPressProductItem.data.stock_quantity)
                  if (item.stock_on_hand != wordPressProductItem.data.stock_quantity) {
                     console.log( wordPressProductItem._id, item.stock_on_hand , wordPressProductItem.data.stock_quantity)
                    await wordPressProduct.findOneAndUpdate(
                      {
                        _id: wordPressProductItem._id,
                      },
                      {
                        $set: {
                          "data.stock_quantity": item.stock_on_hand
                        },
                      }
                    );
                  }
                }

              }
            }
          }
        }
      }
    }
  }
  catch (error) {
    console.error("Error fetching products:", error.response ? error.response.data : error.message);
    await saveCurrentIterationForSyncItem("license", null, false, false, true, error.message, error.response);

  }
}


const postOrderInZoho = async (licenceNumber, organizationId) => {
  try {

   // console.log("licenceNumber, organizationId", licenceNumber, organizationId)
    let orderItem;
    // console.log("postCreateOrder");
    const licence = await licenceService.findOne({ _id: licenceNumber });
    // console.log("res_token", res_token);
    const orders = await wordPressService.findOrder({ licenceNumber: licence._id, isSyncedToZoho: false });
    //console.log("orders", orders);
    // console.log("orders", orders.length)
    if (orders) {
      for (const item of orders) {
        // console.log("item",item.id)
        const wordPressProductItem = await wordPressProduct.findOne({ licenceNumber: licence._id, id: item.data.line_items[0].product_id }).lean(true);
        // console.log("wordPressProduct", wordPressProductItem)
        const customer = await wordPressCustomer.findOne({ licenceNumber: licence._id, "data.email": item.data.billing.email }).lean(true);
        if (customer) {
         // console.log("customer", customer.contact_id);
          let contact_id = customer.contact_id;
          orderItem = {
            "customer_id": contact_id,
            "salesorder_number": item.id,
            "date": item.data.date_created.split('T')[0],
            "shipment_date": "",
            "custom_fields": [],
            "is_inclusive_tax": false,
            "line_items": [
              {
                "item_order": 1,//will changes with lineItem index 
                "item_id": wordPressProductItem?.item_id,
                "rate": item.data.line_items[0].price.toFixed(2),
                "name": item.data.line_items[0].name,
                "description":
                  "Test Item",
                "quantity": item.data.line_items[0].quantity,
                "quantity_invoiced": item.data.line_items[0].quantity,
                "quantity_packed": item.data.line_items[0].quantity,
                "quantity_shipped": item.data.line_items[0].quantity,
                "discount": "0%",
                "tax_id": "",
                "tax_name": "IN-TAX-1",
                "tax_percentage": 18, //will changes dynamically later 
                "tags": [],
                "item_custom_fields": [],
                "unit": "g"
              }],
            "notes": "",
            "terms": "",
            "discount": 0,
            "is_discount_before_tax": true,
            "discount_type": "entity_level",
            "adjustment_description": "Adjustment",
            "pricebook_id": "",
            "template_id": "1944648000000000239",
            "documents": [],
            // "shipping_address_id": "1944648000000039384", 
            // "billing_address_id": "1944648000000039382", 
            //    "zcrm_potential_id": "", 
            // "zcrm_potential_name": "",
            "payment_terms": 0,
            "payment_terms_label": "Due on Receipt",
            "is_adv_tracking_in_package": false,
            "is_tcs_amount_in_percent": true
          };
          //  console.log("orderItem", orderItem)
          const data = {
            endpoint: 'salesorders' + `?organization_id=${organizationId}`,
            accessToken: licence.accessToken,
            data: JSON.stringify(orderItem), // Use orderItem instead of order
          };
          //    console.log("data", data)
          let zohoResponse = await post(data);
         // console.log("response API", zohoResponse.response);
          if (zohoResponse.response.data.code == 200) {
            await WordPressModel.findOneAndUpdate(
              {
                _id: item._id,
              },
              {
                $set: {
                  isSyncedToZoho: true
                },
              }
            );
          } else {
            await WordPressModel.findOneAndUpdate(
              {
                _id: item._id,
              },
              {
                $set: {
                  zohoResponse: {
                    config: zohoResponse.response.config,
                    response: zohoResponse.response.data
                  }
                },
              }
            );
          }
        }
      }
      return;
    }
    return;
  } catch (e) {
    console.error(e);
    return e;
  }
};


const saveCurrentIterationForSyncItem = async (licenseNumber, currentIterationTime, isRun, isSuccess, isFail, message, syncItem) => {
  const ScheduledJobSyncItemEntry = new ScheduledJobForSyncItem({
    //licenseNumber,
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