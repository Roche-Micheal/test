const Department = require('../../models').department;
const { to, ReE, ReS } = require('../../responseHandler');
const SUCCESS = require('../../constants/messages').SUCCESS;
const ERROR = require('../../constants/messages').ERROR;

const createDepartment = async (req, res) => {
  let err, department;
  const { departmentName } = req.body;
  [err, department] = await to(Department.create({ name: departmentName }));
  if (err) {
    if (err.type === 'SequelizeUniqueConstraintError') return ReE(req, res, { message: "Department already Exists" }, 402);
    return ReE(req, res, err, 402);
  }
  return ReS(res, { data: department }, 200)
}

const updateDepartment = async (req, res) => {
  const id = req.params.id;
  const { departmentName } = req.body;
  let err, department, update;
  [err, department] = await to(Department.findOne({ where: { id: id } }));
  if (err) return ReE(req, res, err, 402); 
  if (!department) return ReE(req, res, { message: ERROR.DEPARTMENT_NOT_FOUND + id });
  [err, update] = await to(Department.update({ name: departmentName }, { where: { id: id } }));
  if (err) {
    if (err.type === 'SequelizeUniqueConstraintError') return ReE(req, res, { message: "Department already Exists" }, 402);
    return ReE(req, res, err, 402);
  }
  return ReS(res, { message: SUCCESS.UPDATED }, 200);
}

const deleteDepartment = async (req, res) => {
  const id = req.params.id;
  let err, department;
  [err, department] = await to(Department.findOne({ where: { id: id } }));
  if (err) return ReE(req, res, err, 402);
  if (!department) return ReE(req, res, { message: ERROR.DEPARTMENT_NOT_FOUND + id });
  [err] = await to(Department.destroy({ where: { id: id } }));
  if (err) {
    if (err.type === 'SequelizeForeignKeyConstraintError') return ReE(req, res, { message: "Can't delete department because an employee is accociated with the department" }, 402);
    return ReE(req, res, err, 402);
  }
  return ReS(res, { message: SUCCESS.DELETED }, 200);
}

module.exports = { createDepartment, updateDepartment, deleteDepartment }