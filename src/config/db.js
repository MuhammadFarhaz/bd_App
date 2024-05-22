var mongoose = require("mongoose");

const db = "mongodb+srv://awais:yb7DKCYaIOC8cCY9@cluster0.mdlmo.mongodb.net/"

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

