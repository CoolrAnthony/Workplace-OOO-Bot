module.exports = function (sequelize, DataTypes) {
    return sequelize.define("snoozedUser", {
        SenderUserFBID: {
            type: DataTypes.STRING,
            allowNull: false
        },
        SnoozedOOOUserFBID: {
            type: DataTypes.STRING,
            allowNull: false
        },
        SnoozedTime: {
            type: DataTypes.DATE,
            allowNull: false
        }
    })
}