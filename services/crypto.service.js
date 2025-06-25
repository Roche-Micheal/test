const crypto = require('crypto-js');

const encrypt =  (plainText) => {
    let chiperText;
    chiperText = crypto.AES.encrypt(plainText.toString(), CONFIG.secretkey).toString();
    return chiperText;
}

const dcrypt = (chiperText) => {
    let plainText;
    const bytes = crypto.AES.decrypt(chiperText.toString(), CONFIG.secretkey);
    plainText = bytes.toString(crypto.enc.Utf8);
    return plainText;
}

module.exports = {encrypt, dcrypt}; 