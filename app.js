'use strict';
const express = require('express');
const app = express();
require('./config/config');
const bodyParser = require('body-parser');
const v1 = require('./routes/v1');
const cors = require('cors');
const crypto = require('./services/crypto.service');

app.use(cors());
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '200mb' }));

const models = require("./models");
models.sequelize.authenticate().then(() => {
console.log('Connected to SQL database:', CONFIG.db_name);
}).catch(err => {
console.error('Unable to connect to SQL database:', CONFIG.db_name, err.message);
});
if (CONFIG.app === 'local') {
models.sequelize.sync();
// models.sequelize.sync({ force: true });
// models.sequelize.sync({ alter: true });
}

app.use(function (req, res, next) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization, Content-Type');
res.setHeader('Access-Control-Allow-Credentials', true);
next();
});

app.use((req, res, next) => {
  if(req && req.headers && req.headers.authorization) {
      req.headers.authorization = crypto.dcrypt(req.headers.authorization);
  }
  next();
})

app.use('/v1', v1);


module.exports = app;