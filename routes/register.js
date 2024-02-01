const router = require("express").Router();
let connectDB = require("./../database.js");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt"); //가입시 비밀번호 암호화를위한 라이브러리 셋팅

//mongodb 셋팅
let db;
connectDB
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("forum");
  })
  .catch((err) => {
    console.log(err);
  });

//회원가입 기능 구현
router.get("/", (req, res) => {
  res.render("register.ejs");
});
router.post("/", async (req, res) => {
  let hash = await bcrypt.hash(req.body.password, 10); //암호화(해싱)하는 함수 + 옆에 숫자(10)은 얼마나 꼬아서 암호화할지 정하는 정도
  console.log(hash);
  await db
    .collection("user")
    .insertOne({ username: req.body.username, password: hash });
  res.redirect("/");
});

module.exports = router;
