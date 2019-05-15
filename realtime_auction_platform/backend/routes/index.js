const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const scheduler = require('node-schedule');


const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

//GET /
router.get('/', async (req, res, next) => {
  try {
    res.render('main', {
      title: 'NBay',
      mainError : req.flash('mainError'),
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
