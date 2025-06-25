const randToken = require('rand-token');
const { ReE, ReS, to } = require('../../responseHandler');
const jwtToken = require('../../services/jwt.service');
const bcrypt = require('bcryptjs');
const Customer = require('../../models').customer;
const Employee = require('../../models').employee;
const Role = require('../../models').role;
const Department = require('../../models').department;
const { sendEmail } = require('../../services/sendEmail.service');
const passwordEmail = require('../../constants/passwordEmail');
const otpEmail = require('../../constants/otpEmail');
const emailSetup = require('../../services/emailSetup');
const SUCCESS = require('../../constants/messages').SUCCESS;
const ERROR = require('../../constants/messages').ERROR;

const signup = async (req, res) => {
  const { name, industry, firstName, lastName, email } = req.body;
  let err, customer, employee;
  [err, customer] = await to(Customer.create({ name: name, industry: industry }));
  if (err) return ReE(req, res, err, 422);
  [err, employee] = await to(Employee.create({ firstName: firstName, lastName: lastName, email: email, customerId: customer.id, roleId: 1, departmentId: 1 }));
  if (err) return ReE(req, res, err, 422);
  const passwordToken = randToken.uid(128);
  [err] = await to(Employee.update({ passwordToken: passwordToken }, { where: { id: employee.id } }));
  if (err) return ReE(req, res, err, 422);
  const setup = {
    name: name,
    supportLink: CONFIG.admin_mail,
    resetLink: `${CONFIG.dev_host}/v1/verifyToken/${passwordToken}`,
  }
  const template = emailSetup(setup, passwordEmail);
  const subject = 'Password Set up Link';
  const { mError, result } = await sendEmail(email, subject, template);
  if (mError) return ReE(req, res, mError, 422);
  return ReS(res, { data: { employee }, message: SUCCESS.PASSWORD_SETUP_LINK_SENT }, 200);
}

const verifyToken = async (req, res) => {
  const token = req.params.id;
  let err, employee;
  [err, employee] = await to(Employee.findOne({ where: { passwordToken: token } }));
  if (err) return ReE(req, res, err, 422);
  if (!employee) return ReE(req, res, { message: ERROR.INVALID_EMAIL }, 400);
  const currentTime = new Date();
  const tokenExpireTime = employee.passwordTokenExpire;
  if (currentTime < tokenExpireTime) {
    return ReS(res, { data: `${CONFIG.dev_host}/v1/createPassword/${token}`, message: "Success" }, 200);
  } else {
    return ReE(req, res, { message: ERROR.TOKEN_EXPRIED }, 401);
  }
}

const createPassword = async (req, res) => {
  const token = req.params.id;
  let err, employee;
  [err, employee] = await to(Employee.findOne({ where: { passwordToken: token } }));
  if (err) return ReE(req, res, err, 422);
  if (!employee) return ReE(req, res, { message: ERROR.INVALID_EMAIL }, 400);
  const currentTime = new Date();
  const tokenExpireTime = employee.passwordTokenExpire;
  if (currentTime < tokenExpireTime) {
    const { password } = req.body;
    let updateStatus;
    [err, updateStatus] = await to(Employee.update({ password: password, passwordToken: null, passwordTokenExpire: null }, { where: { id: employee.id }, individualHooks: true }));
    if (err) return ReE(req, res, err, 422);
    return ReS(res, { message: SUCCESS.PASSWORD }, 200);
  } else {
    return ReE(req, res, { message: ERROR.TOKEN_EXPRIED }, 401);
  }
}

const createUser = async (req, res) => {
  const { firstName, lastName, email, roleId, departmentId } = req.body;
  let err, employee;
  [err, employee] = await to(Employee.findOne({ where: { email: email } }));
  if (err) return ReE(req, res, err, 422);
  if (employee) return ReE(req, res, { message: ERROR.USER_EXISTS }, 400);
  [err, employee] = await to(Employee.create({ firstName: firstName, lastName: lastName, email: email, customerId: req.user.customerId, roleId: roleId, departmentId: departmentId }));
  if (err) return ReE(req, res, err, 422);
  const passwordToken = randToken.uid(128);
  [err] = await to(Employee.update({ passwordToken: passwordToken }, { where: { id: employee.id } }));
  if (err) return ReE(req, res, err, 422);
  const setup = {
    name: firstName + lastName,
    supportLink: CONFIG.admin_mail,
    resetLink: `${CONFIG.dev_host}/v1/verifyToken/${passwordToken}`,
  }
  const template = emailSetup(setup, passwordEmail);
  const subject = 'Password Set up Link';
  const { mError, result } = await sendEmail(email, subject, template);
  if (mError) return ReE(req, res, mError, 422);
  return ReS(res, { data: { employee }, message: SUCCESS.PASSWORD_SETUP_LINK_SENT }, 200);

}

const login = async (req, res) => {
  const { email, password } = req.body;
  const now = new Date();

  let err, employee;
  [err, employee] = await to(Employee.findOne({ where: { email }, include: [{ model: Role, attributes: ['name'], as: "role" }] }));
  if (err) return ReE(req, res, err, 422);
  if (!employee) return ReE(req, res, { message: ERROR.INVALID_EMAIL }, 401);

  if (employee.blockTime) {
    if (now < new Date(employee.blockTime)) {
      const remainingTime = Math.ceil((new Date(employee.blockTime) - now) / (60 * 1000));
      return ReE(req, res, { message: ERROR.ACCOUNT_BLOCKED + `${remainingTime} minutes.` }, 403);
    } else {
      employee.loginCount = 0;
      employee.otpCount = 0;
      employee.blockTime = null;
      await employee.save();
    }
  };

  const isMatch = await bcrypt.compare(password, employee.password);
  if (!isMatch) {
    employee.loginCount += 1;
    if (employee.loginCount >= 5) {
      employee.blockTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    }
    await employee.save();
    return ReE(req, res, { message: ERROR.INVALID_CREDENTIALS }, 422);
  }

  employee.loginCount = 0;

  if (employee.twoFactor == false) {
    await employee.save();
    const result = await successfulLogin(employee);
    if (result.error) return ReE(req, res, result.error, 422);
    return ReS(res, { data: result.data }, 200);

  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  employee.otp = otp;
  employee.otpCreatedAt = now;
  employee.otpCount += 1;
  if (employee.otpCount > 3) {
    employee.blockTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
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

  const { mError } = await sendEmail(email, subject, template);
  if (mError) return ReE(req, res, mError, 422);

  return ReS(res, { data: { employeeId: employee.id }, message: SUCCESS.OTP_EMAIL_SENT }, 200);
};

const resendOtp = async (req, res) => {
  const now = new Date();
  const { email } = req.body;
  let err, employee;
  [err, employee] = await to(Employee.findOne({ where: { email } }));
  if (err) return ReE(req, res, err, 422);
  if (!employee) return ReE(req, res, { message: ERROR.INVALID_EMAIL }, 403);

  if (new Date(employee.blockTime) > now) {
    const remainingTime = Math.ceil((new Date(employee.blockTime) - now) / (60 * 1000));
    return ReE(req, res, { message: ERROR.ACCOUNT_BLOCKED + `${remainingTime} minutes.` }, 403);
  }

  employee.otpCount += 1;
  if (employee.otpCount > 3) {
    employee.blockTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    await employee.save();
    return ReE(req, res, { message: ERROR.MAX_OTP_REQUEST }, 403);
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  employee.otp = otp;
  employee.otpCreatedAt = now;
  await employee.save();

  const setup = {
    name: employee.firstName,
    otpCode: otp,
    supportLink: CONFIG.admin_mail,
  };
  const template = emailSetup(setup, otpEmail);
  const subject = 'Your OTP Code';

  const { mError } = await sendEmail(employee.email, subject, template);
  if (mError) return ReE(req, res, mError, 422);

  return ReS(res, { message: SUCCESS.OTP_EMAIL_SENT }, 200);
};

const confirmOtp = async (req, res) => {
  const now = new Date();
  const { otp, email } = req.body;
  let err, employee;
  [err, employee] = await to(Employee.findOne({ where: { email }, include: [{ model: Role, attributes: ['name'], as: "role" }] }));
  if (err) return ReE(req, res, err, 422);
  if (!employee) return ReE(req, res, { message: ERROR.INVALID_EMAIL }, 403);

  if (new Date(employee.blockTime) > now) {
    const remainingTime = Math.ceil((new Date(employee.blockTime) - now) / (60 * 1000));
    return ReE(req, res, { message: ERROR.ACCOUNT_BLOCKED + `${remainingTime} minutes.` }, 403);
  }

  if (!employee.otp) {
    return ReE(req, res, { message: ERROR.OTP_NOT_FOUND }, 400);
  }

  const otpAge = now - new Date(employee.otpCreatedAt);
  if (otpAge > 2 * 60 * 1000) {
    return ReE(req, res, { message: ERROR.OTP_EXPRIED }, 400);
  }

  if (parseInt(otp) !== employee.otp) {
    return ReE(req, res, { message: ERROR.OTP_INVALID }, 400);
  }

  employee.otp = null;
  employee.otpCreatedAt = null;
  employee.otpCount = 0;
  await employee.save();

  const result = await successfulLogin(employee);
  if (result.error) return ReE(req, res, result.error, 422);
  return ReS(res, { data: result.data }, 200);
};

async function successfulLogin(employee) {
  const refreshToken = randToken.uid(256);

  const [err] = await to(Employee.update({ refreshToken }, { where: { id: employee.id } }));
  if (err) return { error: err };

  const tokenPayload = { ...employee.toJSON() };
  delete tokenPayload.password;
  delete tokenPayload.refreshToken;

  const accessToken = jwtToken(tokenPayload);
  if (!accessToken) return {error : ERROR.TOKEN_NOT_GENERATED};

  return { data: { accessToken, userData: tokenPayload, refreshToken } }
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

  const accessToken = jwtToken(tokenPayload);
  if (!accessToken) return ReE(req, res, { message: ERROR.TOKEN_NOT_GENERATED }, 403);

  return ReS(res, { data: { accessToken, userData: tokenPayload, } }, 200);
};

const enableOtp = async (req, res) => {
  const { otpStatus } = req.body;
  let err, updateStatus;
  [err, updateStatus] = await to(Employee.update({ twoFactor: otpStatus }, { where: { id: req.user.id } }));
  if (err) return ReE(req, res, err, 422);
  return ReS(res, { message: SUCCESS.UPDATED }, 200);
}

const getAllEmployees = async (req, res) => {
  let err, employees;
  [err, employees] = await to(Employee.findAll({ attributes: ['firstName', 'lastName', 'email'], include: [{ model: Role, attributes: ['name'], as: "role" }, { model: Department, attributes: ['name'], as: "department" }] }));
  if (err) return ReE(req, res, err, 422);
  return ReS(res, { data: employees }, 200);
}

module.exports = { signup, verifyToken, createPassword, createUser, login, resendOtp, confirmOtp, refreshToken, enableOtp, getAllEmployees, successfulLogin }