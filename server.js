const express = require("express");
const app = express();

app.use(express.static(__dirname + "/public")); //public 폴더내 등록된 파일 사용가능

//환경변수 셋팅
require("dotenv").config();

//mongodb 셋팅
const { MongoClient } = require("mongodb");
let db;
const url = process.env.MONGODB_UTL;
new MongoClient(url)
  .connect()
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("forum");
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(8080, () => {
  console.log("http://localhost:8080 에서 서버 실행중");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/shop", (req, res) => {
  res.send("shop page");
});
