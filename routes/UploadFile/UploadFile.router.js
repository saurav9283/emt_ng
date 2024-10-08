const {
  uploadContent,
  fetchContent,
  deleteContent,
  uploadGoalAlertContent,
} = require("./UploadFile.controller");

const router = require("express").Router();
const multer = require("multer");

const storage = multer.memoryStorage(); // Store the uploaded file in memory
const upload = multer({ storage });

router.post("/content-upload/NEWS", upload.single("file"), uploadGoalAlertContent);
router.post("/content-upload/QUIZ", upload.single("file"), uploadContent);
router.get("/fetchContent", fetchContent);
router.delete("/delete", deleteContent);

module.exports = router;
