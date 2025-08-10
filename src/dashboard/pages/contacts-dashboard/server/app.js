// server/app.js
const express = require('express');
const bodyParser = require('body-parser');
const contactsApi = require('./contacts-api');

const app = express();
app.use(bodyParser.json());
app.use(contactsApi);

module.exports = app;
