const express = require('express');
const route = express.Router();
const roleAuth = require('../middleware/roleAuth');
const passport = require('passport');
require('../middleware/passport')(passport);

const { createRole, updateRole, deleteRole } = require('../controllers/roleControllers/role.controller');
const { createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentControllers/department.controller');
const { signup, verifyToken, createPassword, createUser, login, resendOtp, confirmOtp, refreshToken, enableOtp, getAllEmployees } = require('../controllers/userControllers/user.controller');

route.post('/createRole', passport.authenticate('jwt', { session: false }), roleAuth('admin'), createRole);
route.put('/updateRole/:id', passport.authenticate('jwt', { session: false }), roleAuth('admin'), updateRole);
route.delete('/deleteRole/:id', passport.authenticate('jwt', { session: false }), roleAuth('admin'), deleteRole);

route.post('/createDepartment', passport.authenticate('jwt', { session: false }), roleAuth('admin'), createDepartment);
route.put('/updateDepartment/:id', passport.authenticate('jwt', { session: false }), roleAuth('admin'), updateDepartment);
route.delete('/deleteDepartment/:id', passport.authenticate('jwt', { session: false }), roleAuth('admin'), deleteDepartment);

route.post('/signUp', signup);
route.get('/verifyToken/:id', verifyToken);
route.post('/createPassword/:id', createPassword);

route.post('/createUser', passport.authenticate('jwt', { session: false }), roleAuth('admin'), createUser);
route.post('/login', login);
route.post('/resendOtp', resendOtp);
route.get('/confirmOtp', confirmOtp);
route.post('/refreshToken', refreshToken);
route.patch('/enableOtp', passport.authenticate('jwt', { session: false }), enableOtp);

route.get('/employees', passport.authenticate('jwt', { session: false }), roleAuth('admin'), getAllEmployees);


module.exports = route;