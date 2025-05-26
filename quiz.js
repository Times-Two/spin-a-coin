// Quiz Game with 20 questions per day limit per user
// User identified by localStorage key "currentUser"

const loginArea = document.getElementById("login-area");
const quizArea = document.getElementById("quiz-area");
const userInput = document.getElementById("user-input");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");

const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const nextBtn = document.getElementById("next-btn");
const resultMessage = document.getElementById("result-message");
const scoreDisplay = document.getElementById("score-display");
const restartBtn = document.getElementById("restart-btn");
const timerDisplay = document.getElementById("time-remaining");

const QUESTION_TIME = 15; // seconds per question
const MAX_QUESTIONS_PER_DAY = 20;

let currentUser = null;
let questions = [];
let questionIndex = 0;
let score = 0;
let timer;
let timeLeft;

const allQuestions = [
  // Math
  { q: "What is 12 × 8?", options: ["96", "86", "108", "112"], answer: "96" },
  { q: "Solve: 15 + 27 - 9", options: ["33", "43", "23", "37"], answer: "33" },
  { q: "What is the square root of 144?", options: ["11", "12", "13", "14"], answer: "12" },
  // Science
  { q: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: "Mars" },
  { q: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], answer: "Carbon Dioxide" },
  { q: "What is the chemical symbol for Gold?", options: ["Gd", "Ag", "Au", "Go"], answer: "Au" },
  // Logic
  { q: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?", options: ["Yes", "No", "Maybe", "Cannot tell"], answer: "Yes" },
  { q: "What comes next in the sequence: 2, 6, 12, 20, ?", options: ["30", "28", "26", "24"], answer: "30" },
  { q: "If you rearrange the letters 'CIFAIPC' you get the name of a:", options: ["City", "Ocean", "Animal", "River"], answer: "Pacific" },
  // General Knowledge
  { q: "Which country has the largest population?", options: ["India", "USA", "China", "Russia"], answer: "China" },
  { q: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], answer: "William Shakespeare" },
  { q: "What is the capital city of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], answer: "Canberra" },
  { q: "Which ocean is the deepest?", options: ["Atlantic", "Pacific", "Indian", "Arctic"], answer: "Pacific" },
  { q: "What year did the first man land on the moon?", options: ["1965", "1969", "1972", "1959"], answer: "1969" },
  { q: "Who discovered penicillin?", options: ["Marie Curie", "Alexander Fleming", "Louis Pasteur", "Isaac Newton"], answer: "Alexander Fleming" },
  { q: "How many bones are there in the adult human body?", options: ["206", "208", "201", "210"], answer: "206" },
  { q: "Which element has the atomic number 1?", options: ["Oxygen", "Hydrogen", "Carbon", "Nitrogen"], answer: "Hydrogen" },
  { q: "What is the fastest land animal?", options: ["Cheetah", "Lion", "Tiger", "Leopard"], answer: "Cheetah" },
  { q: "What does DNA stand for?", options: ["Deoxyribonucleic Acid", "Dinucleic Acid", "Deoxynucleic Acid", "Deoxyribo Acid"], answer: "Deoxyribonucleic Acid" }
];

// Get today's date as YYYY-MM-DD string
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

// Retrieve saved data for current user from localStorage
function getUserData() {
  if (!currentUser) return null;
  const dataRaw = localStorage.getItem(`quizData_${currentUser}`);
  if (!dataRaw) return null;
  return JSON.parse(dataRaw);
}

// Save user data to localStorage
function saveUserData(data) {
  if (!currentUser) return;
  localStorage.setItem(`quizData_${currentUser}`, JSON.stringify(data));
}

// Check if user reached daily question limit
function canUserAnswer() {
  const data = getUserData();
  const today = getTodayDate();
  if (!data || data.date !== today) return true;
  return data.questionsAnswered < MAX_QUESTIONS_PER_DAY;
}

// Initialize user data for the day or reset if a new day
function initUserData() {
  const today = getTodayDate();
  let data = getUserData();
  if (!data || data.date !== today) {
    data = {
      date: today,
      questionsAnswered: 0,
      highScore: 0,
      score: 0,
      askedQuestions: []
    };
    saveUserData(data);
  }
  return data;
}

// Select 20 random questions from allQuestions unique per user per day
function selectQuestions() {
  let data = initUserData();

  // Filter out already asked questions this day
  const askedSet = new Set(data.askedQuestions);

  // Filter questions not asked yet
  let availableQuestions = allQuestions.filter((q, i) => !askedSet.has(i));

  // If less than needed available, reset
  if (availableQuestions.length < MAX_QUESTIONS_PER_DAY) {
    availableQuestions = allQuestions.slice();
    data.askedQuestions = [];
    saveUserData(data);
  }

  // Shuffle questions
  for (let i = availableQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
  }

  // Pick the first 20 or max possible
  const selected = availableQuestions.slice(0, MAX_QUESTIONS_PER_DAY);

  return selected;
}

// Load next question
function loadQuestion() {
  clearInterval(timer);
  timeLeft = QUESTION_TIME;
  timerDisplay.textContent = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      showResult(false, "Time's up! The correct answer was: " + questions[questionIndex].answer);
      disableOptions();
      nextBtn.disabled = false;
    }
  }, 1000);

  resultMessage.textContent = "";
  nextBtn.disabled = true;

  const q = questions[questionIndex];
  questionText.textContent = `Q${questionIndex + 1}. ${q.q}`;
  optionsContainer.innerHTML = "";

  q.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.onclick = () => selectAnswer(btn, option, q.answer);
    optionsContainer.appendChild(btn);
  });
}

// Handle answer selection
function selectAnswer(button, selected, correct) {
  clearInterval(timer);
  disableOptions();

  if (selected === correct) {
    button.classList.add("correct");
    showResult(true, "Correct! 🎉");
    score++;
  } else {
    button.classList.add("wrong");
    showResult(false, `Wrong! The correct answer is: ${correct}`);
  }

  updateScore();

  nextBtn.disabled = false;

  // Save question as asked
  let data = getUserData();
  data.questionsAnswered++;
  data.score = score;
  data.askedQuestions.push(allQuestions.findIndex(q => q.q === questions[questionIndex].q));
  if (score > data.highScore) {
    data.highScore = score;
  }
  saveUserData(data);
}

// Disable all option buttons
function disableOptions() {
  const buttons = optionsContainer.querySelectorAll("button");
  buttons.forEach(btn => btn.disabled = true);
}

// Show result message
function showResult(isCorrect, message) {
  resultMessage.textContent = message;
  resultMessage.style.color = isCorrect ? "green" : "red";
}

// Update score display
function updateScore() {
  scoreDisplay.textContent = `Score: ${score}`;
}

// Show quiz completion message
function showCompletion() {
  clearInterval(timer);
  questionText.textContent = "Quiz completed!";
  optionsContainer.innerHTML = "";
  resultMessage.textContent = `Your score: ${score} / ${MAX_QUESTIONS_PER_DAY}`;
  resultMessage.style.color = "blue";
  nextBtn.style.display = "none";
  restartBtn.style.display = "inline-block";
  timerDisplay.textContent = "";
}

// Restart quiz
function restartQuiz() {
  let data = getUserData();
  data.questionsAnswered = 0;
  data.score = 0;
  data.askedQuestions = [];
  saveUserData(data);
  score = 0;
  questionIndex = 0;
  nextBtn.style.display = "inline-block";
  restartBtn.style.display = "none";
  updateScore();
  questions = selectQuestions();
  loadQuestion();
}

// Login user
function loginUser() {
  const user = userInput.value.trim();
  if (!user) {
    alert("Please enter username or email");
    return;
  }
  currentUser = user;
  localStorage.setItem("currentUser", currentUser);
  loginArea.style.display = "none";
  quizArea.style.display = "block";
  logoutBtn.style.display = "inline-block";
  userInfo.textContent = `Logged in as: ${currentUser}`;

  // Initialize quiz for user
  const data = initUserData();

  if (!canUserAnswer()) {
    alert("You have reached your daily limit of 20 questions. Please come back tomorrow!");
    disableQuiz();
    return;
  }

  score = data.score;
  updateScore();
  questions = selectQuestions();
  questionIndex = 0;
  loadQuestion();
}

// Disable quiz when user reaches limit
function disableQuiz() {
  questionText.textContent = "Daily question limit reached.";
  optionsContainer.innerHTML = "";
  nextBtn.style.display = "none";
  restartBtn.style.display = "inline-block";
  timerDisplay.textContent = "";
  resultMessage.textContent = "";
}

// Logout
logoutBtn.addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("currentUser");
  loginArea.style.display = "block";
  quizArea.style.display = "none";
  logoutBtn.style.display = "none";
  userInfo.textContent = "";
  userInput.value = "";
});

// Event listeners
loginBtn.addEventListener("click", loginUser);

nextBtn.addEventListener("click", () => {
  questionIndex++;
  if (questionIndex >= MAX_QUESTIONS_PER_DAY) {
    showCompletion();
  } else if (!canUserAnswer()) {
    showCompletion();
  } else {
    loadQuestion();
  }
});

restartBtn.addEventListener("click", () => {
  restartQuiz();
});

// On page load, check if user is already logged in
window.onload = () => {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = savedUser;
    loginArea.style.display = "none";
    quizArea.style.display = "block";
    logoutBtn.style.display = "inline-block";
    userInfo.textContent = `Logged in as: ${currentUser}`;

    if (!canUserAnswer()) {
      alert("You have reached your daily limit of 20 questions. Please come back tomorrow!");
      disableQuiz();
      return;
    }

    const data = initUserData();
    score = data.score;
    updateScore();
    questions = selectQuestions();
    questionIndex = 0;
    loadQuestion();
  }
};
