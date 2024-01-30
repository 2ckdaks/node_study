const express = require("express");
const app = express();

app.use(express.static(__dirname + "/public")); //public 폴더내 등록된 파일 사용가능

//환경변수 셋팅
require("dotenv").config();

//client에서 보낸 데이터를 서버에서 출력을위한 셋팅
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//mongodb 셋팅
const { MongoClient } = require("mongodb");
let db;
const url = process.env.MONGODB_URL; //민감한 내용은 환경변수 설정
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

//ejs셋팅, 출력한 데이터 전달
app.get("/list", async (req, res) => {
  let result = await db.collection("post").find().toArray();
  res.render("list.ejs", { result: result });
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

//client에서 전송받은 데이터를 db에 저장
app.post("/write", async (req, res) => {
  console.log(req.body);
  await db
    .collection("post")
    .insertOne({ title: req.body.title, content: req.body.content });
  res.send("success");
});
