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
        if(userId){
        sequelize.transaction(async (t) => {
          await Promise.all([
            promise1 = Item.update({ buyerId: success.userId }, { where: { id: target.id } }),
            User.update({
              money: sequelize.literal(`money - ${success.bid}`),
            }, {
              where: { id: success.userId },
            }),
            User.update({
              money: sequelize.literal(`money + ${success.bid}`), 
            },{
              where: { id: target.sellerId },
            }),
        ]).then(function (result) {
            console.log("scheduleAuction Succeed");
        }).catch(function (err) {
            console.log(err);
            return next(err);
        });
    });
    }}});
    } catch (error) {
  console.error(error);
}})();
