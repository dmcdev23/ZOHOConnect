const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { licenceService, wordPressService } = require('../services');
const { post, put, getDynamic } = require('../commonServices/axios.service');
const { tr } = require('faker/lib/locales');
const { WordPressModel, wordPressCustomer, wordPressProduct } = require('../models');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const createLicence = catchAsync(async (req, res) => {
  try {
    const data = await licenceService.createLicence(req.body);
    res.status(httpStatus.OK).send(data);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const getOrganizations = catchAsync(async (req, res) => {

  try {
    const res_token = await licenceService.findOne({ _id: new ObjectId(req.query.licenceNumber) });
    // req.user.accessToken = res_token.accessToken; 
    const data = await licenceService.getOrganizations(req.user.licence[req.query.licenceNumber], res_token?.accessToken);
    res.status(httpStatus.OK).send(data?.organizations);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});
const createOrganizations = catchAsync(async (req, res) => {
  try {
    const data = await post({
      endpoint: 'organizations',
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: JSON.stringify(req.body),
    });
    res.status(httpStatus.OK).send(data.organizations);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});
const updateOrganizations = catchAsync(async (req, res) => {
  try {
    const data = await put({
      endpoint: 'organizations',
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: JSON.stringify(req.body),
    });
    res.status(httpStatus.OK).send(data.organizations);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const createItem = catchAsync(async (req, res) => {
  try {
    const { data } = await post({
      endpoint: 'items' + `organization_id=${req.query.organization_id}`,
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: req.body,
    });
    res.status(httpStatus.OK).send(data);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const getItems = catchAsync(async (req, res) => {
  try {
    const data = await licenceService.getItems(req);
    res.status(httpStatus.OK).send(data);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const updateItems = catchAsync(async (req, res) => {
  try {
    const data = await put({
      endpoint: 'items' + ('' || `${req.query.itemId}`) + `organization_id=${req.query.organization_id}`,
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: JSON.stringify(req.body),
    });
    res.status(httpStatus.OK).send(data.item);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const createSale = catchAsync(async (req, res) => {
  try {
    const { data } = await post({
      endpoint: 'salesorders' + `?organization_id=${req.query.organization_id}`,
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: JSON.stringify(req.body),
    });
    res.status(httpStatus.OK).send(data.salesorder);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const updateSale = catchAsync(async (req, res) => {
  try {
    const { data } = await put({
      endpoint: `salesorders/${req.query.salesId}` + `?organization_id=${req.query.organization_id}`,
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: JSON.stringify(req.body),
    });
    res.status(httpStatus.OK).send(data.salesorder);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const getSale = catchAsync(async (req, res) => {
  try {
    const { data } = await getDynamic({
      endpoint: 'salesorders' + (req.query.salesId ? `/${req.query.salesId}` : '/') + `?organization_id=${req.query.organization_id}`,
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
    });
    res.status(httpStatus.OK).send(data.salesorders || data.salesorder);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const createContact = catchAsync(async (req, res) => {
  try {
    const data = await postCreateContact(req);
    res.status(httpStatus.OK).send(data);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const updateContact = catchAsync(async (req, res) => {
  try {
    const data = await put({
      endpoint: `contacts/${req.query.contactId}` + `?organization_id=${req.query.organization_id}`,
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: JSON.stringify(req.body),
    });
    res.status(httpStatus.OK).send(data);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const getContacts = catchAsync(async (req, res) => {
  try {
    const res_token = await licenceService.findOne({ _id: new ObjectId(req.query.licenceNumber) });
    const data = await licenceService.getContacts(req, req.user.licence[req.query.licenceNumber], res_token?.accessToken);
    res.status(httpStatus.OK).send(data);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const getLicence = catchAsync(async (req, res) => {
  try {
    const data = await licenceService.getLicence(req);
    const updatedArray = data.map((item) => {
      const newItem = { ...item._doc, _id: item.id };
      delete newItem.id;
      return newItem;
    });
    res.status(httpStatus.OK).send(updatedArray);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});

const postCreateContact = async (req) => {
  try {
    const res_token = await licenceService.findOne({ _id: new ObjectId(req.query.licenceNumber) });
    return await post({
      endpoint: 'contacts' + `?organization_id=${req.query.organization_id}`,
      accessToken: res_token?.accessToken,
      data: req.body,
    }, req.user.licence[req.query.licenceNumber]);
  } catch (e) {
    return e
  }
}

const postCreateItem = async (req) => {
  try {
    const res_token = await licenceService.findOne({ _id: new ObjectId(req.query.licenceNumber) });
    const body = {
      endpoint: 'items' + `?organization_id=${req.query.organization_id}`,
      accessToken: res_token?.accessToken,
      data: req.body,
    }
    // console.log("req postCreateItem", body, req.query.licenceNumber)
    return await post(body);
  } catch (e) {
    throw e
  }
}

// const postCreateOrder = async (req)=>{
//   try {
//     console.log("postCreateOrder")
//     const res_token = await licenceService.findOne({_id:new ObjectId(req.query.licenceNumber)});

//     let orderItem = {

//       "customer_id": 1944648000000039379,
//       "salesorder_number": "SO-00003",
//       "date": "2015-05-28",
//       "shipment_date": "2015-06-02",
//       "reference_number": "REF-S-00003",
//       "line_items": [
//         {
//           "item_id": 1944648000000037191,
//           "name": "Laptop-white/15inch/dell",
//           "description": "Just a sample description.",
//           "rate": 122,
//           "quantity": 2,
//           "unit": "qty",
//           "tax_name": "Sales Tax",
//           "tax_type": "tax",
//           "tax_percentage": 12,
//           "item_total": 244,

//         }
//       ],
//       "notes": "Sample Note",
//       "terms": "Terms and Conditions",
//       "discount": "20.00%",
//       "is_discount_before_tax": true,
//       "discount_type": "entity_level",
//       "shipping_charge": 7,
//       "delivery_method": "FedEx",
//       "adjustment": 0,
//       "adjustment_description": "Just an example description.",
//       "is_inclusive_tax": false,
//       "exchange_rate": 1,
//     }
//       console.log("JSON.stringify(orderItem)",JSON.stringify(orderItem))
//     const data  = {
//       endpoint: 'salesorders'  +`?organization_id=${req.query.organization_id}`,
//       accessToken: res_token?.accessToken,
//       data: JSON.stringify(order),
//     };
//     console.log("postCreateOrder data", data)
//    return await post(data);
//   } catch (e) {
//     console.error(e);
//     return e;
//   }
// }


const postCreateOrder = async (req, res) => {
  try {

    let orderItem;
    console.log("postCreateOrder");
    const res_token = await licenceService.findOne({ _id: new ObjectId(req.query.licenceNumber) });
    const orders = await wordPressService.findOrder({ licenceNumber: ObjectId(req.query.licenceNumber) });
    //console.log("orders", orders)
    if(orders){
      for (const item of orders) {
      console.log("item",req.query.licenceNumber, item.data.line_items[0].product_id)

      const wordPressProductItem = await wordPressProduct.findOne({licenceNumber:  ObjectId(req.query.licenceNumber), id: item.data.line_items[0].product_id}).lean(true);
     // console.log("wordPressProduct", wordPressProductItem)
        const customer = await wordPressCustomer.findOne({ licenceNumber: ObjectId(req.query.licenceNumber), "data.email": item.data.billing.email  }).lean(true);
        if (customer) {
          console.log("customer", customer.contact_id);
          let contact_id = customer.contact_id;
          orderItem = {
            "customer_id": contact_id,
           // "contact_persons": [contact_id], 
             "date": item.data.date_created.split('T')[0], 
             "shipment_date": "", 
             "custom_fields": [], 
             "is_inclusive_tax": false,
              "line_items": [
               { 
                 "item_order": 1, 
                 "item_id": wordPressProductItem?.item_id, 
                 "rate":  item.data.line_items[0].price.toFixed(2), 
                 "name": item.data.line_items[0].name, 
                 "description": 
                 "Test Item", 
                 "quantity":  item.data.line_items[0].quantity,
                 "discount": "0%", 
                 "tax_id": "", 
                 "tags": [], 
                 "item_custom_fields": [], 
                 "unit": "g" }], 
                 "notes": "",
                  "terms": "", 
                  "discount": 0, 
                  "is_discount_before_tax": true, 
                  "discount_type": "entity_level",
                  "adjustment_description": "Adjustment", 
                  "pricebook_id": "",
                   "template_id": "1944648000000000239",
                    "documents": [], 
                    "shipping_address_id": "1944648000000039384", 
                    "billing_address_id": "1944648000000039382", 
                //    "zcrm_potential_id": "", 
                   // "zcrm_potential_name": "",
                     "payment_terms": 0, 
                     "payment_terms_label": "Due on Receipt", 
                     "is_adv_tracking_in_package": false, 
                     "is_tcs_amount_in_percent": true
              };
             //  console.log("orderItem", orderItem)
              const data = {
                endpoint: 'salesorders' + `?organization_id=${req.query.organization_id}`,
                accessToken: res_token?.accessToken,
                data: JSON.stringify(orderItem), // Use orderItem instead of order
              };
          
               await post(data);

        }
      }
    }

   
    

  //  console.log("JSON.stringify(orderItem)", orderItem);

    
    res.status(httpStatus.OK).send({ msg: 'Order  sync in progress' });

  } catch (e) {
    console.error(e);
    return e;
  }
};


const transformData = async (req, data, transformWhat) => {
  try {
    const transformMap = {
      createCustomers: (element) => {
        try {
          console.log(element.data);
          return {
            contact_name: element.data.first_name + element.data.last_name,
            company_name: element?.data?.billing?.company,
            contact_type: "customer",
            billing_address: {
              address: element?.data?.billing?.address_1,
              street2: element?.data?.billing?.address_2,
              city: element?.data?.billing?.city,
              state: element?.data?.billing?.state,
              zip: element?.data?.billing?.postcode,
              country: element?.data?.billing?.country,
            },
            shipping_address: {
              address: element.data.shipping.address_1,
              street2: element.data.shipping.address_2,
              city: element.data.shipping.city,
              state: element.data.shipping.state,
              zip: element.data.shipping.postcode,
              country: element.data.shipping.country,
            },
            contact_persons: [{
              first_name: element.data.first_name,
              last_name: element.data.last_name,
              email: element?.data?.email,
              phone: element?.data?.billing?.phone,
              is_primary_contact: true,
            }],
          }
        } catch (e) {
          throw e;
        }
      },
      createProducts: (element) => {
        try {
          return {
            "group_name": element?.data?.name,
            "unit": "qty",
            "item_type": "sales",
            "product_type": "goods",
            "description": "element?.data?.description",
            "name": element?.data?.name,
            "rate": parseFloat(element?.data?.price),
            "initial_stock": element?.data?.stock_quantity,
            "sku": element?.data?.sku,
            "available_stock": element?.data?.stock_quantity
          }
        } catch (e) {
          throw e;
        }
      },
      createOrders: (element) => {

        try {
          let order = {

            "customer_id": 1944648000000039379,
            "salesorder_number": "SO-00003",
            "date": "2015-05-28",
            "shipment_date": "2015-06-02",
            "reference_number": "REF-S-00003",
            "line_items": [
              {
                "item_id": 1944648000000037191,
                "name": "Laptop-white/15inch/dell",
                "description": "Just a sample description.",
                "rate": 122,
                "quantity": 2,
                "unit": "qty",
                "tax_name": "Sales Tax",
                "tax_type": "tax",
                "tax_percentage": 12,
                "item_total": 244,

              }
            ],
            "notes": "Sample Note",
            "terms": "Terms and Conditions",
            "discount": "20.00%",
            "is_discount_before_tax": true,
            "discount_type": "entity_level",
            "shipping_charge": 7,
            "delivery_method": "FedEx",
            "adjustment": 0,
            "adjustment_description": "Just an example description.",
            "is_inclusive_tax": false,
            "exchange_rate": 1,


            //...element,
            //"date": !!element.date ? element.date.split('T')[0] : null,
            //"shipment_date": !!element.shipment_date? element.shipment_date.split('T')[0] : null,
          }
          delete order._id
          return order;
        } catch (e) {
          throw e;
        }
      },
    };
    return data.map(element => {
      return transformMap[transformWhat](element);
    })
  } catch (e) {
    throw e;
  }
}
module.exports = {
  createLicence,
  getOrganizations,
  createOrganizations,
  updateOrganizations,
  createItem,
  getItems,
  updateItems,
  createSale,
  createContact,
  getContacts,
  updateContact,
  updateSale,
  getSale,
  getLicence,
  postCreateContact,
  transformData,
  postCreateItem,
  postCreateOrder
};
