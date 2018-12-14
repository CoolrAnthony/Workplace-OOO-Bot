if (!global.hasOwnProperty('db')) {
    var Sequelize = require('sequelize'),
        sequelize = null

    if (process.env.DATABASE_URL) {
        // the application is executed on Heroku 
        sequelize = new Sequelize(process.env.DATABASE_URL, {
            dialect: 'postgres',
            protocol: 'postgres',
            port: process.env.DATABASE_URL.match[4],
            host: process.env.DATABASE_URL.match[3],
            logging: true, //false

            dialectOptions: {
                ssl: true
            }
        })
    } else {
        // the application is executed on the local machine 
        sequelize = new Sequelize(process.env.LocalDB, process.env.LocalDBUsername, process.env.LocalDBPassword, {
            dialect: 'postgres',
        });
    }

    global.db = {
        Sequelize: Sequelize,
        sequelize: sequelize,
        Op: Sequelize.Op,
        OOOuser: sequelize.import(__dirname + '/OOOUser'),
        snoozedUser: sequelize.import(__dirname + '/snoozedUser')
        // add models here
    }

    /*
    Associations can be defined here. E.g. like this:
    global.db.User.hasMany(global.db.SomethingElse)
    */
    db.OOOuser.hasMany(db.snoozedUser, {
        foreignKey: 'SnoozedOOOUserFBID',
        sourceKey: 'FBUsername'
    })

}

module.exports = global.db