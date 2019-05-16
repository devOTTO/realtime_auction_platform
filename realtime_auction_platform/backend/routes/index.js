const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const scheduler = require('node-schedule');

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

//GET /item
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

//POST /item --물품 등록
router.post('/item', isLogin, upload.single('img'), async (req, res, next) => {
  try {
    const { name, price, des, finish } = req.body;
    const item = await Item.create({
      sellerId: req.user.id,
      name,
      des,
      finish,
      img: req.file.filename,
      price,
    });

    //--------------------문제의 코드부분------------------------//
    console.log("종료시간"+finish);
    const finishTime = new Date();
    finishTime.setMinutes(finishTime.getMinutes()+finish);
    console.log(finishTime);
    scheduler.scheduleJob(finishTime, async() => {
        console.log("scheduler finished");
        const success = await Auction.find({
            where: {itemId: item.id},
            order: [['bid', 'DESC']],
        });
        await Item.update({ buyerId: success.userId}, {where: {id: item.id}});
        await User.update({
            money: sequelize.literal(`money - ${success.bid}`),
        }, {
            where: {id:success.userId},
        });
    });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

//GET /item/:id --입찰 페이지
router.get('/item/:id', async (req, res, next) => {
    try {
        const item = await Item.find({ where: { id: req.params.id },
          include: {
              model: User,
              as: 'seller',
          }, });
          const auction = await Auction.findAll({
            where : {itemId:req.params.id},
            include : {model:User},
            order: [['bid', 'ASC']],
          });
        res.render('auction', {
          title: `${item.name} 입찰 참여`,    
          item,
          auction,
          auctionError: req.flash('auctionError'),
        });
      } catch (error) {
        console.error(error);
        next(error);
      }
  });

// //POST /item/:id/bid - 입찰 참여
router.post('/item/:id/bid', isLogin, async (req, res, next) => {
  try {
    const { bid } = req.body;
        const item = await Item.find({ where: { id: req.params.id },
          include: { model: Auction },
          order: [[{ model:Auction}, 'bid', 'DESC']],
         });
         if(item.price > bid){
              return res.status(403).send('판매가 보다 높게 입찰해야합니다.');
           }
          if(new Date(item.createdAt).valueOf() + (24*60*60*1000) < new Date()){
              return res.status(403).send('종료된 경매입니다.');
            }
          if(item.auctions[0] && item.auctions[0].bid >= bid){
               return res.status(403).send('최고가 보다 높게 입찰해야합니다.');
           }
    const result = await Auction.create({
      bid,
      userId: req.user.id,
      itemId: req.params.id,
    });
    req.app.get('io').to(req.params.id).emit('bid', {
      bid: result.bid,
      name: req.user.name,
    });
    return res.send('ok');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

//mypage 수정중
// router.get('/mypage',isLogin, async(req,res,next) => {
//   try{
//     const sellItems = await Item.findAll({
//       where : {sellerId: req.user.id},
//       include: {model:Auction},
//       order: [[{model:Auction}, 'bid', 'DESC']],
//     });
//     const buyItems = await Item.findAll({
//       where:{ buyerId: req.user.id},
//       include:{model:Auction},
//       order:[[{model:Auction}, 'bid', 'DESC']],
//     });
//     res.render('mypage', {
//       title: `${req.user.name} My Page`,        
//       sellItems,
//       buyItems,
//       mypageError: req.flash('mypageError'),
//     });

//   }catch(error){
//     console.log(error);
//     next(error);
//   }
// });

module.exports = router;
