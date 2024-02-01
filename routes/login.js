const express = require("express");
const app = express();
const router = require("express").Router();
let connectDB = require("./../database.js");
const { MongoClient, ObjectId } = require("mongodb");
const MongoStore = require("connect-mongo"); //세션을 db에 저장하기위한 라이브러리 셋팅
const bcrypt = require("bcrypt"); //가입시 비밀번호 암호화를위한 라이브러리 셋팅
const passport = require("passport"); //passport 라이브러리 셋팅

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

//로그인 기능 구현
router.get("/", async (req, res) => {
  console.log(req.user);
  res.render("login.ejs");
});
router.post("/", async (req, res, next) => {
  passport.authenticate("local", (error, user, info) => {
    // error = 에러시 출력
    // user = 로그인 성공시 유저 정보
    // info = 실패시 이유
    if (error) return res.status(500).json("/login" + error);
    if (!user) return res.status(401).json("/login" + info.message);
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  })(req, res, next);
});

module.exports = router;
