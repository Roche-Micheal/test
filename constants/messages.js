const SUCCESS = {};
const ERROR = {};

SUCCESS.UPDATED = 'Updation Successful';
SUCCESS.DELETED = 'Deleted Successful';
SUCCESS.PASSWORD = 'Password created Successfully'
SUCCESS.PASSWORD_SETUP_LINK_SENT = "Password setup link send to registerd email"
SUCCESS.OTP_EMAIL_SENT = "OTP sent to your email"

ERROR.REQUIRED_FEILDS = "All feilds need to be filled";
ERROR.USER_EXISTS = "User already exists"
ERROR.INVALID_EMAIL = "EMAIL not found";
ERROR.INVALID_CREDENTIALS = "Invalid Credentials";
ERROR.TOKEN_EXPRIED = "Token expried Please login again";
ERROR.TOKEN_NOT_GENERATED = "Error in generating the JWT Token";
ERROR.OTP_NOT_FOUND = "No OTP found. Please request a new one"
ERROR.OTP_EXPRIED = "OTP has expired. Please request a new one"
ERROR.OTP_INVALID = "Invalid OTP"
ERROR.ONLY_ADMIN = "Access denied...";
ERROR.MAX_OTP_REQUEST = "Too many OTP requests. Account blocked for 2 hours"
ERROR.DEPARTMENT_NOT_FOUND = "Department not found for id "
ERROR.ROLE_NOT_FOUND = "Role not found for id "
ERROR.PASSWORD_SETUP_REQUIRED = 'Please setup your password through the password setup link'
ERROR.ACCOUNT_BLOCKED = 'Your account is blocked. Please try again in '
ERROR.REFRESH_TOKEN_REQUIRED = "Refreshtoken required"

module.exports = { SUCCESS, ERROR }; 