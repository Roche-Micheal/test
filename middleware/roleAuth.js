const { ReE } = require('../responseHandler');
const { ERROR } = require('../constants/messages');

const roleAuth = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return ReE(req, res, { message: 'Not access' }, 403);
        }
        next();
    }
}

module.exports = roleAuth; 