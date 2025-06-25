'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};
const environment = CONFIG.app;
if (environment && environment.toLowerCase() == "test") {

  fs.readdirSync(__dirname)
    .filter((file) => {
      return (
        file.indexOf(".") !== 0 &&
        file !== basename &&
        file.slice(-3) === ".js"
      );
    })
    .forEach((file) => {
      db[file.slice(0, -3)] = {
        findOne: () => { },
        find: () => { },
        create: () => { },
        update: () => { },
        delete: () => { },
        findAndCountAll: () => { },
        count: () => { },
        findAll: () => { },
      };
    });

  db.sequelize = {
    transaction: (item) => { let runAfterCommit; return Promise.resolve({ commit: () => { if (runAfterCommit && runAfterCommit.func) { runAfterCommit.func(); } }, rollback: () => { }, afterCommit: (func) => { runAfterCommit = { func: func } } }) },
    QueryTypes: {
      SELECT: {}
    }
  }
}
else {
  const sequelize = new Sequelize(CONFIG.db_name, CONFIG.db_user, CONFIG.db_password, {
    host: CONFIG.db_host,
    dialect: CONFIG.db_dialect,
    port: CONFIG.db_port,
    operatorsAliases: 0,
    define: {
      timestamps: false
    },
    dialectOptions: {
      decimalNumbers: true
    },
    pool: {
      max: Number(CONFIG.max_pool_conn),
      min: Number(CONFIG.min_pool_conn),
      idleTime: CONFIG.conn_idle_time
    }
  });

  fs
    .readdirSync(__dirname)
    .filter(file => {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });


  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
}

module.exports = db;
