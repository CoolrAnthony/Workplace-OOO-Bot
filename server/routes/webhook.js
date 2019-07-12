var addDays = require('date-fns/add_days')
var graphapi = require("request-promise").defaults({
  baseUrl: "https://graph.facebook.com",
  json: true,
  auth: {
    bearer: process.env.WP_ACCESS_TOKEN
  }
});
const express = require("express");
const router = express.Router();
router
  .get("/", (req, res) => {
    if (
      req.query["hub.mode"] === "subscribe" &&
      req.query["hub.verify_token"] === process.env.WP_VERIFY_TOKEN
    ) {
      console.log("Validating webhook");
      res.status(200).send(req.query["hub.challenge"]);
    } else {
      console.error(
        "Failed validation. Make sure the validation tokens match."
      );
      res.sendStatus(403);
    }
  })

  .post("/", (req, res, next) => {
    if (req.body.object === "group") { //it's a group post
      req.body.entry.forEach(entry => {
        entry.changes.forEach(change => {
          if (change.value.message_tags && change.value) {
            const promises = [] // collect all promises here
            change.value.message_tags.forEach(taggedUser => {
              const promise = db.OOOuser.findAll({
                where: {
                  FBUsername: taggedUser.id
                }
              }, change.value).then((oooUser) => {
                if (oooUser.length == 1) {
                  let returnObj = []
                  returnObj.postID = change.value.post_id
                  returnObj.user = oooUser
                  return returnObj
                }
              })
              promises.push(promise)
            })
            Promise.all(promises).then(results => {
              let message = []
              message.postID = results[0].postID
              if (results) {
                if (results.length == 1) {
                  //there was one person tagged
                  message.message = results[0].user[0].Name.split(" ")[0] + ' is currently out of office. Here\'s their message:\n\n' + results[0].user[0].Message
                  let url = '/' + message.postID + '/comments'
                  graphapi({
                    url: url,
                    method: 'POST',
                    qs: {
                      message: message.message
                    }
                  })
                }
                if (results.length > 1) {

                  const messagePromises = []
                  results.forEach(OutUser => {
                    if (OutUser) {
                      messagePromise = ('\n\n' + OutUser.user[0].Name + ': "' + OutUser.user[0].Message + '"')
                      messagePromises.push(messagePromise)
                    }

                  })
                  Promise.all(messagePromises).then((messagebottom) => {
                    message.message = 'The following people are out of office: ' + messagebottom
                    let url = '/' + message.postID + '/comments'
                    graphapi({
                      url: url,
                      method: 'POST',
                      qs: {
                        message: message.message
                      }
                    })
                  })
                }
              }
            })
          }
        })
      })
    }
    if (req.body.object === "page") { //it's a message to a bot
      req.body.entry.forEach(entry => {
        if (entry.messaging && entry.messaging[0].postback) {
          //The user clicked a postback
          console.log('message - postback sent')
          entry.messaging.forEach((message) => {
            switch (message.postback.payload) {
              case 'Get_Started':
                graphapi({
                    //get the user's details
                    url: '/' + entry.messaging[0].sender.id,
                    method: 'GET',
                    fields: 'first_name'
                  })
                  .then((user) => {
                    let senderFirstName = user.name.split(" ")[0];
                    let domain
                    if (process.env.NODE_ENV === 'DEVELOPMENT') {
                      domain = 'e2212e61.ngrok.io'
                    } else {
                      domain = 'https://coolr-wp-ooobot.herokuapp.com/'
                    }
                    let url = domain + '/enableOOO?FBUsername=' + entry.messaging[0].sender.id + '&Name=' + user.name
                    let json = {
                      recipient: {
                        id: entry.messaging[0].sender.id
                      },
                      message: {
                        attachment: {
                          type: 'template',
                          payload: {
                            template_type: 'button',
                            text: 'Hi ' + senderFirstName + ', how can I help?',
                            buttons: [{
                              type: 'web_url',
                              url: url,
                              title: 'Enable my OOO',
                              messenger_extensions: 'true',
                              webview_height_ratio: 'compact',
                              webview_share_button: "hide"
                            }]
                          }
                        }
                      }
                    };
                    graphapi({
                      url: "/me/messages",
                      method: "POST",
                      json: json
                    });
                  })
                break

              case 'Delete_OOO':
                db.OOOuser.destroy({
                  where: {
                    FBUsername: message.sender.id
                  }
                }).then(() => {
                  let json = {
                    recipient: {
                      id: message.sender.id
                    },
                    "message": {
                      "text": 'Your out of office has been disabled.\n\nIf I can help again in future, just say "hi"'
                    }
                  };
                  graphapi({
                    url: "/me/messages",
                    method: "POST",
                    json: json
                  });
                })
                break
            }
          })
        } else {
          //The user typed a message so send them the start menu
          console.log('message - text sent')
          entry.messaging.forEach((message) => {
            let SQLPromise = (db.OOOuser.findAll({
              where: {
                [db.Op.and]: [{
                    FBUsername: message.sender.id
                  },
                  {
                    StartTime: {
                      [db.Op.lt]: new Date()
                    }
                  }
                ]
              }
            }))
            let graphPromise = (graphapi({
              //get the user's details
              url: '/' + message.sender.id,
              method: 'GET',
              fields: 'first_name'
            }))
            Promise.all([SQLPromise, graphPromise]).then((returnValues) => {
              let senderFirstName = returnValues[1].name.split(" ")[0];
              let domain
              if (process.env.NODE_ENV === 'DEVELOPMENT') {
                domain = 'https://17b1df46.ngrok.io'
              } else {
                domain = 'https://coolr-wp-ooobot.herokuapp.com/'
              }
              let url = domain + '/enableOOO?FBUsername=' + returnValues[1].id + '&Name=' + returnValues[1].name
              let buttons = []
              if (returnValues[0].length == 0) {
                //the user does not have an OOO configured so we send them the enable OOO button
                buttons = ([{
                  type: 'web_url',
                  url: url,
                  title: 'Enable my OOO',
                  messenger_extensions: 'true',
                  webview_height_ratio: 'compact',
                  webview_share_button: "hide"
                }])
              } else {
                //the user has an OOO wo we need to send them options to edit or disable
                buttons = ([{
                    type: 'web_url',
                    url: url,
                    title: 'Edit my OOO',
                    messenger_extensions: 'true',
                    webview_height_ratio: 'compact',
                    webview_share_button: "hide"
                  },
                  {
                    type: 'postback',
                    payload: 'Delete_OOO',
                    title: 'Cancel my OOO'
                  }
                ])
              }
              let json = {
                recipient: {
                  id: returnValues[1].id
                },
                message: {
                  attachment: {
                    type: 'template',
                    payload: {
                      template_type: 'button',
                      text: 'Hi ' + senderFirstName + ', how can I help?',
                      buttons: buttons
                    }
                  }
                }
              };
              graphapi({
                url: "/me/messages",
                method: "POST",
                json: json
              });
            })
          })
        }
      });
    }
    if (req.body.object === "user") { //it's a user sending a message
      req.body.entry.forEach(entry => {
        entry.changes.forEach(change => {
          change.value.to.data.forEach(messagedUser => {
            let dataObj = []
            dataObj.senderID = change.value.from.id
            dataObj.senderName = change.value.from.name
            dataObj.recipientID = messagedUser.id
            dataObj.recipientName = messagedUser.name
            db.OOOuser.findAll({
              where: {
                [db.Op.and]: [{
                    FBUsername: messagedUser.id
                  },
                  {
                    StartTime: {
                      [db.Op.lt]: new Date()
                    }
                  }
                ]
              },
              include: [{
                model: db.snoozedUser
              }]
            }, dataObj).then((OOOUser) => {
              console.log('Hoisting dataObj ', dataObj.length)
              OOOUser.forEach(SQLResult => {
                if (SQLResult.EndTime && SQLResult.EndTime > new Date() && (SQLResult.snoozedUsers.filter(snoozedUser => snoozedUser.SnoozedOOOUserFBID = '100028458840735')).length == 0) {
                  //The end date for the OOO is after today, ie the OOO is still active
                  //AND the sender and recipient aren't snoozed. Users become snoozed
                  //if the bot had already told the sender that the recipient is OOO
                  let json = {
                    recipient: {
                      id: change.value.from.id
                    },
                    message: {
                      text: 'Hi ' + dataObj.senderName.split(" ")[0] + ',\n\n\You just sent a message to ' + dataObj.recipientName.split(" ")[0] + '. ' + dataObj.recipientName.split(" ")[0] + ' is currently out of office. Details below:\n\n' + SQLResult.Message
                    }
                  };
                  graphapi({
                    url: "/me/messages",
                    method: "POST",
                    json: json
                  });

                  db.snoozedUser.create({
                    //Snooze the send and receiver so that the sender doesn't get an OOO every time they message the recipient
                    SenderUserFBID: change.value.from.id,
                    SnoozedOOOUserFBID: SQLResult.FBUsername,
                    SnoozedTime: Date.now()
                  })
                }
              })
            })
          })
        })
      })
    }

    res.send(200);
  });
module.exports = router;