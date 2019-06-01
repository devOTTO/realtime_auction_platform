const { Item, Auction, User, sequelize } = require('./models');

(async () => {
  try {
    const targets = await Item.findAll({
      where:{
        buyerId:null
      }
    });
    targets.forEach(async (target) => {
      const finish = new Date(target.createdAt);
      finish.setMinutes(finish.getMinutes()+target.finish);
      if(new Date() > finish && target.type == 0) //경매가 종료 되었으면 낙찰자 선택 처리
      {
        const success = await Auction.find({
          where: { itemId: target.id },
          order: [['bid', 'DESC']],
        });
        if(success.userId){
        sequelize.transaction(async (t) => {
          await Promise.all([
            Item.update({ 
              buyerId: success.userId 
            }, { 
                where: { id: target.id } 
            }, {transaction: t}),
            User.update({
              money: sequelize.literal(`money - ${success.bid}`),
            }, {
              where: { id: success.userId },
            }, {transaction: t}),
            User.update({
              money: sequelize.literal(`money + ${success.bid}`), 
            },{
              where: { id: target.sellerId },
            }, {transaction: t}),
        ]).then(function (result) {
            console.log("scheduleAuction Succeed");
        }).catch(function (err) {
            console.log(err);
            //return next(err);
        });
    });
    }}});
    } catch (error) {
  console.error(error);
}})();
