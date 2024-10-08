const { pool } = require("../../database");

module.exports = {
  saveFootballMessage: (date, time, type, message, Correct_Answer) => {
    console.log("Correct_Answer ==>>>", Correct_Answer);
    let checkExistingContent = process.env.checkExistingContent
      .replace("<DATETIME>", date)
      .replace("<time>", time);
    console.log(checkExistingContent);
    pool.query(checkExistingContent, [], (errCheck, resultCheck) => {
      if (errCheck) {
        throw errCheck;
      }
      //   console.log("resultCheck ", resultCheck);

      if (resultCheck.length > 0) {
        const deleteContent = process.env.deleteExistingTimeContent
          .replace("<DATETIME>", date)
          .replace("<time>", time);
        console.log("deleteContent ", deleteContent);
        pool.query(
          deleteContent,
          [],
          (errDeleteContent, resultDeleteContent) => {
            if (errDeleteContent) {
              throw errDeleteContent;
            }
            console.log("INIT ", process.env.insertFootBallScheduledMessage);

            const insertFootBallScheduledMessage =
              process.env.insertFootBallScheduledMessage
                .replace("<option>", Correct_Answer)
                .replace("<DATE>", date)
                .replace("<TIME>", time)
                .replace("<TYPE>", type)
                .replace("<MESSAGE>", message);

            console.log(insertFootBallScheduledMessage);

            pool.query(insertFootBallScheduledMessage, [], (err, result) => {
              if (err) throw err;
            });
          }
        );
      } else {
        const insertFootBallScheduledMessage =
          process.env.insertFootBallScheduledMessage
            .replace("<DATE>", date)
            .replace("<TIME>", time)
            .replace("<TYPE>", type)
            .replace("<MESSAGE>", message);
        console.log(insertFootBallScheduledMessage);
        pool.query(insertFootBallScheduledMessage, [], (err, result) => {
          if (err) throw err;
        });
      }
    });
  },
  saveGoalAlertContent: (message) => {
    console.log(message);
    return new Promise((res, rejj) => {
      pool.query(
        process.env.checkExistingGoalContent,
        [message],
        (err, check) => {
          console.log(err, "67");
          if (err) return res([err, null]);
          if (check[0].EXIST >= 1) {
            console.log("Message already exist");
            return res([null, "Message already Exist"]);
          }
          // insert new message
          pool.query(
            "insert into tbl_goal_schedule_message set ?",
            {
              type: "NEWS",
              message: message,
            },
            (err, done) => {
              console.log(err);
              if (err) return res([err, null]);
              return res([null, "Inserted into table successfully"]);
            }
          );
        }
      );
    });
  },
  fetchContentItems: (callback) => {
    const fetchFootBallContent = process.env.fetchFootBallContent;

    pool.query(fetchFootBallContent, [], (err, result) => {
      // console.log("RESULT ", result);
      if (err) throw err;
      return callback("", result);
    });
  },
  _npfl_fetchContentItems: (callback) => {
    const npflfetchFootBallContent = process.env.npflfetchFootBallContent;

    pool.query(npflfetchFootBallContent, [], (err, result) => {
      // console.log("RESULT ", result);
      if (err) throw err;
      return callback("", result);
    });
  },
  fethcGoalContent: (callback) => {
    const goalContent = process.env.fethcGoalContent;

    pool.query(goalContent, [], (err, result) => {
      // console.log("RESULT ", result);
      if (err) throw err;
      return callback("", result);
    });
  },
  deleteContentItems: (id, callback) => {
    const deleteContent = process.env.deleteContent.replace("<ID>", id);
    pool.query(deleteContent, [], (err, result) => {
      if (err) throw err;
      return callback("", "Successfully Deleted");
    });
  },
};
