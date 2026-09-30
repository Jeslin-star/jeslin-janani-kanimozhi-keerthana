const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  uploadMaterial,
  getMaterials,
  getMaterialById,
  summarizeMaterial,
  generateFlashcards,
  generateQuiz,
  generateStudyPlan,
} = require("../controllers/materialController");

// All material routes require authentication
router.use(protect);

router.post("/upload", upload.single("file"), uploadMaterial);
router.get("/", getMaterials);
router.get("/:id", getMaterialById);
router.post("/:id/summarize", summarizeMaterial);
router.post("/:id/flashcards", generateFlashcards);
router.post("/:id/quiz", generateQuiz);
router.post("/:id/study-plan", generateStudyPlan);

module.exports = router;
