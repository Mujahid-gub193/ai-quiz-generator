const apiBase = "/api";
const storageKey = "ai-quiz-generator-auth";

const state = {
  token: "",
  user: null,
  materials: [],
  quizzes: [],
  attempts: [],
  currentQuiz: null,
  selectedAttemptId: null,
  editingMaterialId: null,
  materialFilter: "",
  quizFilter: "",
};

const elements = {
  registerForm: document.querySelector("#registerForm"),
  loginForm: document.querySelector("#loginForm"),
  materialForm: document.querySelector("#materialForm"),
  quizForm: document.querySelector("#quizForm"),
  materialFormTitle: document.querySelector("#materialFormTitle"),
  materialSubmitButton: document.querySelector("#materialSubmitButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  logoutButton: document.querySelector("#logoutButton"),
  refreshDashboardButton: document.querySelector("#refreshDashboardButton"),
  materialSearchInput: document.querySelector("#materialSearchInput"),
  quizSearchInput: document.querySelector("#quizSearchInput"),
  authNotice: document.querySelector("#authNotice"),
  statsGrid: document.querySelector("#statsGrid"),
  progressCharts: document.querySelector("#progressCharts"),
  materialsList: document.querySelector("#materialsList"),
  quizzesList: document.querySelector("#quizzesList"),
  materialSelect: document.querySelector("#materialSelect"),
  quizContainer: document.querySelector("#quizContainer"),
  attemptsList: document.querySelector("#attemptsList"),
  attemptDetail: document.querySelector("#attemptDetail"),
  statusBoard: document.querySelector("#statusBoard"),
};

const loadSession = () => {
  try {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      return;
    }

    const session = JSON.parse(raw);
    state.token = session.token || "";
    state.user = session.user || null;
  } catch {
    localStorage.removeItem(storageKey);
  }
};

const saveSession = () => {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      token: state.token,
      user: state.user,
    }),
  );
};

const clearSession = () => {
  state.token = "";
  state.user = null;
  state.materials = [];
  state.quizzes = [];
  state.attempts = [];
  state.currentQuiz = null;
  state.selectedAttemptId = null;
  state.editingMaterialId = null;
  state.materialFilter = "";
  state.quizFilter = "";
  localStorage.removeItem(storageKey);
};

const resetMaterialForm = () => {
  state.editingMaterialId = null;
  elements.materialForm.reset();
  elements.materialFormTitle.textContent = "Create Material";
  elements.materialSubmitButton.textContent = "Save Material";
  elements.cancelEditButton.hidden = true;
};

const addStatus = (message) => {
  const line = document.createElement("p");
  line.className = "status-line";
  line.textContent = `${new Date().toLocaleTimeString()}: ${message}`;

  elements.statusBoard.prepend(line);

  while (elements.statusBoard.children.length > 6) {
    elements.statusBoard.removeChild(elements.statusBoard.lastChild);
  }
};

const apiFetch = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }

  return payload;
};

const setNotice = (message, muted = false) => {
  elements.authNotice.textContent = message;
  elements.authNotice.className = muted ? "notice muted" : "notice";
};

const renderStats = (stats = null) => {
  const values = stats || {
    materialCount: 0,
    quizCount: 0,
    totalAttemptCount: 0,
    averageScore: 0,
  };

  elements.statsGrid.innerHTML = `
    <article class="stat-card">
      <span>Materials</span>
      <strong>${values.materialCount}</strong>
    </article>
    <article class="stat-card">
      <span>Quizzes</span>
      <strong>${values.quizCount}</strong>
    </article>
    <article class="stat-card">
      <span>Attempts</span>
      <strong>${values.totalAttemptCount}</strong>
    </article>
    <article class="stat-card">
      <span>Average Score</span>
      <strong>${values.averageScore}%</strong>
    </article>
  `;
};

const renderCharts = () => {
  if (state.attempts.length === 0) {
    elements.progressCharts.innerHTML = '<div class="empty-state">No attempt data yet.</div>';
    return;
  }

  const scores = state.attempts.map((attempt) => Number(attempt.score) || 0);
  const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const latestScores = state.attempts.slice(0, 5).reverse();
  const topicCounts = state.attempts.reduce((acc, attempt) => {
    const topic = attempt.quiz?.topic || "Unknown";
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});
  const topTopics = Object.entries(topicCounts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);
  const maxTopicCount = Math.max(...topTopics.map(([, count]) => count), 1);

  elements.progressCharts.innerHTML = `
    <article class="chart-card">
      <p class="chart-title">Average Score</p>
      <div class="score-ring" style="--score: ${averageScore}">
        <strong>${averageScore}%</strong>
      </div>
    </article>
    <article class="chart-card">
      <p class="chart-title">Last 5 Attempts</p>
      <div class="mini-bars">
        ${latestScores
          .map(
            (attempt) => `
              <div class="mini-bar-row">
                <div class="mini-bar-label">
                  <span>${attempt.quiz?.title || "Quiz"}</span>
                  <span>${attempt.score}%</span>
                </div>
                <div class="mini-bar-track">
                  <div class="mini-bar-fill" style="width: ${attempt.score}%"></div>
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </article>
    <article class="chart-card">
      <p class="chart-title">Most Attempted Topics</p>
      <div class="mini-bars">
        ${topTopics
          .map(
            ([topic, count]) => `
              <div class="mini-bar-row">
                <div class="mini-bar-label">
                  <span>${topic}</span>
                  <span>${count}</span>
                </div>
                <div class="mini-bar-track">
                  <div class="mini-bar-fill" style="width: ${(count / maxTopicCount) * 100}%"></div>
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </article>
  `;
};

const renderMaterials = () => {
  const filteredMaterials = state.materials.filter((material) => {
    const query = state.materialFilter.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return `${material.title} ${material.topic} ${material.summary || ""}`
      .toLowerCase()
      .includes(query);
  });

  if (filteredMaterials.length === 0) {
    elements.materialsList.className = "list-grid empty-state";
    elements.materialsList.textContent = state.materials.length === 0
      ? "No materials yet."
      : "No materials match this filter.";
    elements.materialSelect.innerHTML = '<option value="">Use direct text instead</option>';
    return;
  }

  elements.materialsList.className = "list-grid";
  elements.materialsList.innerHTML = filteredMaterials
    .map(
      (material) => `
        <article class="material-card">
          <div class="panel-header">
            <h3>${material.title}</h3>
            <span class="tag">${material.type}</span>
          </div>
          <p>${material.summary || material.content.slice(0, 150)}${material.content.length > 150 ? "..." : ""}</p>
          <div class="meta-line">
            <span>Topic: ${material.topic}</span>
            <span>Created: ${new Date(material.createdAt).toLocaleString()}</span>
          </div>
          <div class="card-actions">
            <button class="ghost-button tiny-button" type="button" data-fill-material="${material.id}">
              Use For Quiz
            </button>
            <button class="ghost-button tiny-button" type="button" data-edit-material="${material.id}">
              Edit
            </button>
            <button class="tiny-button danger-button" type="button" data-delete-material="${material.id}">
              Delete
            </button>
          </div>
        </article>
      `,
    )
    .join("");

  elements.materialSelect.innerHTML = `
    <option value="">Use direct text instead</option>
    ${state.materials
      .map((material) => `<option value="${material.id}">${material.title} (${material.topic})</option>`)
      .join("")}
  `;
};

const renderQuizzes = () => {
  const filteredQuizzes = state.quizzes.filter((quiz) => {
    const query = state.quizFilter.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return `${quiz.title} ${quiz.topic} ${quiz.sourceType}`.toLowerCase().includes(query);
  });

  if (filteredQuizzes.length === 0) {
    elements.quizzesList.className = "list-grid empty-state";
    elements.quizzesList.textContent = state.quizzes.length === 0
      ? "No quizzes yet."
      : "No quizzes match this filter.";
    return;
  }

  elements.quizzesList.className = "list-grid";
  elements.quizzesList.innerHTML = filteredQuizzes
    .map(
      (quiz) => `
        <article class="quiz-card">
          <div class="panel-header">
            <h3>${quiz.title}</h3>
            <span class="tag">${quiz.questionCount} Questions</span>
          </div>
          <div class="meta-line">
            <span>Topic: ${quiz.topic}</span>
            <span>Source: ${quiz.sourceType}</span>
          </div>
          <div class="card-actions">
            <button class="ghost-button tiny-button" type="button" data-open-quiz="${quiz.id}">
              Open Quiz
            </button>
          </div>
        </article>
      `,
    )
    .join("");
};

const renderAttempts = () => {
  if (state.attempts.length === 0) {
    elements.attemptsList.className = "list-grid empty-state";
    elements.attemptsList.textContent = "No quiz attempts yet.";
    return;
  }

  elements.attemptsList.className = "list-grid";
  elements.attemptsList.innerHTML = state.attempts
    .map(
      (attempt) => `
        <article class="attempt-card ${state.selectedAttemptId === attempt.id ? "selected-card" : ""}">
          <div class="panel-header">
            <h3>${attempt.quiz?.title || "Quiz Attempt"}</h3>
            <span class="tag">${attempt.score}%</span>
          </div>
          <div class="meta-line">
            <span>Topic: ${attempt.quiz?.topic || "Unknown"}</span>
            <span>Correct: ${attempt.correctAnswers}/${attempt.totalQuestions}</span>
          </div>
          <div class="card-actions">
            <button class="ghost-button tiny-button" type="button" data-open-attempt="${attempt.id}">
              View Detail
            </button>
            ${attempt.quiz?.id
              ? `
                <button class="ghost-button tiny-button" type="button" data-open-quiz="${attempt.quiz.id}">
                  Review Quiz
                </button>
              `
              : ""}
          </div>
        </article>
      `,
    )
    .join("");
};

const renderAttemptDetail = () => {
  if (state.attempts.length === 0) {
    elements.attemptDetail.className = "empty-state";
    elements.attemptDetail.textContent = "Select an attempt to inspect its answers.";
    return;
  }

  const selectedAttempt = state.attempts.find((attempt) => attempt.id === state.selectedAttemptId)
    || state.attempts[0];

  if (!selectedAttempt) {
    elements.attemptDetail.className = "empty-state";
    elements.attemptDetail.textContent = "Select an attempt to inspect its answers.";
    return;
  }

  state.selectedAttemptId = selectedAttempt.id;
  const feedback = selectedAttempt.feedback || [];

  elements.attemptDetail.className = "list-grid";
  elements.attemptDetail.innerHTML = `
    <article class="attempt-card">
      <div class="panel-header">
        <h3>${selectedAttempt.quiz?.title || "Quiz Attempt"}</h3>
        <span class="tag">${selectedAttempt.score}%</span>
      </div>
      <div class="meta-line">
        <span>Topic: ${selectedAttempt.quiz?.topic || "Unknown"}</span>
        <span>Correct: ${selectedAttempt.correctAnswers}/${selectedAttempt.totalQuestions}</span>
        <span>Saved: ${new Date(selectedAttempt.createdAt).toLocaleString()}</span>
      </div>
      <div class="feedback-grid">
        ${feedback.length === 0
          ? '<div class="empty-state">This attempt does not have stored feedback.</div>'
          : feedback
              .map(
                (item) => `
                  <div class="material-card">
                    <strong class="${item.isCorrect ? "result-good" : "result-bad"}">
                      ${item.isCorrect ? "Correct" : "Incorrect"}
                    </strong>
                    <p>${item.prompt}</p>
                    <div class="meta-line">
                      <span>Your answer: ${item.submittedAnswer || "No answer"}</span>
                      <span>Correct answer: ${item.correctAnswer}</span>
                    </div>
                    <p>${item.explanation}</p>
                  </div>
                `,
              )
              .join("")}
      </div>
    </article>
  `;
};

const renderQuiz = () => {
  if (!state.currentQuiz) {
    elements.quizContainer.className = "empty-state";
    elements.quizContainer.textContent = "Generate a quiz to see it here.";
    return;
  }

  const quiz = state.currentQuiz;

  elements.quizContainer.className = "list-grid";
  elements.quizContainer.innerHTML = `
    <div class="quiz-header">
      <h3>${quiz.title}</h3>
      <div class="meta-line">
        <span>Topic: ${quiz.topic}</span>
        <span>Questions: ${quiz.questions.length}</span>
      </div>
    </div>
    <form id="quizSubmitForm" class="stack">
      ${quiz.questions
        .map(
          (question, index) => `
            <article class="question-card">
              <h4>${index + 1}. ${question.prompt}</h4>
              <div class="options-grid">
                ${question.options
                  .map(
                    (option) => `
                      <label class="option">
                        <input type="radio" name="question-${question.id}" value="${option}" required />
                        <span>${option}</span>
                      </label>
                    `,
                  )
                  .join("")}
              </div>
            </article>
          `,
        )
        .join("")}
      <button type="submit">Submit Quiz</button>
    </form>
    <div id="quizResult"></div>
  `;

  document.querySelector("#quizSubmitForm")?.addEventListener("submit", handleQuizSubmit);
};

const setAuthenticatedState = () => {
  if (state.user) {
    setNotice(`Signed in as ${state.user.name} (${state.user.email})`, false);
  } else {
    setNotice("Sign in or create an account to begin.", true);
  }
};

const refreshDashboard = async () => {
  if (!state.token) {
    renderStats();
    renderCharts();
    renderMaterials();
    renderQuizzes();
    renderAttempts();
    renderAttemptDetail();
    renderQuiz();
    setAuthenticatedState();
    return;
  }

  const [meResponse, materialsResponse, quizzesResponse, attemptsResponse, dashboardResponse] = await Promise.all([
    apiFetch("/auth/me"),
    apiFetch("/materials"),
    apiFetch("/quizzes"),
    apiFetch("/quizzes/attempts"),
    apiFetch("/dashboard/overview"),
  ]);

  state.user = meResponse.user;
  state.materials = materialsResponse.materials;
  state.quizzes = quizzesResponse.quizzes;
  state.attempts = attemptsResponse.attempts;
  if (!state.attempts.some((attempt) => attempt.id === state.selectedAttemptId)) {
    state.selectedAttemptId = state.attempts[0]?.id || null;
  }
  saveSession();

  setAuthenticatedState();
  renderStats(dashboardResponse.stats);
  renderCharts();
  renderMaterials();
  renderQuizzes();
  renderAttempts();
  renderAttemptDetail();
  renderQuiz();
};

const handleAuthSuccess = async (payload, action) => {
  state.token = payload.token;
  state.user = payload.user;
  saveSession();
  addStatus(`${action} successful for ${payload.user.email}.`);
  await refreshDashboard();
};

const readForm = (form) => Object.fromEntries(new FormData(form).entries());

const handleRegister = async (event) => {
  event.preventDefault();

  try {
    const payload = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(readForm(event.currentTarget)),
    });

    event.currentTarget.reset();
    await handleAuthSuccess(payload, "Registration");
  } catch (error) {
    addStatus(error.message);
  }
};

const handleLogin = async (event) => {
  event.preventDefault();

  try {
    const payload = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(readForm(event.currentTarget)),
    });

    event.currentTarget.reset();
    await handleAuthSuccess(payload, "Login");
  } catch (error) {
    addStatus(error.message);
  }
};

const handleMaterialCreate = async (event) => {
  event.preventDefault();

  if (!state.token) {
    addStatus("Login required before saving materials.");
    return;
  }

  try {
    const formData = readForm(event.currentTarget);
    const isEditing = Boolean(state.editingMaterialId);
    const method = state.editingMaterialId ? "PATCH" : "POST";
    const path = state.editingMaterialId
      ? `/materials/${state.editingMaterialId}`
      : "/materials";

    await apiFetch(path, {
      method,
      body: JSON.stringify(formData),
    });

    resetMaterialForm();
    addStatus(isEditing ? "Material updated." : "Material saved.");
    await refreshDashboard();
  } catch (error) {
    addStatus(error.message);
  }
};

const handleQuizGenerate = async (event) => {
  event.preventDefault();

  if (!state.token) {
    addStatus("Login required before generating quizzes.");
    return;
  }

  try {
    const formData = readForm(event.currentTarget);
    const payload = {
      title: formData.title,
      topic: formData.topic,
      questionCount: Number(formData.questionCount),
    };

    if (formData.materialId) {
      payload.materialId = Number(formData.materialId);
    } else if (formData.sourceText?.trim()) {
      payload.sourceText = formData.sourceText.trim();
    }

    const response = await apiFetch("/quizzes/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    state.currentQuiz = response.quiz;
    renderQuiz();
    addStatus(`Quiz "${response.quiz.title}" generated via ${response.provider || "local-fallback"}.`);
    await refreshDashboard();
  } catch (error) {
    addStatus(error.message);
  }
};

const openQuiz = async (quizId) => {
  const response = await apiFetch(`/quizzes/${quizId}`);
  state.currentQuiz = response.quiz;
  renderQuiz();
  addStatus(`Opened quiz "${response.quiz.title}".`);
};

const handleMaterialAction = async (event) => {
  const deleteButton = event.target.closest("[data-delete-material]");
  const fillButton = event.target.closest("[data-fill-material]");
  const editButton = event.target.closest("[data-edit-material]");

  if (fillButton) {
    const materialId = Number(fillButton.dataset.fillMaterial);
    const material = state.materials.find((item) => item.id === materialId);

    if (material) {
      elements.quizForm.topic.value = material.topic;
      elements.quizForm.title.value = `${material.topic} Quiz`;
      elements.materialSelect.value = String(material.id);
      elements.quizForm.sourceText.value = "";
      addStatus(`Loaded "${material.title}" into the quiz generator.`);
    }
  }

  if (!deleteButton) {
    if (editButton) {
      const materialId = Number(editButton.dataset.editMaterial);
      const material = state.materials.find((item) => item.id === materialId);

      if (material) {
        state.editingMaterialId = material.id;
        elements.materialFormTitle.textContent = "Edit Material";
        elements.materialSubmitButton.textContent = "Update Material";
        elements.cancelEditButton.hidden = false;
        elements.materialForm.title.value = material.title;
        elements.materialForm.topic.value = material.topic;
        elements.materialForm.type.value = material.type;
        elements.materialForm.summary.value = material.summary || "";
        elements.materialForm.content.value = material.content;
        addStatus(`Editing "${material.title}".`);
      }
    }

    return;
  }

  const materialId = Number(deleteButton.dataset.deleteMaterial);
  const material = state.materials.find((item) => item.id === materialId);

  if (!material) {
    return;
  }

  const confirmed = window.confirm(`Delete "${material.title}"?`);

  if (!confirmed) {
    return;
  }

  try {
    await apiFetch(`/materials/${materialId}`, { method: "DELETE" });
    if (state.editingMaterialId === materialId) {
      resetMaterialForm();
    }
    addStatus(`Deleted material "${material.title}".`);
    await refreshDashboard();
  } catch (error) {
    addStatus(error.message);
  }
};

const handleQuizAction = async (event) => {
  const openButton = event.target.closest("[data-open-quiz]");

  if (!openButton) {
    return;
  }

  try {
    await openQuiz(Number(openButton.dataset.openQuiz));
  } catch (error) {
    addStatus(error.message);
  }
};

const handleAttemptAction = async (event) => {
  const openAttemptButton = event.target.closest("[data-open-attempt]");

  if (openAttemptButton) {
    state.selectedAttemptId = Number(openAttemptButton.dataset.openAttempt);
    renderAttempts();
    renderAttemptDetail();
    addStatus("Attempt detail updated.");
    return;
  }

  await handleQuizAction(event);
};

const handleQuizSubmit = async (event) => {
  event.preventDefault();

  if (!state.currentQuiz) {
    return;
  }

  try {
    const formData = new FormData(event.currentTarget);
    const answers = {};

    for (const question of state.currentQuiz.questions) {
      answers[String(question.id)] = formData.get(`question-${question.id}`);
    }

    const response = await apiFetch(`/quizzes/${state.currentQuiz.id}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });

    const resultContainer = document.querySelector("#quizResult");

    resultContainer.innerHTML = `
      <article class="attempt-card">
        <h3 class="${response.attempt.score >= 50 ? "result-good" : "result-bad"}">
          Score: ${response.attempt.score}%
        </h3>
        <p>Correct answers: ${response.attempt.correctAnswers}/${response.attempt.totalQuestions}</p>
        <div class="feedback-grid">
          ${response.attempt.feedback
            .map(
              (item) => `
                <div class="material-card">
                  <strong>${item.isCorrect ? "Correct" : "Incorrect"}</strong>
                  <p>${item.prompt}</p>
                  <div class="meta-line">
                    <span>Your answer: ${item.submittedAnswer || "No answer"}</span>
                    <span>Correct answer: ${item.correctAnswer}</span>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
      </article>
    `;

    addStatus(`Quiz submitted. Score: ${response.attempt.score}%.`);
    await refreshDashboard();
  } catch (error) {
    addStatus(error.message);
  }
};

const handleLogout = () => {
  clearSession();
  resetMaterialForm();
  renderStats();
  renderCharts();
  renderMaterials();
  renderQuizzes();
  renderAttempts();
  renderAttemptDetail();
  renderQuiz();
  setAuthenticatedState();
  addStatus("Session cleared.");
};

elements.registerForm.addEventListener("submit", handleRegister);
elements.loginForm.addEventListener("submit", handleLogin);
elements.materialForm.addEventListener("submit", handleMaterialCreate);
elements.quizForm.addEventListener("submit", handleQuizGenerate);
elements.materialsList.addEventListener("click", handleMaterialAction);
elements.quizzesList.addEventListener("click", handleQuizAction);
elements.attemptsList.addEventListener("click", handleAttemptAction);
elements.cancelEditButton.addEventListener("click", () => {
  resetMaterialForm();
  addStatus("Material edit cancelled.");
});
elements.materialSearchInput.addEventListener("input", (event) => {
  state.materialFilter = event.target.value;
  renderMaterials();
});
elements.quizSearchInput.addEventListener("input", (event) => {
  state.quizFilter = event.target.value;
  renderQuizzes();
});
elements.logoutButton.addEventListener("click", handleLogout);
elements.refreshDashboardButton.addEventListener("click", async () => {
  try {
    await refreshDashboard();
    addStatus("Dashboard refreshed.");
  } catch (error) {
    addStatus(error.message);
  }
});

loadSession();
resetMaterialForm();
setAuthenticatedState();
renderStats();
renderCharts();
renderMaterials();
renderQuizzes();
renderAttempts();
renderAttemptDetail();
renderQuiz();

if (state.token) {
  refreshDashboard()
    .then(() => addStatus("Session restored."))
    .catch((error) => {
      clearSession();
      setAuthenticatedState();
      addStatus(error.message);
    });
}
