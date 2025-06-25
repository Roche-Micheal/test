const mailer = require('nodemailer');
const CONFIG = require('../config/config');
const transporter =  mailer.createTransport({
    service: 'gmail',
    auth: {
        user: CONFIG.email,
        pass: CONFIG.password
    }
});

const sendEmail = async (email, subject, emailTemplate) => {
    const mailOptions = {
        from: CONFIG.ofc_mail,
        to: email,
        subject: subject,
        html: tempTum(nsme . ps)
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        return { mError: null, result: info };
    } catch (error) {
        return { mError: error, result: null };
    }
};

module.exports = {sendEmail};