const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { licenceService, wordPressService } = require('../services');
const { post, put, getDynamic } = require('../commonServices/axios.service');
const { tr } = require('faker/lib/locales');
const { WordPressModel, wordPressCustomer } = require('../models');
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
    const data = await licenceService.getOrganizations(req.user.licence[req.query.licenceNumber]);
    res.status(httpStatus.OK).send(data?.organizations);
  } catch (e) {
    console.error(e);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e?.response?.data || e?.response || e);
  }
});
const createOrganizations = catchAsync(async (req, res) => {
  try {
    const data = await post({
      endpoint: '/organizations',
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
      endpoint: '/organizations',
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
      endpoint: '/items' + `organization_id=${req.query.organization_id}`,
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
      endpoint: '/items' + ('' || `${req.query.itemId}`) +`organization_id=${req.query.organization_id}`,
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
      endpoint: '/salesorders'  +`?organization_id=${req.query.organization_id}`,
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
      endpoint: `/salesorders/${req.query.salesId}`  +`?organization_id=${req.query.organization_id}`,
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
      endpoint: '/salesorders' + (req.query.salesId ? `/${req.query.salesId}` : '/')  +`?organization_id=${req.query.organization_id}`,
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
      endpoint: `/contacts/${req.query.contactId}` +`?organization_id=${req.query.organization_id}`,
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
    const data = await licenceService.getContacts(req);
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
    return await post({
      endpoint: 'contactpersons'  +`?organization_id=${req.query.organization_id}`,
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: req.body,
    }, req.user.licence[req.query.licenceNumber]);
  }catch (e) {
    return e
  }
}

const postCreateItem = async (req) => {
  try {
    const body = {
      endpoint: '/items' + `?organization_id=${req.query.organization_id}`,
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: req.body,
    }
    return await post(body);
  }catch (e) {
    return e
  }
}

const postCreateOrder = async (req)=>{
  try {
    const data  = await post({
      endpoint: 'salesorders'  +`?organization_id=${req.query.organization_id}`,
      accessToken: req.user.licence[req.query.licenceNumber].accessToken,
      data: JSON.stringify(req.body),
    });
    return data;
  } catch (e) {
    console.error(e);
    return e;
  }
}


const transformData = async (req,data, transformWhat) => {
try{
  const transformMap = {
    createCustomers: (element)=> {
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
      }catch (e) {
        throw e;
      }
    },
    createProducts: (element)=> {
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
          "sku": element?.data?.sku
        }
      }catch (e) {
        throw e;
      }
    },
    createOrders: (element)=> {
      try {
        let order = {
          ...element,
          "date": !!element.date ? element.date.split('T')[0] : null,
          "shipment_date": !!element.shipment_date? element.shipment_date.split('T')[0] : null,
        }
        delete order._id
        return order;
      }catch (e) {
        throw e;
      }
    },
  };
  return data.map(element => {
    return transformMap[transformWhat](element);
  })
}catch (e) {
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
  getSale ,
  getLicence,
  postCreateContact,
  transformData,
  postCreateItem,
  postCreateOrder
};
