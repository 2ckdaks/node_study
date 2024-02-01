const router = require("express").Router();
let connectDB = require("./../database.js");

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

//이미지 업로드를 위한 s3 셋팅
const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "nodejsforum",
    key: function (요청, file, cb) {
      cb(null, Date.now().toString()); //업로드시 파일명 변경가능
    },
  }),
});

router.get("/", (req, res) => {
  res.render("write.ejs");
});

//client에서 전송받은 데이터를 db에 저장
//아래 미들웨어 upload.single은 아래 api로 전송될때 이미지를 담고있음
//여러장의 이미지 업로드는 upload.array('img1', 2) 사용 + 갯수 제한 가능 -> 출력은 req.files
router.post("/", upload.single("img1"), async (req, res) => {
  console.log(req.body);
  console.log(req.file);
  //예외처리
  if (req.body.title == "") {
    res.send("제목 누락");
  } else {
    try {
      await db.collection("post").insertOne({
        title: req.body.title,
        content: req.body.content,
        img: req.file.location,
      });
      res.send("success");
    } catch (e) {
      console.log(e);
      res.send("에러발생");
    }
  }
});

module.exports = router;
