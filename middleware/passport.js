const jwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;

module.exports = (passport) => {
    var opts = {};
    opts.jwtFromRequest = extractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = CONFIG.jwt_key;
    passport.use(new jwtStrategy(opts, async function (jwt_payload, result) {
        if (jwt_payload) {
            return result(null, jwt_payload);
        } else {
            return result(null, false);
        }
    })) 
}