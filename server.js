const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const compression = require("compression");

const PORT = process.env.PORT || 3000;

const app = express();

app.use(logger("dev"));

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/budget", {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false, //see deprecation warnings
  family: 4 // Use IPv4, skip trying IPv6
});

// routes
app.use(require("./routes/api.js"));

app.listen(process.env.PORT || PORT, () => {
  console.log(`App running on port ${PORT}!`);
});