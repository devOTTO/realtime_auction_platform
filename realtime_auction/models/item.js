module.exports = (sequelize, DataTypes) => (
    sequelize.define('item', {
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      des: {
          type:DataTypes.STRING(200),
          allowNull:true,
      },
      img: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    }, {
      timestamps: true,
      paranoid: true,
    })
);
  