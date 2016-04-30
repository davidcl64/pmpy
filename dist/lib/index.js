'use strict';

require('./polyfill');

module.exports = exports = {
  consul: require('./consul'),
  io: require('./io'),
  util: require('./util')
};
