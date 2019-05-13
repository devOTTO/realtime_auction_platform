const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user')(sequelize, Sequelize);
db.Item = require('./item')(sequelize, Sequelize);
db.Auction = require('./auction')(sequelize, Sequelize);

db.Item.belongsTo(db.User, { as: 'seller' }); //판매자
db.Item.belongsTo(db.User, { as: 'buyer' }); //구매자

db.Auction.belongsTo(db.User);
db.Auction.belongsTo(db.Item);

db.User.hasMany(db.Auction);
db.Item.hasMany(db.Auction);


module.exports = db;
