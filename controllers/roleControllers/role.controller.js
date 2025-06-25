const Role = require('../../models').role;
const { to, ReE, ReS } = require('../../responseHandler');
const SUCCESS = require('../../constants/messages').SUCCESS;
const ERROR = require('../../constants/messages').ERROR;

const createRole = async (req, res) => {
  let err, role;
  const { roleName } = req.body;
  [err, role] = await to(Role.create({ name: roleName }));
  if (err) {
    if (err.type === 'SequelizeUniqueConstraintError') return ReE(req, res, { message: "Role already Exists" }, 402);
    return ReE(req, res, err, 402);
  }
  return ReS(res, { data: role }, 200)
}

const updateRole = async (req, res) => {
  const id = req.params.id;
  const { roleName } = req.body;
  let err, role, update;
  [err, role] = await to(Role.findOne({ where: { id: id } }));
  if (err) return ReE(req, res, err, 402);
  if (!role) return ReE(req, res, { message: ERROR.ROLE_NOT_FOUND + id });
  [err, update] = await to(Role.update({ name: roleName }, { where: { id: id } }));
  if (err) {
    if (err.type === 'SequelizeUniqueConstraintError') return ReE(req, res, { message: "Role already Exists" }, 402);
    return ReE(req, res, err, 402);
  }
  return ReS(res, { message: SUCCESS.UPDATED }, 200);
}

const deleteRole = async (req, res) => {
  const id = req.params.id;
  let err, role;
  [err, role] = await to(Role.findOne({ where: { id: id } }));
  if (err) return ReE(req, res, err, 402);
  if (!role) return ReE(req, res, { message: ERROR.ROLE_NOT_FOUND + id }); 
  [err] = await to(Role.destroy({ where: { id: id } }));
  if (err) {
    if (err.type === 'SequelizeForeignKeyConstraintError') return ReE(req, res, { message: "Can't delete role because an employee is accociated with the role" }, 402);
    return ReE(req, res, err, 402);
  }
  return ReS(res, { message: SUCCESS.DELETED }, 200);
}

module.exports = { createRole, updateRole, deleteRole }