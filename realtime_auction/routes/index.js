const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Item, Auction, User } = require('../models');
const { isLogin, isNotLogin } = require('./middlewares');

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

router.get('/', async (req, res, next) => {
  try {
    const items = await Item.findAll({ where: { sellerId: null } });
    res.render('main', {
      title: 'NBay',
      items,
      loginError: req.flash('loginError'),
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/login', isNotLogin, (req, res) => {
    res.render('login', {
      title: 'NBay_로그인',
      loginError: req.flash('loginError'),
    });
  });

router.get('/join', isNotLogin, (req, res) => {
  res.render('join', {
    title: 'NBay_회원가입',
    joinError: req.flash('joinError'),
  });
});

router.get('/item', isLogin, (req, res) => {
  res.render('item', { title: 'NBay_상품등록' });
});

fs.readdir('uploads', (error) => {
  if (error) {
    console.error('uploads 폴더 생성');
    fs.mkdirSync('uploads');
  }
});
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.post('/item', isLogin, upload.single('img'), async (req, res, next) => {
  try {
    const { name, price } = req.body;
    await Item.create({
      sellerId: req.user.id,
      name,
      img: req.file.filename,
      price,
    });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
