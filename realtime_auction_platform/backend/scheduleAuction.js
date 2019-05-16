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
      if(new Date() > finish) //경매가 종료 되었으면 낙찰자 선택 처리
      {
        const success = await Auction.find({
          where: { itemId: target.id },
          order: [['bid', 'DESC']],
        });
        try{
        await Item.update({ buyerId: success.userId }, { where: { id: target.id } });
        await User.update({
          money: sequelize.literal(`money - ${success.bid}`),
        }, {
          where: { id: success.userId },
        });
        await User.update({
          money: sequelize.literal(`money + ${success.bid}`), 
        },{
          where: { id: target.sellerId },
        });
        }catch (error) {
          console.error(error);
        }
      }
    });
  } catch (error) {
    console.error(error);
  }
})();
