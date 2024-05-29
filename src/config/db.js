var mongoose = require("mongoose");

const db = "mongodb+srv://awais2323:FhC9Tm5Xion0bHiU@cluster0.62yt72c.mongodb.net/"

const setupDB = () => {
  console.log("process.env.DB",);
  mongoose.connect(db,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
    function (err) {
      if (err) throw err;
      console.log("successfully connected with database");
    }
  );
};

module.exports = setupDB;

