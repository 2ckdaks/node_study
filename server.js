const express = require("express");
const app = express();
const bcrypt = require("bcrypt"); //가입시 비밀번호 암호화를위한 라이브러리 셋팅
app.use(express.static(__dirname + "/public")); //public 폴더내 등록된 파일 사용가능
require("dotenv").config(); //환경변수 셋팅
const MongoStore = require("connect-mongo"); //세션을 db에 저장하기위한 라이브러리 셋팅

//client에서 보낸 데이터를 서버에서 출력을위한 셋팅
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//methodOverride사용을 위한 셋팅
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

//Socket.io 셋팅
const { createServer } = require("http");
const { Server } = require("socket.io");
const server = createServer(app);
const io = new Server(server);

//mongodb 셋팅
const { MongoClient, ObjectId } = require("mongodb");
let connectDB = require("./database.js");
let db;
connectDB
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("forum");

    server.listen(8080, () => {
      console.log("http://localhost:8080 에서 서버 실행중");
    });
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
    cookie: { maxAge: 60 * 60 * 1000 }, //유효기간 설정 미설정시 기본 2주 << 현재 설정은 1시간이됨
    //db에 로그인 session 저장
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URL,
      dbName: "forum",
    }),
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
      //로그인시 암호화된 비밀번호 비교를위해 해싱전, 해싱후 비교후 true/false로 남김
      let hashpassword = await bcrypt.compare(입력한비번, result.password);
      if (hashpassword == true) {
        return cb(null, result);
      } else {
        return cb(null, false, { message: "비번불일치" });
      }
    } catch (e) {
      return cb(new Error("로그인 시도에 실패하였습니다"));
    }
  })
);

//로그인시 세션 생성
passport.serializeUser((user, done) => {
  console.log(user); //로그인 시도중인 유저 정보
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username }); //해당 줄에 기록된 세션 생성과, 쿠키 전달
  });
});

//로그인 성공시 유저에게 받은 쿠키 분석
//아래 코드덕분에 아무 api에서 req.user작성시 유저정보 출력됨
//대신 이 코드 아래있는 코드들만 가능
passport.deserializeUser(async (user, done) => {
  let result = await db
    .collection("user")
    .findOne({ _id: new ObjectId(user.id) });
  delete user.password; //비밀번호는 소중하니까 지워서 전달
  process.nextTick(() => {
    // return done(null, user); 해당줄과같이 바로 user를 전송시 최신업데이트전 정보가 전달될수있음
    return done(null, result); //고로 db에서 한번 조회이후 결과값을 전달
  });
});

// -------------------------------------------------------- 셋팅 경계선

//로그인했는지 검사를위한 미들웨어 함수 등록
function checkLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.render("login.ejs"); //미들웨어 함수가 끝나면 다음 진행해주세요 기능 이유는 next()가없으면 무한루프에 빠짐
  }
}

// app.use(checkLogin); //모든 api에 등록하기 귀찮으면 해당줄 코드 삽입으로 해당줄 밑에 api코드들은 모두 미들웨어 함수에 거침
// app.use('url', checkLogin) //url에 특정api들을 적으면 그 api요청이 왔을때 미들웨어 함수를 실행하게됨(하위 url 자동 포함)

//router를 사용하여 API들을 다른 파일로 분리하기
app.use("/", require("./routes/index.js"));
app.use("/login", require("./routes/login.js"));
app.use("/register", require("./routes/register.js"));
app.use("/list", require("./routes/list.js"));
app.use("/detail", require("./routes/detail.js"));
app.use("/write", require("./routes/write.js"));
app.use("/edit", require("./routes/edit.js"));
app.use("/delete", require("./routes/delete.js"));
app.use("/search", require("./routes/search.js"));
app.use("/comment", require("./routes/comment.js"));
app.use("/chat", require("./routes/chat.js"));

io.on("connection", (socket) => {
  socket.on("ask-join", (data) => {
    socket.join(data);
  });
  socket.on("message-send", (data) => {
    console.log(data);
    io.to(data.room).emit("message-broadcast", data.msg);
  });
});
