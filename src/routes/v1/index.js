const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const zohoRoute = require('./bg_prod.route');
const wordPressRoute = require('./wordPress.route');
const ItemSyncRoute = require('./itemSync.routes');
const OrderSyncRoute = require('./oderSync.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/bg_prod',
    route: zohoRoute,
  },
  {
    path: '/wordPress',
    route: wordPressRoute,
  },
  {
    path: '/itemSync',
    route: ItemSyncRoute,
  },
  {
    path: '/orderSync',
    route: OrderSyncRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
