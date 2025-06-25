const jwt = require('jsonwebtoken');
const crypto = require('./crypto.service');

const jwtToken = (userData) => {
    let cryptoToken;
    const token = "Bearer " + jwt.sign({
        id: userData.id,
        email: userData.email,
        role: userData.role.name,
        customerId: userData.customerId
    }, CONFIG.jwt_key, { expiresIn: '2h' });
    cryptoToken = crypto.encrypt(token);
    return cryptoToken;
}
 
module.exports = jwtToken;