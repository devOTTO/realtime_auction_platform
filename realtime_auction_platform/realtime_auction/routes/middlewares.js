exports.isLogin = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('loginError', '로그인이 필요합니다');
    res.redirect('/');
  }
};

exports.isNotLogin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/');
  }
};
