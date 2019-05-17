module.exports = (sequelize, DataTypes) => (
    sequelize.define('auction', {
      bid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    }, {
      timestamps: true,
      paranoid: true,
    })
);
  