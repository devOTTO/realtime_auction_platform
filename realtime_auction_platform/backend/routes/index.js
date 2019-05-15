const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Item, Auction, User, sequelize } = require('../models');
const { isLogin, isNotLogin } = require('./middlewares');

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

//GET /
router.get('/', async (req, res, next) => {
  try {
    const items = await Item.findAll();
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

//GET /login
router.get('/login', isNotLogin, (req, res) => {
    res.render('login', {
      title: 'NBay_로그인',
      loginError: req.flash('loginError'),
    });
  });

//GET /join
router.get('/join', isNotLogin, (req, res) => {
  res.render('join', {
    title: 'NBay_회원가입',
    joinError: req.flash('joinError'),
  });
});

module.exports = router;
