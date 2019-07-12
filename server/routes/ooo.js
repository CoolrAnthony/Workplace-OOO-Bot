var graphapi = require("request-promise").defaults({
  baseUrl: "https://graph.facebook.com",
  json: true,
  auth: {
    bearer: process.env.WP_ACCESS_TOKEN
  }
});
exports.enable = function(req, res) {
  let referer;
  if (req.get("Referer").indexOf("facebook.com") >= 0) {
    referer = ".facebook.com";
  }
  if (req.get("Referer").indexOf("workplace.com") >= 0) {
    referer = ".workplace.com";
  }
  if (referer || process.env.NODE_ENV == "DEVELOPMENT") {
    res.setHeader(
      "X-Frame-Options",
      "ALLOW-FROM https://" + process.env.ORGANISATION_WP_DOMAIN + referer
    );
    res.set({
      "Content-Security-Policy":
        "frame-ancestors https://" +
        process.env.ORGANISATION_WP_DOMAIN +
        referer,
      "X-Frame-Options":
        "ALLOW-FROM https://" + process.env.ORGANISATION_WP_DOMAIN + referer
    });

    db.OOOuser.findAll({
      where: {
        [db.Op.and]: [
          {
            FBUsername: req.query.FBUsername
          },
          {
            StartTime: {
              [db.Op.lt]: new Date()
            }
          }
        ]
      }
    }).then(SQLResult => {
      let dateFormat = require("date-fns/format");
      let formatedStartTime;
      let formatedEndTime;
      let Message;
      let summaryRequired;
      if (SQLResult.length == 0) {
        //the user doesn't have an OOO configured so set default values
        formatedStartTime = dateFormat(Date.now(), [
          (format = "DD-MM-YYYY - HH:mm")
        ]);
        formatedEndTime = "";
        Message = "";
        summaryRequired = true;
      } else {
        formatedStartTime = dateFormat(SQLResult[0].StartTime, [
          (format = "DD-MM-YYYY - HH:mm")
        ]);
        if (SQLResult[0].EndTime) {
          formatedEndTime = dateFormat(SQLResult[0].EndTime, [
            (format = "DD-MM-YYYY - HH:mm")
          ]);
        } else {
          formatedEndTime = null;
        }
        Message = SQLResult[0].Message;
        summaryRequired = SQLResult[0].SummaryRequired;
      }
      //send the form
      res.render("ooo", {
        Name: req.query.Name,
        FBUsername: req.query.FBUsername,
        startTime: formatedStartTime,
        endTime: formatedEndTime,
        message: Message,
        summaryRequired: summaryRequired
      });
    });
  } else {
    res.send("This resouce can only be loaded from a Facebook url");
  }
};
exports.update = function(req, res) {
  console.log("upsert");
  var moment = require("moment");
  if (req.body["date-start"]) {
    startDate = moment(req.body["date-start"], "DD-MM-YYYY - HH:mm");
  }
  if (req.body["date-end"]) {
    endDate = moment(req.body["date-end"], "DD-MM-YYYY - HH:mm");
  } else {
    endDate = null;
  }
  let sumReq;
  if (req.body["summary-required"]) {
    sumReq = true;
  } else {
    sumReq = false;
  }
  db.OOOuser.upsert({
    Name: req.body.Name,
    FBUsername: req.body.FBUsername,
    StartTime: startDate,
    EndTime: endDate,
    Message: req.body.message,
    SummaryRequired: sumReq
  }).then(() => {
    let json = {
      recipient: {
        id: req.body.FBUsername
      },
      message: {
        text:
          'Your out of office has been set.\n\nIf you wish to edit it or change any settings, just say "hi".'
      }
    };
    graphapi({
      url: "/me/messages",
      method: "POST",
      json: json
    });
  });
  res.sendStatus(200);
};
