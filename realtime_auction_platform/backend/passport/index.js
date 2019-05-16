const local = require('./localStrategy');

module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    User.find({ where: { id } })
    .then(user => done(null, user))
    .catch(err => done(err));
  });

  local(passport);
};
