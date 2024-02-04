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

router.post("/", async (req, res) => {
  await db.collection("comment").insertOne({
    content: req.body.content,
    writerId: new ObjectId(req.user.id),
    writer: req.user.username,
    parentId: new ObjectId(req.body.parentId),
  });
  res.redirect("back");
});

module.exports = router;
