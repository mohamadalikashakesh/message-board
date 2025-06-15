//Express app setup

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors());

// Routes
module.exports = app;