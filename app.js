const API_BASE = "/api";

// =========================
// Authentication
// =========================

let isRegisterMode = false;

function showLogin() {
    isRegisterMode = false;

    document.getElementById("loginTab").classList.add("active");
    document.getElementById("registerTab").classList.remove("active");

    document.getElementById("name").style.display = "none";
    document.getElementById("name").required = false;

    document.getElementById("authButtonText").textContent = "Login";
    document.getElementById("authMessage").textContent = "";
}

function showRegister() {
    isRegisterMode = true;

    document.getElementById("registerTab").classList.add("active");
    document.getElementById("loginTab").classList.remove("active");

    document.getElementById("name").style.display = "block";
    document.getElementById("name").required = true;

    document.getElementById("authButtonText").textContent = "Register";
    document.getElementById("authMessage").textContent = "";
}


// =========================
// Login / Register
// =========================

document.getElementById("authForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const authMessage = document.getElementById("authMessage");
    const authButtonText = document.getElementById("authButtonText");

    authMessage.textContent = "";
    authButtonText.textContent = isRegisterMode ? "Registering..." : "Logging in...";

    try {
        const endpoint = isRegisterMode
            ? `${API_BASE}/auth/register`
            : `${API_BASE}/auth/login`;

        const body = isRegisterMode
            ? { name, email, password }
            : { email, password };

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Authentication failed");
        }

        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        authMessage.textContent = data.message || "Success!";

        showDashboard();

    } catch (error) {
        console.error("Authentication error:", error);
        authMessage.textContent = error.message;
    } finally {
        authButtonText.textContent = isRegisterMode ? "Register" : "Login";
    }
});


// =========================
// Dashboard
// =========================

function showDashboard() {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("dashboardSection").style.display = "block";
    document.getElementById("logoutBtn").style.display = "block";

    loadMaterials();
}


// =========================
// Logout
// =========================

function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    document.getElementById("authSection").style.display = "block";
    document.getElementById("dashboardSection").style.display = "none";
    document.getElementById("logoutBtn").style.display = "none";

    document.getElementById("authForm").reset();

    showLogin();
}


// =========================
// Materials
// =========================

async function loadMaterials() {
    const token = localStorage.getItem("accessToken");
    const materialsList = document.getElementById("materialsList");

    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/materials`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load materials");
        }

        const materials = Array.isArray(data)
            ? data
            : data.materials || [];

        if (materials.length === 0) {
            materialsList.innerHTML = '<p class="empty">No materials uploaded yet.</p>';
            return;
        }

        materialsList.innerHTML = materials.map(material => `
            <div class="material-item">
                <h3>${escapeHtml(material.title || material.originalName || "Study Material")}</h3>
                <button onclick="generateQuiz('${material._id}')">
                    Generate Quiz
                </button>
            </div>
        `).join("");

    } catch (error) {
        console.error("Materials error:", error);
        materialsList.innerHTML = `<p class="message">${escapeHtml(error.message)}</p>`;
    }
}


// =========================
// Upload Material
// =========================

document.getElementById("uploadForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const token = localStorage.getItem("accessToken");
    const fileInput = document.getElementById("materialFile");
    const uploadMessage = document.getElementById("uploadMessage");

    if (!token) {
        uploadMessage.textContent = "Please login first.";
        return;
    }

    if (!fileInput.files.length) {
        uploadMessage.textContent = "Please select a file.";
        return;
    }

    const formData = new FormData();

    const title = document.getElementById("materialTitle").value.trim();

    formData.append("title", title);
    formData.append("file", fileInput.files[0]);

    uploadMessage.textContent = "Uploading...";

    try {
        const response = await fetch(`${API_BASE}/materials/upload`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Upload failed");
        }

        uploadMessage.textContent = data.message || "Material uploaded successfully.";

        fileInput.value = "";

        loadMaterials();

    } catch (error) {
        console.error("Upload error:", error);
        uploadMessage.textContent = error.message;
    }
});


// =========================
// Generate Quiz
// =========================

async function generateQuiz(materialId) {
    const token = localStorage.getItem("accessToken");
    const resultSection = document.getElementById("resultSection");
    const resultTitle = document.getElementById("resultTitle");
    const resultContent = document.getElementById("resultContent");

    resultSection.style.display = "block";
    resultTitle.textContent = "Generating Quiz...";
    resultContent.innerHTML = "<p>Please wait...</p>";

    try {
        const response = await fetch(
            `${API_BASE}/materials/${materialId}/quiz`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Quiz generation failed");
        }

        const quiz = data.quiz || [];

        console.log("QUIZ DATA:", data);
        console.log("QUIZ QUESTIONS:", quiz);

        resultTitle.textContent = "AI Generated Quiz";

        if (!quiz.length) {
            resultContent.innerHTML =
                "<p>No quiz questions were generated.</p>";
            return;
        }

        // Store quiz temporarily for validation
        window.currentQuiz = quiz;

        resultContent.innerHTML = quiz.map((item, index) => `
            <div class="quiz-question">
                <h3>
                    ${index + 1}. ${escapeHtml(item.question)}
                </h3>

                <div class="quiz-options">
                    ${(item.options || []).map((option, optionIndex) => `
                        <label>
                            <input
                                type="radio"
                                name="question-${index}"
                                value="${escapeHtml(option)}"
                            >
                            ${escapeHtml(option)}
                        </label>
                    `).join("")}
                </div>
            </div>
        `).join("") + `

            <div class="quiz-buttons">
                <button
                    type="button"
                    class="primary-btn"
                    onclick="submitQuiz()"
                >
                    Submit Quiz
                </button>

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="validateQuiz()"
                >
                    Validate
                </button>
            </div>

            <div id="quizResult" class="message"></div>
        `;

    } catch (error) {
        console.error("Quiz error:", error);
        resultTitle.textContent = "Quiz Error";
        resultContent.innerHTML =
            `<p>${escapeHtml(error.message)}</p>`;
    }
}

function submitQuiz() {
    if (!window.currentQuiz || !window.currentQuiz.length) {
        return;
    }

    let answered = 0;

    window.currentQuiz.forEach((item, index) => {
        const selected = document.querySelector(
            `input[name="question-${index}"]:checked`
        );

        if (selected) {
            answered++;
        }
    });

    const result = document.getElementById("quizResult");

    if (answered < window.currentQuiz.length) {
        result.textContent =
            `Please answer all questions. You answered ${answered} of ${window.currentQuiz.length}.`;
        return;
    }

    result.textContent =
        "All questions answered. Click Validate to check your answers.";
}


function validateQuiz() {
    if (!window.currentQuiz || !window.currentQuiz.length) {
        return;
    }

    let score = 0;

    window.currentQuiz.forEach((item, index) => {
        const selected = document.querySelector(
            `input[name="question-${index}"]:checked`
        );

        if (!selected) {
            return;
        }

        const correctAnswer =
            item.answer ||
            item.correctAnswer ||
            item.correct_option ||
            item.correctOption;

        if (
            correctAnswer &&
            selected.value.trim().toLowerCase() ===
            String(correctAnswer).trim().toLowerCase()
        ) {
            score++;
        }
    });

    const total = window.currentQuiz.length;
    const result = document.getElementById("quizResult");

    result.innerHTML =
        `<strong>Your Score: ${score} / ${total}</strong>`;
}


// =========================
// HTML Safety
// =========================

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}


// =========================
// Page Load
// =========================

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("logoutBtn").style.display = "none";

    const token = localStorage.getItem("accessToken");

    if (token) {
        showDashboard();
    } else {
        showLogin();
    }
});