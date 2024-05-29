const express = require("express");
var bodyParser = require("body-parser");
var cors = require('cors')
const path = require('path')
const multer = require("multer")
const fs = require("fs")
require('dotenv').config();
const cookieParser = require("cookie-parser")
const fileUpload = require("express-fileupload");


const port = process.env.PORT || 5001
const app = express();



const propertyRoute = require('./src/property/PropertyRoute');
const authrouter = require("./src/auth/AuthRoute")
const setupDB = require("./src/config/db");
const { fileURLToPath } = require("url");

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp",
}))

setupDB();





app.get('/', (req, res) => {




  res.send("server is ab hoja shoro")
})




app.use("/auth", authrouter)




app.use('/groceries', propertyRoute)



app.listen(5001, '0.0.0.0', () => {
  console.log('Server is running on port 5001');
});





