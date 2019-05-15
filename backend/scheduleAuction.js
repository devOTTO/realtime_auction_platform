const { Item, Auction, User, sequelize } = require('./models');

module.exports = async () => {
  try {
    const targets = await Item.findAll({
      where:{
        buyerId:null
      }
    });
    targets.forEach(async (target) => {
      const finish = new Date(target.createdAt);
      finish.setMinutes(finish.getMinutes()+target.finish);
      if(new Date() > finish)
      {
        const success = await Auction.find({
          where: { itemId: target.id },
          order: [['bid', 'DESC']],
        });
        await Item.update({ buyerId: success.userId }, { where: { id: target.id } });
        await User.update({
          money: sequelize.literal(`money - ${success.bid}`),
        }, {
          where: { id: success.userId },
        });
      }
    });
  } catch (error) {
    console.error(error);
  }
};
