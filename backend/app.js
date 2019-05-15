const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
require('dotenv').config(); 

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const { sequelize } = require('./models');
const passportConfig = require('./passport');
const webSocket = require('./socket');
const scheduleAuction = require('./scheduleAuction');

const app = express();
sequelize.sync().then(function(){
  database:"process.env.DB_NAME"
});
passportConfig(passport);
scheduleAuction();

const sessionMiddleware = session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
});
//view engine setup
app.set('views', path.join(__dirname, '../frontend/views'));
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 3000);

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);
app.use(passport.initialize()); 
app.use(passport.session());
app.use(flash());


app.use('/', indexRouter);
app.use('/auth', authRouter);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

const server = app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기중');
});

webSocket(server, app);