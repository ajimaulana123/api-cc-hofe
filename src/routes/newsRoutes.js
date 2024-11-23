const express = require("express");
const newsController = require("../controllers/newsController");

const router = express.Router();

router.get("/", newsController.getAllNews);

router.post("/predict", newsController.checkNewsForHoax);

module.exports = router;
