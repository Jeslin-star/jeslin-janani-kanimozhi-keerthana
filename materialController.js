const fs = require("fs");
const Material = require("../models/Material");
const { askGemini } = require("../utils/gemini");

// Strip markdown code fences and parse a JSON object out of an AI response
const parseJSONResponse = (raw) => {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const error = new Error("AI service returned an unparseable response");
    error.status = 502;
    throw error;
  }
};

const findOwnedMaterial = async (id, userId) => {
  const material = await Material.findOne({ _id: id, user: userId });
  if (!material) {
    const error = new Error("Material not found");
    error.status = 404;
    throw error;
  }
  return material;
};

// POST /api/materials/upload
const uploadMaterial = async (req, res) => {
  const { title } = req.body;

  let content = req.body.content || "";
  if (req.file) {
    content = fs.readFileSync(req.file.path, "utf-8");
  }

  const material = await Material.create({
    user: req.user.id,
    title,
    content,
    filename: req.file ? req.file.filename : undefined,
  });

  res.status(201).json({ message: "Material uploaded", material });
};

// GET /api/materials
const getMaterials = async (req, res) => {
  const materials = await Material.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ materials });
};

// GET /api/materials/:id
const getMaterialById = async (req, res) => {
  const material = await findOwnedMaterial(req.params.id, req.user.id);
  res.json({ material });
};

// POST /api/materials/:id/summarize
const summarizeMaterial = async (req, res) => {
  const material = await findOwnedMaterial(req.params.id, req.user.id);

  const prompt = `Summarize the following study material concisely for exam revision:\n\n${material.content}`;
  const summary = await askGemini(prompt);

  material.summary = summary;
  await material.save();

  res.json({ summary });
};

// POST /api/materials/:id/flashcards
const generateFlashcards = async (req, res) => {
  const material = await findOwnedMaterial(req.params.id, req.user.id);

  const prompt = `Create 5-8 flashcards (question and answer pairs) from this study material. Respond ONLY with strict JSON (no markdown fences, no preamble) in this exact shape: { "flashcards": [{ "question": "...", "answer": "..." }] }\n\n${material.content}`;
  const raw = await askGemini(prompt);
  const parsed = parseJSONResponse(raw);

  material.flashcards = parsed.flashcards;
  await material.save();

  res.json({ flashcards: parsed.flashcards });
};

// POST /api/materials/:id/quiz
const generateQuiz = async (req, res) => {
  const material = await findOwnedMaterial(req.params.id, req.user.id);

  const prompt = `Create a 5-question multiple-choice quiz from this study material. Respond ONLY with strict JSON (no markdown fences, no preamble) in this exact shape: { "quiz": [{ "question": "...", "options": ["...","...","...","..."], "answer": "..." }] }\n\n${material.content}`;
  const raw = await askGemini(prompt);
  const parsed = parseJSONResponse(raw);

  material.quiz = parsed.quiz;
  await material.save();

  res.json({ quiz: parsed.quiz });
};

// POST /api/materials/:id/study-plan
const generateStudyPlan = async (req, res) => {
  const material = await findOwnedMaterial(req.params.id, req.user.id);

  const { goal, hoursPerDay, days } = req.body;

  const prompt = `Create a personalized ${days}-day study plan for the goal "${goal}", with ${hoursPerDay} hours of study per day, based on this study material:\n\n${material.content}`;
  const studyPlan = await askGemini(prompt);

  material.studyPlan = studyPlan;
  await material.save();

  res.json({ studyPlan });
};

module.exports = {
  uploadMaterial,
  getMaterials,
  getMaterialById,
  summarizeMaterial,
  generateFlashcards,
  generateQuiz,
  generateStudyPlan,
};
