const router = require("express").Router();

router.get("/", (req, res) => {
  // res.sendFile(__dirname + "/index.html");
  res.render("index.ejs");
});

module.exports = router;
