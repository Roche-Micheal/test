require('dotenv').config();

CONFIG = {};



CONFIG.app = process.env.APP;
CONFIG.port = process.env.PORT || '3000';
CONFIG.db_dialect = process.env.DB_DIALECT || 'mysql';
CONFIG.db_host = process.env.DB_HOST || 'localhost';
CONFIG.db_port = process.env.DB_PORT || '3306';
CONFIG.db_name = process.env.DB_NAME || 'assesment';
CONFIG.db_user = process.env.DB_USER || 'root';
CONFIG.db_password = process.env.DB_PASSWORD || 'root';
CONFIG.max_pool_conn = process.env.MAX_POOL_CONN || '50';
CONFIG.min_pool_conn = process.env.MIN_POOL_CONN || '0';
CONFIG.conn_idle_time = process.env.CONN_IDLE_TIME || '10000';
CONFIG.max_login_attempt = process.env.MAX_LOGIN_COUNT
CONFIG.max_otp_resend_attempt = process.env.MAX_OTP_RESEND
CONFIG.block_time = process.env.BLOCK_TIME
CONFIG.jwt_key = process.env.JWT_SECRET_KEY;
CONFIG.secretkey = process.env.CRYPTO_SECRET;
CONFIG.email = process.env.EMAIL;
CONFIG.password = process.env.EMAIL_PASS;
CONFIG.dev_host = process.env.DEV_HOST;
CONFIG.admin_mail = process.env.ADMIN_MAIL;
CONFIG.ofc_mail = process.env.OFC_MAIL;

