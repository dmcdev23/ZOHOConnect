const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createOrganization = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    fiscal_year_start_month: Joi.string(),
    currency_code: Joi.string().required(),
    time_zone: Joi.string().required(),
    date_format: Joi.date(),
    field_separator: Joi.string(),
    language_code: Joi.string().min(2).max(2).default('en'),
    industry_type: Joi.string(),
    industry_size: Joi.string(),
    portal_name: Joi.string().required(),
    org_address: Joi.string(),
    remit_to_address: Joi.string(),
    address: Joi.array().items({
      street_address1: Joi.string(),
      street_address2: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
      zip: Joi.string(),
    }),
  }),
};

const updateOrganization = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    fiscal_year_start_month: Joi.string(),
    currency_code: Joi.string(),
    time_zone: Joi.string(),
    date_format: Joi.date(),
    field_separator: Joi.string(),
    language_code: Joi.string(),
    industry_type: Joi.string(),
    industry_size: Joi.string(),
    portal_name: Joi.string(),
    org_address: Joi.string(),
    remit_to_address: Joi.string(),
    address: Joi.array().items({
      street_address1: Joi.string(),
      street_address2: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
      zip: Joi.string(),
    }),
  }),
};

const getItems = {
  query: Joi.object().keys({
    organization_id: Joi.string().required(),
    clientId: Joi.string().required(),
    licenceNumber: Joi.string().required(),
    itemId: Joi.string(),
  }),
};

const createItem = {
  body: Joi.object().keys({
    group_id: Joi.number(),
    group_name: Joi.string(),
    unit: Joi.string(),
    documents: Joi.array().items(Joi.string()),
    item_type: Joi.string(),
    product_type: Joi.string(),
    is_taxable: Joi.boolean(),
    tax_id: Joi.number(),
    description: Joi.string(),
    purchase_account_id: Joi.number(),
    inventory_account_id: Joi.number(),
    attribute_name1: Joi.string(),
    name: Joi.string().required(),
    rate: Joi.number(),
    purchase_rate: Joi.number(),
    reorder_level: Joi.number(),
    initial_stock: Joi.number(),
    initial_stock_rate: Joi.number(),
    vendor_id: Joi.number(),
    vendor_name: Joi.string(),
    sku: Joi.string(),
    upc: Joi.number(),
    ean: Joi.number(),
    isbn: Joi.number(),
    part_number: Joi.number(),
    attribute_option_name1: Joi.string(),
    purchase_description: Joi.string(),
    item_tax_preferences: Joi.array().items({
      tax_id: Joi.number(),
      tax_specification: Joi.string(),
    }),
    hsn_or_sac: Joi.number(),
    sat_item_key_code: Joi.string(),
    unitkey_code: Joi.string(),
    custom_fields: Joi.array().items({
      customfield_id: Joi.string(),
      value: Joi.string(),
    }),
  }),
  query: Joi.object().keys({
    organization_id: Joi.string().required(),
    clientId: Joi.string().required(),
    licenceNumber: Joi.string().required(),
  }),
};

const updateItem = {
  body: Joi.object().keys({
    group_id: Joi.number(),
    group_name: Joi.string(),
    unit: Joi.string(),
    documents: Joi.array().items(Joi.string()),
    item_type: Joi.string(),
    product_type: Joi.string(),
    is_taxable: Joi.boolean(),
    tax_id: Joi.number(),
    description: Joi.string(),
    purchase_account_id: Joi.number(),
    inventory_account_id: Joi.number(),
    attribute_name1: Joi.string(),
    name: Joi.string().required(),
    rate: Joi.number(),
    purchase_rate: Joi.number(),
    reorder_level: Joi.number(),
    initial_stock: Joi.number(),
    initial_stock_rate: Joi.number(),
    vendor_id: Joi.number(),
    vendor_name: Joi.string(),
    sku: Joi.string(),
    upc: Joi.number(),
    ean: Joi.number(),
    isbn: Joi.number(),
    part_number: Joi.number(),
    attribute_option_name1: Joi.string(),
    purchase_description: Joi.string(),
    item_tax_preferences: Joi.array().items({
      tax_id: Joi.number(),
      tax_specification: Joi.string(),
    }),
    hsn_or_sac: Joi.number(),
    sat_item_key_code: Joi.string(),
    unitkey_code: Joi.string(),
    custom_fields: Joi.array().items({
      customfield_id: Joi.string(),
      value: Joi.string(),
    }),
  }),
  query: Joi.object().keys({
    organization_id: Joi.string().required(),
    clientId: Joi.string().required(),
    licenceNumber: Joi.string().required(),
    itemId: Joi.string().required(),
  }),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};
const linkZOHO = {
  params: Joi.object().keys({
    client_id: Joi.string().required(),
    client_secret: Joi.string().required(),
    licenceNumber: Joi.string().required(),
  }),
};
const createLicence = {
  body: Joi.object().keys({
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    licenceNumber: Joi.string().required(),
    refreshToken: Joi.string().required(),
    accessToken: Joi.string(),
  }),
};
const getOrganizations = {
  query: Joi.object().keys({
    clientId: Joi.string().required(),
    licenceNumber: Joi.string().required(),
  }),
};

module.exports = {
  createOrganization,
  getOrganizations,
  updateOrganization,
  createItem,
  getItems,
  updateItem,
};
