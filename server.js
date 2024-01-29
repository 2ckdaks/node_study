const express = require("express");
const app = express();

app.use(express.static(__dirname + "/public")); //public 폴더내 등록된 파일 사용가능

app.listen(8080, () => {
  console.log("http://localhost:8080 에서 서버 실행중");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/shop", (req, res) => {
  res.send("shop page");
});
