module.exports = (sequelize, DataTypes) => (
    sequelize.define('user', {
        email:{
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        name:{
            type:DataTypes.STRING(20),
            allowNull:false,
        },
        password:{
            type:DataTypes.STRING(100),
            allowNull: true,
        },
        money:{
            type : DataTypes.INTEGER,
            allowNull : false,
            defaultValue: 1000000,
        }
    }, {
        timestamps: true,
        paranoid: true,
    })
);