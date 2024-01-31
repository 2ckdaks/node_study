const express = require("express");
const app = express();

app.use(express.static(__dirname + "/public")); //public 폴더내 등록된 파일 사용가능

//환경변수 셋팅
require("dotenv").config();

//client에서 보낸 데이터를 서버에서 출력을위한 셋팅
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//methodOverride사용을 위한 셋팅
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

//mongodb 셋팅
const { MongoClient, ObjectId } = require("mongodb");
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

//passport 라이브러리 셋팅
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const res = require("express/lib/response");
//아래 순서 중요
app.use(passport.initialize());
app.use(
  session({
    secret: "암호화에 쓸 비번", //session 문자열 암호화시 사용할 비번
    resave: false, //유저가 요청날릴때 세션 데이터 갱신할지 여부
    saveUninitialized: false, //로그인안해도 세션을 갱신할것인지 여부
  })
);

app.use(passport.session());

//passport.authenticate('local')()로 아래 기능 사용 가능
passport.use(
  new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
    try {
      let result = await db
        .collection("user")
        .findOne({ username: 입력한아이디 });
      if (!result) {
        return cb(null, false, { message: "아이디 DB에 없음" });
      }
      if (result.password == 입력한비번) {
        return cb(null, result);
      } else {
        return cb(null, false, { message: "비번불일치" });
      }
    } catch (e) {
      res.send("로그인 시도에 실패하였습니다");
    }
  })
);

// --------------------------------------------------------
// -------------------------------------------------------- 셋팅 경계선

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
  //예외처리
  if (req.body.title == "") {
    res.send("제목 누락");
  } else {
    try {
      await db
        .collection("post")
        .insertOne({ title: req.body.title, content: req.body.content });
      res.send("success");
    } catch (e) {
      console.log(e);
      res.send("에러발생");
    }
  }
});

//상세페이지 기능을 위한 url 파라미터 사용법
app.get("/detail/:id", async (req, res) => {
  try {
    let result = await db
      .collection("post")
      .findOne({ _id: new ObjectId(req.params) });
    console.log(result);
    if (result == null) {
      res.status(400).send("url 입력 에러");
    }
    res.render("detail.ejs", { result: result });
  } catch (e) {
    console.log(e);
    res.send("게시물을 찾을 수 없습니다.");
  }
});

//게시글 수정을 위해 상세페이지 이동
app.get("/edit/:id", async (req, res) => {
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
app.put("/edit", async (req, res) => {
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

//클라이언트에서 delete메서드로 받은후 delete api일시 db에서 알맞은 데이터 삭제
app.delete("/delete", async (req, res) => {
  try {
    console.log(req.query);
    await db
      .collection("post")
      .deleteOne({ _id: new ObjectId(req.query.docid) });
    res.send("삭제완료");
  } catch (e) {
    console.log(e);
    res.send("게시물 삭제에 실패하였습니다.");
  }
});

//pagenation 구현
app.get("/list/:id", async (req, res) => {
  let result = await db
    .collection("post")
    .find()
    .skip((req.params.id - 1) * 5)
    .limit(3)
    .toArray();
  res.render("list.ejs", { result: result });
});

//로그인 기능 구현
app.get("/login", async (req, res) => {
  res.render("login.ejs");
});
app.post("/login", async (req, res, next) => {
  passport.authenticate("local", (error, user, info) => {
    // error = 에러시 출력
    // user = 로그인 성공시 유저 정보
    // info = 실패시 이유
    if (error) return res.status(500).json(error);
    if (!user) return res.status(401).json(info.message);
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  })(req, res, next);
});
