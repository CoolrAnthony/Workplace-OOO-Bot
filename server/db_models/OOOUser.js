module.exports = function (sequelize, DataTypes) {
    return sequelize.define("OOOUser", {
        Name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        FBUsername: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
            unique: true
        },
        StartTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        EndTime: {
            type: DataTypes.DATE
        },
        Message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        SummaryRequired: {
            type: DataTypes.BOOLEAN
        }
    })
}