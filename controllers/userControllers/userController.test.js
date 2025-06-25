require('../../config/config');

jest.mock('../../services/sendEmail.service', () => ({
  sendEmail: jest.fn()
}));
const { sendEmail } = require('../../services/sendEmail.service');

jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}));
const bcrypt = require('bcryptjs');

const jwtToken = require('../../services/jwt.service');
jest.mock('../../services/jwt.service', () => jest.fn());

const userController = require('./user.controller');
const Employee = require('../../models').employee;
const Customer = require('../../models').customer;

const mockRequest = () => {
  const req = {};
  req.body = jest.fn().mockReturnValue(req);
  req.params = jest.fn().mockReturnValue(req);
  return req;
};

const mockResponse = () => {
  const res = {};
  res.send = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

jest.setTimeout(30000);

let req = mockRequest();
let res = mockResponse();

describe('User Controller', () => {

  describe('user signUp', () => {

    beforeEach(async () => {
      jest.restoreAllMocks();
    });

    test('Error in Customer Creation', async () => {
      req = mockRequest();
      res = mockResponse();

      req.body = {
        name: 'Jane Doe',
        industry: 'Centizen',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
      };

      Customer.create = jest.fn()
        .mockRejectedValue(new Error("Error creating the user"));
      await userController.signup(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Error in Employee Creation', async () => {
      req = mockRequest();
      res = mockResponse();

      req.body = {
        name: 'Jane Doe',
        industry: 'Centizen',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
      };

      Customer.create = jest.fn().mockResolvedValue({ id: 2 });
      Employee.create = jest.fn().mockRejectedValue(new Error("Error creating the user"));
      await userController.signup(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Error in storing the password token in database', async () => {
      req = mockRequest();
      res = mockResponse();

      req.body = {
        name: 'Jane Doe',
        industry: 'Centizen',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
      };

      Customer.create = jest.fn().mockResolvedValue({ id: 1 })
      Employee.create = jest.fn().mockResolvedValue({ id: 2 });
      Employee.update = jest.fn().mockRejectedValue(new Error("Error in updating"));

      await userController.signup(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Error in sending the password setting email', async () => {
      req = mockRequest();
      res = mockResponse();

      req.body = {
        name: 'Jane Doe',
        industry: 'Centizen',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
      };

      Customer.create = jest.fn().mockResolvedValue({ id: 1 })
      Employee.create = jest.fn().mockResolvedValue({ id: 2 });
      Employee.update = jest.fn().mockResolvedValue([1]);

      sendEmail.mockResolvedValue({
        mError: new Error("Email failed"),
        result: null
      });

      await userController.signup(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Success creating the Employee and storing the password token in database and send the password setting mail', async () => {
      req = mockRequest();
      res = mockResponse();

      req.body = {
        name: 'Jane Doe',
        industry: 'Centizen',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
      };

      Customer.create = jest.fn().mockResolvedValue({ id: 1 })
      Employee.create = jest.fn().mockResolvedValue({ id: 2 });
      Employee.update = jest.fn().mockResolvedValue([1]);

      sendEmail.mockResolvedValue({ mError: null, result: true });

      await userController.signup(req, res);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('verify password token', () => {

    beforeEach(async () => {
      jest.restoreAllMocks();
    });

    test('Error in DB', async () => {
      req = mockRequest();
      res = mockResponse();
      req.params = { id: 'namma send pandra token' };

      Employee.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      await userController.verifyToken(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Invaild token or token not found', async () => {
      req = mockRequest();
      res = mockResponse();
      req.params = { id: 'namma send pandra token' };

      Employee.findOne = jest.fn().mockResolvedValue(null);

      await userController.verifyToken(req, res);
      expect(res.statusCode).toBe(400);
    });

    test('Expried token or time limit exceed for the token', async () => {
      req = mockRequest();
      res = mockResponse();
      req.params = { id: 'namma send pandra token' };

      const exprireTime = new Date(Date.now() - 1000);
      Employee.findOne = jest.fn().mockResolvedValue({ passwordTokenExpire: exprireTime });

      await userController.verifyToken(req, res);
      expect(res.statusCode).toBe(401);
    });

    test('Valid token', async () => {
      req = mockRequest();
      res = mockResponse();
      req.params = { id: 'namma send pandra token' };

      const exprireTime = new Date(Date.now() + 1000);
      Employee.findOne = jest.fn().mockResolvedValue({ passwordTokenExpire: exprireTime });

      await userController.verifyToken(req, res);
      expect(res.statusCode).toBe(200);
    })
  });

  describe('create password', () => {

    beforeEach(async () => {
      jest.restoreAllMocks();
    });

    test('Error in DB', async () => {
      req = mockRequest();
      res = mockResponse();
      req.params = { id: 'namma send pandra token' };

      Employee.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      await userController.createPassword(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Invaild token or token not found', async () => {
      req = mockRequest();
      res = mockResponse();
      req.params = { id: 'namma send pandra token' };

      Employee.findOne = jest.fn().mockResolvedValue(null);

      await userController.createPassword(req, res);
      expect(res.statusCode).toBe(400);
    });

    test('Expried token or time limit exceed for the token', async () => {
      req = mockRequest();
      res = mockResponse();
      req.params = { id: 'namma send pandra token' };

      const exprireTime = new Date(Date.now() - 1000);
      Employee.findOne = jest.fn().mockResolvedValue({ passwordTokenExpire: exprireTime });

      await userController.createPassword(req, res);
      expect(res.statusCode).toBe(401);
    });

    test('Error in storing the password in DB', async () => {
      req = mockRequest();
      res = mockResponse();
      req.params = { id: 'namma send pandra token' };

      const exprireTime = new Date(Date.now() + 1000);

      Employee.findOne = jest.fn().mockResolvedValue({ passwordTokenExpire: exprireTime });
      Employee.update = jest.fn().mockRejectedValue(new Error('Error in updation'));
      await userController.createPassword(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Succcessfully password set', async () => {
      req = mockRequest();
      res = mockResponse();
      req.params = { id: 'namma send pandra token' };

      const exprireTime = new Date(Date.now() + 1000);

      Employee.findOne = jest.fn().mockResolvedValue({ passwordTokenExpire: exprireTime });
      Employee.update = jest.fn().mockResolvedValue([1]);
      await userController.createPassword(req, res);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('create Employee', () => {

    beforeEach(async () => {
      jest.restoreAllMocks();
    });

    test('if the Employee already exists', async () => {
      req = mockRequest();
      res = mockResponse();

      req.body = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        roleId: 2,
        departmentId: 2,
      };

      Employee.findOne = jest.fn().mockRejectedValueOnce(new Error("User already exists")).mockResolvedValueOnce(Promise.resolve({ success: false }));
      await userController.createUser(req, res);
      expect(res.statusCode).toBe(422);
      await userController.createUser(req, res);
      expect(res.statusCode).toBe(400);
    });

    test('Error in Employee Creation', async () => {
      req = mockRequest();
      res = mockResponse();

      req.body = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        roleId: 2,
        departmentId: 2,
      };

      req.user = {
        customerId: 1
      }
      Employee.findOne = jest.fn().mockResolvedValue(null);
      Employee.create = jest.fn().mockRejectedValue(new Error("Error creating the user"));
      await userController.createUser(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Error in storing the password token in database', async () => {
      req = mockRequest();
      res = mockResponse();

      req.body = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        roleId: 2,
        departmentId: 2,
      };

      req.user = {
        customerId: 1
      };

      Employee.findOne = jest.fn().mockResolvedValue(null);
      Employee.create = jest.fn().mockResolvedValue({ id: 2 });
      Employee.update = jest.fn().mockRejectedValue(new Error("Error in updating"));

      await userController.createUser(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Error in sending the password setting email', async () => {
      req = mockRequest();
      res = mockResponse();

      req.body = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        roleId: 2,
        departmentId: 2,
      };

      req.user = {
        customerId: 1
      };

      Employee.findOne = jest.fn().mockResolvedValue(null);
      Employee.create = jest.fn().mockResolvedValue({ id: 123 });
      Employee.update = jest.fn().mockResolvedValue([1]);

      sendEmail.mockResolvedValue({
        mError: new Error("Email failed"),
        result: null
      });

      await userController.createUser(req, res);
      expect(res.statusCode).toBe(422);
    });


    test('Success creating the Employee and storing the password token in database and send the password setting mail', async () => {
      req = mockRequest();
      res = mockResponse();

      req.body = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        roleId: 2,
        departmentId: 2,
      };

      req.user = {
        customerId: 1
      };

      Employee.findOne = jest.fn().mockResolvedValue(null);
      Employee.create = jest.fn().mockResolvedValue({ id: 123 });
      Employee.update = jest.fn().mockResolvedValue([1]);

      sendEmail.mockResolvedValue({ mError: null, result: true });

      await userController.createUser(req, res);
      expect(res.statusCode).toBe(200);
    });

  });

  describe('user login', () => {

    beforeEach(async () => {
      jest.restoreAllMocks();
    });

    test('Error in DB', async () => {
      req = mockRequest();
      res = mockResponse();
      req.body = {
        email: "dummy@gmail.com",
        password: "dummy123"
      };

      Employee.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      await userController.login(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('No employee found', async () => {
      req = mockRequest();
      res = mockResponse();
      req.body = {
        email: "dummy@gmail.com",
        password: "dummy123"
      };

      Employee.findOne = jest.fn().mockResolvedValue(null);

      await userController.login(req, res);
      expect(res.statusCode).toBe(401);
    });

    test('Account blocked check', async () => {
      req = mockRequest();
      res = mockResponse();
      req.body = {
        email: "dummy@gmail.com",
        password: "dummy123"
      };

      const blockTime = new Date(Date.now() + 60 + 60 * 1000);
      Employee.findOne = jest.fn().mockResolvedValue({ email: req.body.email, blockTime: blockTime });

      await userController.login(req, res);
      expect(res.statusCode).toBe(403)
    });

    test('Wrong password and under max login attempts', async () => {
      req = mockRequest();
      res = mockResponse();
      req.body = {
        email: "dummy@gmail.com",
        password: "dummy123"
      };

      const mockEmployee = {
        email: 'dummy@example.com',
        password: 'dummy_hash',
        loginCount: 2,
        blockTime: null,
        save: jest.fn(),
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await userController.login(req, res);
      expect(mockEmployee.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(422);
    });

    test('Wrong password and max login attempts exceeded (account blocked)', async () => {
      req = mockRequest();
      res = mockResponse();
      req.body = { email: 'dummy@example.com', password: 'WrongPassword' };

      const mockEmployee = {
        email: 'dummy@example.com',
        password: 'dummy hash',
        loginCount: 4,
        blockTime: null,
        save: jest.fn(),
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await userController.login(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Error in storing the refreshToken upon Successful login without 2FA', async () => {
      req = mockRequest();
      res = mockResponse();
      req.body = { email: 'dummy@example.com', password: 'CorrectPassword' };

      const mockEmployee = {
        id: 1,
        email: 'dummy@example.com',
        firstName: 'dummy',
        password: 'dummy_hash',
        role: {
          name: 'role_name'
        },
        loginCount: 1,
        blockTime: null,
        twoFactor: false,
        save: jest.fn(),
        toJSON: jest.fn(),
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      Employee.update = jest.fn().mockRejectedValue(new Error('DB error in updating the refreshToken'));

      await userController.login(req, res);
      expect(Employee.update).toHaveBeenCalled();
    });

    test('Error in sending the otp verification email', async () => {
      req = mockRequest();
      res = mockResponse();
      req.body = {
        email: 'dummy@example.com',
        password: 'CorrectPassword'
      };

      const mockEmployee = {
        email: 'dummy@example.com',
        password: 'dummy_hash',
        loginCount: 0,
        blockTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        save: jest.fn(),
        role: { name: 'role_name' }
      };

      sendEmail.mockResolvedValue({
        mError: new Error("Email failed"),
        result: null
      });

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await userController.login(req, res);
      expect(mockEmployee.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(422);
    });

    test('Account blocked time reset and successful email sent on successful login', async () => {
      req = mockRequest();
      res = mockResponse();
      req.body = {
        email: 'dummy@example.com',
        password: 'CorrectPassword'
      };

      const mockEmployee = {
        email: 'dummy@example.com',
        password: 'dummy_hash',
        loginCount: 0,
        blockTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        save: jest.fn(),
        role: { name: 'role_name' }
      };

      sendEmail.mockResolvedValue({
        mError: null,
        result: true
      });

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await userController.login(req, res);
      expect(mockEmployee.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });

    test('OTP request limit reached', async () => {
      req = mockRequest();
      res = mockResponse();
      req.body = {
        email: 'dummy@example.com',
        password: 'CorrectPassword',
      };

      const mockEmployee = {
        email: 'dummy@example.com',
        password: 'dummy_hash',
        twoFactor: true,
        otpCount: 4,
        otpCreatedAt: new Date(),
        save: jest.fn(),
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await userController.login(req, res);
      expect(res.statusCode).toBe(403);
    });

    test('Successful Login with JWT generation without 2FA', async () => {
      req = mockRequest();
      res = mockResponse();
      req.body = {
        email: 'dummy@example.com',
        password: 'CorrectPassword'
      };

      const mockEmployee = {
        email: 'dummy@example.com',
        password: 'dummy_hash',
        loginCount: 0,
        blockTime: null,
        save: jest.fn(),
        role: { name: 'role_name' },
        twoFactor: false,
        toJSON: () => ({
          id: 1,
          email: 'dummy@gmail.com',
          password: 'dummy-hashed-password',
          refreshToken: 'existingToken'
        })
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      jwtToken.mockReturnValue('access-token');
      Employee.update = jest.fn().mockResolvedValue([1]);
      userController.successfulLogin = jest.fn().mockResolvedValue({
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          userData: { id: 1, email: 'dummy@gmail.com' }
        }
      });

      await userController.login(req, res);
      expect(res.statusCode).toBe(200);
    })
  });

  describe('Enable Otp', () => {
    beforeEach(async () => {
      jest.restoreAllMocks();
    });

    test('Error in Db updation', async () => {
      req = mockRequest();
      res = mockResponse();
      req.body = { otpStatus: true };
      req.user = { id: 1 };

      Employee.update = jest.fn().mockRejectedValue(new Error('DB error'));

      await userController.enableOtp(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Successful updation of twoFactor', async () => {
      req = mockRequest();
      res = mockResponse();
      req.body = { otpStatus: true };
      req.user = { id: 1 };

      Employee.update = jest.fn().mockResolvedValue([1]);

      await userController.enableOtp(req, res);
      expect(res.statusCode).toBe(200);
    });
  })

  describe('Get all employees', () => {
    beforeEach(async () => {
      jest.restoreAllMocks();
    });

    test('Error in fetching details', async () => {
      req = mockRequest();
      res = mockResponse();

      Employee.findAll = jest.fn().mockRejectedValue(new Error('DB fetch error'));

      await userController.getAllEmployees(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Success in fetching details', async () => {
      req = mockRequest();
      res = mockResponse();

      const mockEmployees = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          role: { name: 'Admin' },
          department: { name: 'HR' }
        }
      ];

      Employee.findAll = jest.fn().mockResolvedValue(mockEmployees);

      await userController.getAllEmployees(req, res);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    test('Missing token in the body', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = {};

      await userController.refreshToken(req, res);
      expect(res.statusCode).toBe(400);
    });

    test('Error in DB while find the employee', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { refreshToken: 'dummy-token' };

      Employee.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      await userController.refreshToken(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Employee not found for the token', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { refreshToken: 'test-token' };

      Employee.findOne = jest.fn().mockResolvedValue(null);

      await userController.refreshToken(req, res);
      expect(res.statusCode).toBe(403);
    });

    test('Error in updating the token to null in DB', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { refreshToken: 'dummy-token' };

      const mockEmployee = {
        id: 1,
        toJSON: () => ({ id: 1, email: 'dummy@gmail.com', refreshToken: 'dummy-token' }),
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);
      Employee.update = jest.fn().mockRejectedValue(new Error('Update error'));

      await userController.refreshToken(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('SuccessFul return on refreshtoken', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { refreshToken: 'dummy-token' };

      const mockEmployee = {
        id: 1,
        toJSON: () => ({ id: 1, email: 'dummy@gmail.com', refreshToken: 'dummy-token' }),
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);
      Employee.update = jest.fn().mockResolvedValue([1]);
      jwtToken.mockReturnValue('new-token');

      await userController.refreshToken(req, res);
      expect(res.statusCode).toBe(200);
    });

    test('Error on JwT token generation', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { refreshToken: 'dummy-token' };

      const mockEmployee = {
        id: 1,
        toJSON: () => ({ id: 1, email: 'dummy@gmail.com', refreshToken: 'dummy-token' }),
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);
      Employee.update = jest.fn().mockResolvedValue([1]);
      jwtToken.mockImplementation(() => { new Error('JWT error'); });

      await userController.refreshToken(req, res);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('resendOtp', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    test('Employee not found', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'dummy@gmail.com' };

      Employee.findOne = jest.fn().mockResolvedValue(null);

      await userController.resendOtp(req, res);
      expect(res.statusCode).toBe(403);
    });

    test('Error in DB while find the employee', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { refreshToken: 'dummy-token' };

      Employee.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      await userController.resendOtp(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Error if account is blocked', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'dummy@gmail.com' };

      const futureBlockTime = new Date(Date.now() + 10 * 60 * 1000);

      const mockEmployee = {
        blockTime: futureBlockTime,
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);

      await userController.resendOtp(req, res);
      expect(res.statusCode).toBe(403);
    });

    test('Error if Otp count exceeds 3', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'dummy@gmail.com' };

      const mockEmployee = {
        otpCount: 3,
        blockTime: null,
        save: jest.fn()
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);

      await userController.resendOtp(req, res);
      expect(res.statusCode).toBe(403);
    });

    test('Error in sending the email', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'dummy@gmail.com' };

      const mockEmployee = {
        firstName: 'roche',
        email: 'dummy@gmail.com',
        otpCount: 1,
        blockTime: null,
        save: jest.fn(),
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);

      jest.mocked(sendEmail).mockResolvedValue({ mError: new Error("Error in sending the email") });

      await userController.resendOtp(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Successful in resending the Otp', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'dummy@gmail.com' };

      const mockEmployee = {
        firstName: 'Roche',
        email: 'dummy@gmail.com',
        otpCount: 0,
        blockTime: null,
        save: jest.fn(),
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);

      jest.mocked(sendEmail).mockResolvedValue({ mError: null });

      await userController.resendOtp(req, res);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('confirmOtp', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    test('Error in DB while find the employee', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'dummy@gmail.com', otp: 123456 };

      Employee.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      await userController.confirmOtp(req, res);
      expect(res.statusCode).toBe(422);
    });

    test('Error if no employee found', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'dummy@gmail.com', otp: 123456 };

      Employee.findOne = jest.fn().mockResolvedValue(null);

      await userController.confirmOtp(req, res);
      expect(res.statusCode).toBe(403);
    });

    test('Error if account is blocked', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'dummy@gmail.com', otp: 123456 };

      const futureBlock = new Date(Date.now() + 10 * 60 * 1000);

      Employee.findOne = jest.fn().mockResolvedValue({
        blockTime: futureBlock,
      });

      await userController.confirmOtp(req, res);
      expect(res.statusCode).toBe(403);
    });

    test('Error if Otp is missing', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'dummy@gmail.com', otp: 123456 };

      Employee.findOne = jest.fn().mockResolvedValue({
        blockTime: null,
        otp: null,
      });

      await userController.confirmOtp(req, res);
      expect(res.statusCode).toBe(400);
    });

    test('Error if Otp time limit exceeded', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'dummy@gmail.com', otp: 123456 };

      const oldOtpDate = new Date(Date.now() - 3 * 60 * 1000);

      Employee.findOne = jest.fn().mockResolvedValue({
        blockTime: null,
        otp: 123456,
        otpCreatedAt: oldOtpDate,
      });

      await userController.confirmOtp(req, res);
      expect(res.statusCode).toBe(400);
    });

    test('error if Invalid Otp', async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'dummy@gmail.com', otp: 111111 };

      const recentOtpDate = new Date();

      Employee.findOne = jest.fn().mockResolvedValue({
        blockTime: null,
        otp: 123456,
        otpCreatedAt: recentOtpDate,
      });

      await userController.confirmOtp(req, res);
      expect(res.statusCode).toBe(400);
    });

    test('Successful in Opt verification and Token generation', async () => {
      const req = mockRequest();
      const res = mockResponse();

      req.body = {
        email: 'dummy@gmail.com',
        otp: 123456
      };

      const now = new Date();

      const mockEmployee = {
        id: 1,
        blockTime: null,
        otp: 123456,
        otpCreatedAt: now,
        save: jest.fn(),
        toJSON: () => ({
          id: 1,
          email: 'dummy@gmail.com',
          password: 'dummy-hashed-password',
          refreshToken: 'existingToken'
        })
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);
      jwtToken.mockReturnValue('access-token')
      userController.successfulLogin = jest.fn().mockResolvedValue({
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          userData: { id: 1, email: 'dummy@gmail.com' }
        }
      });

      await userController.confirmOtp(req, res);
      expect(res.statusCode).toBe(200);
    });

    test('Error in generating JWT token', async () => {
      const req = mockRequest();
      const res = mockResponse();

      req.body = {
        email: 'user@example.com',
        otp: 123456
      };

      const now = new Date();

      const mockEmployee = {
        id: 1,
        blockTime: null,
        otp: 123456,
        otpCreatedAt: now,
        save: jest.fn(),
        toJSON: () => ({})
      };

      Employee.findOne = jest.fn().mockResolvedValue(mockEmployee);

      jwtToken.mockReturnValue(null);
      userController.successfulLogin = jest.fn().mockResolvedValue({
        error: 'Error while generating JwT'
      });
      await userController.confirmOtp(req, res);
      expect(res.statusCode).toBe(422);
    });

  })

})