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
    const { name, price, des, finish, num, type } = req.body;
    await Item.create({
      sellerId: req.user.id,
      name,
      des,
      finish,
      img: req.file.filename,
      price,
      num,
      type,
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
          if(item.type == 0)
         { 
        res.render('auction', {
          title: `${item.name} 입찰 참여`,    
          item,
          auction,
          auctionError: req.flash('auctionError'),
        });}
        else{
          res.render('sell', {
            title: `${item.name} 구매`,    
            item,
            auction,
            auctionError: req.flash('auctionError'),
          });
        }
      } catch (error) {
        console.error(error);
        next(error);
      }
  });

const checkValidate = (item, bid, money) =>
  new Promise((resolve, reject) => {
   //종료 경매 체크
  if(new Date(item.createdAt).valueOf() + (item.finish*60*1000) < new Date()){
    reject('종료된 경매입니다.'); 
  }
  //판매가 체크
  if(item.price > bid){
    reject('판매가 보다 높게 입찰해야합니다.');
  }
  //최고가 보다 높은지? 
  if(item.auctions[0] && item.auctions[0].bid >= bid){
    reject('최고가 보다 높게 입찰해야합니다.');
  }
  //자금 체크
  if(money < bid){
    reject('최고가 보다 높게 입찰해야합니다.');
  }
    resolve('success');
});

// //POST /item/:id/bid - 입찰 참여
router.post('/item/:id/bid', isLogin, async (req, res, next) => {
    sequelize.transaction(async (t) => {
      const { bid } = req.body;

      const item = await Item.find({ where: { id: req.params.id },
        include: { model: Auction },
        order: [[{ model:Auction}, 'bid', 'DESC']],
      }, {transaction: t});
      
      await checkValidate(item,bid,req.user.money);
      
      const result = await Auction.create({
        bid,
        userId: req.user.id,
        itemId: req.params.id,
      }, {transaction: t});

      req.app.get('io').to(req.params.id).emit('bid', {
        bid: result.bid,
        name: req.user.name,
      });
    }).then(function (result) {
      return res.send('ok');
  }).catch(function (err) {
      console.log(err);
      return next(err);
  });
});

// //POST /item/:id/buy - 구매하기
router.post('/item/:id/buy', isLogin, async (req, res, next) => {
  try {
    const item = await Item.find({ where: { id: req.params.id },
      include: { model: Auction },
      order: [[{ model:Auction}, 'bid', 'DESC']],
    });
    if(item.num >= 1){
      const result = await Auction.create({
        bid: item.price,
        userId: req.user.id,
        itemId: req.params.id,
      });
      if(req.user.money < item.price)
      {
      return res.status(403).send('자금이 부족합니다.');
      } 
       try{
        Item.update({ num: sequelize.literal(`num - 1`), }, { where: { id: item.id } });
        User.update({
          money: sequelize.literal(`money - ${result.bid}`),
        }, {
          where: { id: result.userId },
        });
        User.update({
          money: sequelize.literal(`money + ${result.bid}`), 
        },{
          where: { id: item.sellerId },
        });
        }catch (error) {
          console.error(error);
        }
    }else{
      return res.status(403).send('물건 수량이 부족합니다');
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});


//GET /mypage
router.get('/mypage',isLogin, async(req,res,next) => {
  try{
    const sellItems = await Item.findAll({
      where : {sellerId: req.user.id},
      include: {model:Auction},
      order: [[{model:Auction}, 'bid', 'DESC']],
    });
    const bidItems = await Item.findAll({
      where:{ buyerId: req.user.id},
      include:{model:Auction},
      order:[[{model:Auction}, 'bid', 'DESC']],
    });
    res.render('mypage', {
      title: `${req.user.name} My Page`,        
      sellItems,
      bidItems,
      mypageError: req.flash('mypageError'),
    });

  }catch(error){
    console.log(error);
    next(error);
  }
});

module.exports = router;
