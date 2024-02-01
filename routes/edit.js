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

//게시글 수정을 위해 상세페이지 이동
router.get("/:id", checkLogin, async (req, res) => {
  try {
    let result = await db
      .collection("post")
      .findOne({ _id: new ObjectId(req.params) });
    res.render("edit.ejs", { result: result });
  } catch (e) {
    console.log(e);
    res.send("게시물을 찾을 수 없습니다.");
  }
});

//클라이언트에서 수정된 글 내용을 서버로 전달받아서 db에 업데이트
router.put("/", checkLogin, async (req, res) => {
  try {
    await db
      .collection("post")
      .updateOne(
        { _id: new ObjectId(req.body._id) },
        { $set: { title: req.body.title, content: req.body.content } }
      );
    res.redirect("/list");
  } catch (e) {
    console.log(e);
    res.send("수정에 실패하였습니다");
  }
});

module.exports = router;
