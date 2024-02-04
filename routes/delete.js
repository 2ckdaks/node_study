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

//클라이언트에서 delete메서드로 받은후 delete api일시 db에서 알맞은 데이터 삭제
router.delete("/delete", checkLogin, async (req, res) => {
  try {
    console.log(req.query);
    await db.collection("post").deleteOne({
      _id: new ObjectId(req.query.docid),
      user: new ObjectId(req.user._id), // 본인이 작성한 글만 삭제권한 부여
    });
    res.send("삭제완료");
  } catch (e) {
    console.log(e);
    res.send("게시물 삭제에 실패하였습니다.");
  }
});

module.exports = router;
