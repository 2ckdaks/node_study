//mongodb 셋팅
const { MongoClient, ObjectId } = require("mongodb");

//아래 2줄만 옮긴 이유는 페이지마다 아래 코드를 넣으면 다른 페이지 들어갈때마다 db연결을 하기때문에 부담됨
//또한 db변수가 실행되는데 비교적 오래 걸리기때문에 다른페이지에서 export가 정상작동 하지 않을 수 있음
const url = process.env.MONGODB_URL; //민감한 내용은 환경변수 설정
let connectDB = new MongoClient(url).connect();

module.exports = connectDB;
