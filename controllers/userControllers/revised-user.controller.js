const randToken = require('rand-token');
const { ReE, ReS, to } = require('../../responseHandler');
const jwtToken = require('../../services/jwt.service');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');

const Customer = require('../../models').customer;
const Employee = require('../../models').employee;
const Role = require('../../models').role;
const Department = require('../../models').department;
const mailer = require('../../services/sendEmail.service');
const passwordEmail = require('../../constants/passwordEmail');
const otpEmail = require('../../constants/otpEmail');
const emailSetup = require('../../services/emailSetup');
const SUCCESS = require('../../constants/messages').SUCCESS;
const ERROR = require('../../constants/messages').ERROR;

const signup = async (req, res) => {
  const { name, industry, firstName, lastName, email } = req.body;
  let err, customer, employee;

  [err, customer] = await to(Customer.create({ name, industry }));
  if (err) return ReE(req, res, err, 402);

  [err, employee] = await to(Employee.create({
    firstName,
    lastName,
    email,
    customerId: customer.id,
    roleId: 1,
    departmentId: 1
  }));
  if (err) return ReE(req, res, err, 402);

  const passwordToken = randToken.uid(128);
  [err] = await to(Employee.update(
    { passwordToken },
    { where: { id: employee.id } }
  ));
  if (err) return ReE(req, res, err, 422);

  const setup = {
    name,
    supportLink: CONFIG.admin_mail,
    resetLink: `${CONFIG.dev_host}/v1/verifyToken/${passwordToken}`,
  };
  const template = emailSetup(setup, passwordEmail);
  const subject = 'Password Set up Link';

  const { mError } = await mailer(email, subject, template);
  if (mError) return ReE(req, res, mError, 422);

  return ReS(res, { data: { employee }, message: SUCCESS.PASSWORD_SETUP_LINK_SENT }, 200);
};

const verifyToken = async (req, res) => {
  const token = req.params.id;
  let err, employee;

  [err, employee] = await to(Employee.findOne({ where: { passwordToken: token } }));
  if (err) return ReE(req, res, err, 422);
  if (!employee) return ReE(req, res, { message: ERROR.INVALID_EMAIL }, 400);

  const now = moment.utc();
  const tokenExpireTime = moment.utc(employee.passwordTokenExpire);

  if (now.isBefore(tokenExpireTime)) {
    return ReS(res, { data: `${CONFIG.dev_host}/v1/createPassword/${token}`, message: "Success" }, 200);
  } else {
    return ReE(req, res, { message: ERROR.TOKEN_EXPRIED }, 401);
  }
};

const createPassword = async (req, res) => {
  const token = req.params.id;
  let err, employee;

  [err, employee] = await to(Employee.findOne({ where: { passwordToken: token } }));
  if (err) return ReE(req, res, err, 422);
  if (!employee) return ReE(req, res, { message: ERROR.INVALID_EMAIL }, 400);

  const now = moment.utc();
  const tokenExpireTime = moment.utc(employee.passwordTokenExpire);

  if (now.isBefore(tokenExpireTime)) {
    const { password } = req.body;
    [err] = await to(Employee.update({
      password,
      passwordToken: null,
      passwordTokenExpire: null
    }, {
      where: { id: employee.id },
      individualHooks: true
    }));
    if (err) return ReE(req, res, err, 422);

    return ReS(res, { message: SUCCESS.PASSWORD }, 200);
  } else {
    return ReE(req, res, { message: ERROR.TOKEN_EXPRIED }, 401);
  }
};

const createUser = async (req, res) => {
  const { firstName, lastName, email, roleId, departmentId } = req.body;
  let err, employee;

  [err, employee] = await to(Employee.findOne({ where: { email } }));
  if (err) return ReE(req, res, err, 422);
  if (employee) return ReE(req, res, { message: ERROR.USER_EXISTS }, 400);

  [err, employee] = await to(Employee.create({
    firstName,
    lastName,
    email,
    customerId: req.user.customerId,
    roleId,
    departmentId
  }));
  if (err) return ReE(req, res, err, 422);

  const passwordToken = randToken.uid(128);
  [err] = await to(Employee.update({ passwordToken }, { where: { id: employee.id } }));
  if (err) return ReE(req, res, err, 422);

  const setup = {
    name: firstName + lastName,
    supportLink: CONFIG.admin_mail,
    resetLink: `${CONFIG.dev_host}/v1/verifyToken/${passwordToken}`,
  };
  const template = emailSetup(setup, passwordEmail);
  const subject = 'Password Set up Link';

  const { mError } = await mailer(email, subject, template);
  if (mError) return ReE(req, res, mError, 422);

  return ReS(res, { data: { employee }, message: SUCCESS.PASSWORD_SETUP_LINK_SENT }, 200);
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const now = moment.utc();

  let err, employee;
  [err, employee] = await to(Employee.findOne({ where: { email }, include: [{ model: Role, attributes: ['name'], as: "role" }] }));
  if (err) return ReE(req, res, err, 422);
  if (!employee) return ReE(req, res, { message: ERROR.INVALID_EMAIL }, 422);

  if (employee.blockTime) {
    const blockTime = moment.utc(employee.blockTime);
    if (now.isBefore(blockTime)) {
      const remainingMinutes = blockTime.diff(now, 'minutes');
      return ReE(req, res, { message: ERROR.ACCOUNT_BLOCKED + `${remainingMinutes} minutes.` }, 403);
    } else {
      employee.loginCount = 0;
      employee.otpCount = 0;
      employee.blockTime = null;
      await employee.save();
    }
  }

  const isMatch = await bcrypt.compare(password, employee.password);
  if (!isMatch) {
    employee.loginCount += 1;
    if (employee.loginCount >= 5) {
      employee.blockTime = moment.utc().add(2, 'hours').toDate();
    }
    await employee.save();
    return ReE(req, res, { message: ERROR.INVALID_CREDENTIALS }, 422);
  }

  employee.loginCount = 0;

  if (!employee.twoFactor) {
    await employee.save();
    return successfulLogin(req, res, employee);
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  employee.otp = otp;
  employee.otpCreatedAt = moment.utc().toDate();
  employee.otpCount += 1;

  if (employee.otpCount > 3) {
    employee.blockTime = moment.utc().add(2, 'hours').toDate();
    await employee.save();
    return ReE(req, res, { message: ERROR.MAX_OTP_REQUEST }, 403);
  }

  await employee.save();

  const setup = {
    name: employee.firstName,
    otpCode: otp,
    supportLink: CONFIG.admin_mail,
  };
  const template = emailSetup(setup, otpEmail);
  const subject = 'Your OTP Code';

  const { mError } = await mailer(email, subject, template);
  if (mError) return ReE(req, res, mError, 422);

  return ReS(res, { data: { employeeId: employee.id }, message: SUCCESS.OTP_EMAIL_SENT }, 200);
};

const resendOtp = async (req, res) => {
  const now = moment.utc();
  const { email } = req.body;

  let err, employee;
  [err, employee] = await to(Employee.findOne({ where: { email } }));
  if (!employee) return ReE(req, res, { message: ERROR.INVALID_EMAIL }, 422);

  const blockTime = moment.utc(employee.blockTime);
  if (blockTime.isAfter(now)) {
    const remainingTime = blockTime.diff(now, 'minutes');
    return ReE(req, res, { message: ERROR.ACCOUNT_BLOCKED + `${remainingTime} minutes.` }, 403);
  }

  employee.otpCount += 1;
  if (employee.otpCount > 3) {
    employee.blockTime = moment.utc().add(2, 'hours').toDate();
    await employee.save();
    return ReE(req, res, { message: ERROR.MAX_OTP_REQUEST }, 403);
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  employee.otp = otp;
  employee.otpCreatedAt = now.toDate();
  await employee.save();

  const setup = {
    name: employee.firstName,
    otpCode: otp,
    supportLink: CONFIG.admin_mail,
  };
  const template = emailSetup(setup, otpEmail);
  const subject = 'Your OTP Code';

  const { mError } = await mailer(employee.email, subject, template);
  if (mError) return ReE(req, res, mError, 422);

  return ReS(res, { message: SUCCESS.OTP_EMAIL_SENT }, 200);
};

const confirmOtp = async (req, res) => {
  const now = moment.utc();
  const { otp, email } = req.body;

  let err, employee;
  [err, employee] = await to(Employee.findOne({ where: { email }, include: [{ model: Role, attributes: ['name'], as: "role" }] }));
  if (!employee) return ReE(req, res, { message: ERROR.INVALID_EMAIL }, 422);

  const blockTime = moment.utc(employee.blockTime);
  if (blockTime.isAfter(now)) {
    const remainingTime = blockTime.diff(now, 'minutes');
    return ReE(req, res, { message: ERROR.ACCOUNT_BLOCKED + `${remainingTime} minutes.` }, 403);
  }

  if (!employee.otp) return ReE(req, res, { message: ERROR.OTP_NOT_FOUND }, 400);

  const otpCreatedAt = moment.utc(employee.otpCreatedAt);
  const otpAge = now.diff(otpCreatedAt, 'minutes');

  if (otpAge > 2) return ReE(req, res, { message: ERROR.OTP_EXPRIED }, 400);
  if (parseInt(otp) !== employee.otp) return ReE(req, res, { message: ERROR.OTP_INVALID }, 400);

  employee.otp = null;
  employee.otpCreatedAt = null;
  employee.otpCount = 0;
  await employee.save();

  return successfulLogin(req, res, employee);
};

async function successfulLogin(req, res, employee) {
  const refreshToken = randToken.uid(256);
  let err;
  [err] = await to(Employee.update({ refreshToken }, { where: { id: employee.id } }));
  if (err) return ReE(req, res, err, 422);

  const tokenPayload = { ...employee.toJSON() };
  delete tokenPayload.password;
  delete tokenPayload.refreshToken;

  const accessToken = jwtToken(tokenPayload);

  return ReS(res, {
    data: {
      accessToken,
      userData: tokenPayload,
      refreshToken,
    },
  }, 200);
}

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return ReE(req, res, { message: ERROR.REFRESH_TOKEN_REQUIRED }, 400);

  let err, employee;
  [err, employee] = await to(Employee.findOne({ where: { refreshToken }, include: [{ model: Role, attributes: ['name'], as: "role" }] }));
  if (err) return ReE(req, res, err, 422);
  if (!employee) return ReE(req, res, { message: ERROR.TOKEN_EXPRIED }, 403);

  [err] = await to(Employee.update({ refreshToken: null }, { where: { id: employee.id } }));
  if (err) return ReE(req, res, err, 422);

  const tokenPayload = { ...employee.toJSON() };
  delete tokenPayload.password;
  delete tokenPayload.refreshToken;

  const cryptoToken = jwtToken(tokenPayload);

  return ReS(res, {
    data: {
      cryptoToken,
      userData: tokenPayload,
    }
  }, 200);
};

const enableOtp = async (req, res) => {
  const { otpStatus } = req.body;
  let err;
  [err] = await to(Employee.update({ twoFactor: otpStatus }, { where: { id: req.user.id } }));
  if (err) return ReE(req, res, err, 422);
  return ReS(res, { message: SUCCESS.UPDATED }, 200);
};

const getAllEmployees = async (req, res) => {
  let err, employees;
  [err, employees] = await to(Employee.findAll({
    attributes: ['firstName', 'lastName', 'email'],
    include: [
      { model: Role, attributes: ['name'], as: "role" },
      { model: Department, attributes: ['name'], as: "department" }
    ]
  }));
  if (err) return ReE(req, res, err, 422);
  return ReS(res, { data: employees }, 200);
};

module.exports = {
  signup,
  verifyToken,
  createPassword,
  createUser,
  login,
  resendOtp,
  confirmOtp,
  refreshToken,
  enableOtp,
  getAllEmployees
};
