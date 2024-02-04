const router = require("express").Router();
let connectDB = require("./../database.js");
const { MongoClient, ObjectId } = require("mongodb");

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

//로그인했는지 검사를위한 미들웨어 함수 등록
function checkLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.render("login.ejs"); //미들웨어 함수가 끝나면 다음 진행해주세요 기능 이유는 next()가없으면 무한루프에 빠짐
  }
}

router.get("/request", async (req, res) => {
  await db.collection("chatroom").insertOne({
    member: [req.user._id, new ObjectId(req.query.writerId)],
    date: new Date(),
  });
  res.redirect("/chat/list");
});
router.get("/list", async (req, res) => {
  let result = await db
    .collection("chatroom")
    .find({
      member: req.user._id, //arr여도 내 아이디가 포함된거를 꺼내줌
    })
    .toArray();
  res.render("chatList.ejs", { result: result });
});
router.get("/detail/:id", async (req, res) => {
  let result = await db
    .collection("chatroom")
    .findOne({ _id: new ObjectId(req.params.id) });
  res.render("chatDetail.ejs", { result: result });
});

module.exports = router;
