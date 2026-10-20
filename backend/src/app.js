"use strict";

const path = require("path");
const express = require("express");
const cors = require("cors");

const { FRONTEND_DIR } = require("./config");
const { sql, poolPromise } = require("./db");
const { sha256, signToken, publicUser } = require("./utils/security");
const httpUtils = require("./utils/http");
const { auth, allow } = require("./middleware/auth");
const services = require("./services/studentService");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.static(FRONTEND_DIR));

const ctx = {
  path,
  FRONTEND_DIR,
  sql,
  poolPromise,
  auth,
  allow,
  sha256,
  signToken,
  publicUser,
  ...httpUtils,
  getStudentByUser: (pool, userId) =>
    services.getStudentByUser(pool, sql, userId),
  confirmedPaid: (pool, applicationId) =>
    services.confirmedPaid(pool, sql, applicationId),
  roomOccupancy: (pool, roomId) => services.roomOccupancy(pool, sql, roomId),
  getApplicationForAccess: (pool, applicationId, user) =>
    services.getApplicationForAccess(pool, sql, applicationId, user),
};

require("./routes/authRoutes.js")(app, ctx);
require("./routes/dashboardRoutes.js")(app, ctx);
require("./routes/userRoutes.js")(app, ctx);
require("./routes/catalogRoutes.js")(app, ctx);
require("./routes/applicationRoutes.js")(app, ctx);
require("./routes/paymentRoutes.js")(app, ctx);
require("./routes/requestRoutes.js")(app, ctx);
require("./routes/reportRoutes.js")(app, ctx);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
