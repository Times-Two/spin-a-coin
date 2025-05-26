const canvas = document.getElementById("scratchCanvas");
const ctx = canvas.getContext("2d");
const rewardText = document.getElementById("reward");
const statusText = document.getElementById("status");
const backBtn = document.getElementById("backBtn");

let isDrawing = false;
let scratched = 0;
const SCRATCH_THRESHOLD = 0.5; // 50% must be scratched
const scratchKey = `scratch_${new Date().toDateString()}`;

// Check if already scratched today
if (localStorage.getItem(scratchKey)) {
  rewardText.style.zIndex = 2;
  canvas.style.display = "none";
  statusText.textContent = "You've already scratched today!";
} else {
  initScratchCard();
}

function initScratchCard() {
  // Cover canvas with gray layer
  ctx.fillStyle = "#888";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "destination-out"; // scratch effect

  canvas.addEventListener("mousedown", startScratch);
  canvas.addEventListener("mousemove", scratch);
  canvas.addEventListener("mouseup", endScratch);
  canvas.addEventListener("touchstart", startScratch);
  canvas.addEventListener("touchmove", scratch);
  canvas.addEventListener("touchend", endScratch);
}

function startScratch(e) {
  isDrawing = true;
  scratch(e);
}

function scratch(e) {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, 2 * Math.PI);
  ctx.fill();

  // Check how much scratched
  checkScratchPercentage();
}

function endScratch() {
  isDrawing = false;
}

function checkScratchPercentage() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let clearedPixels = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] === 0) clearedPixels++;
  }
  const clearedRatio = clearedPixels / (canvas.width * canvas.height);
  if (clearedRatio > SCRATCH_THRESHOLD) {
    revealReward();
  }
}

function revealReward() {
  canvas.style.display = "none";
  rewardText.style.zIndex = 2;
  statusText.textContent = "🎊 You got +5 Bonus Points!";
  localStorage.setItem(scratchKey, "done");

  // Optional: Add reward to user data (if tied to quiz)
  const username = getCurrentUsername();
  if (username) {
    const key = `quizData_${username}`;
    const userData = JSON.parse(localStorage.getItem(key) || "{}");
    userData.score = (userData.score || 0) + 5;
    localStorage.setItem(key, JSON.stringify(userData));
  }
}

function getCurrentUsername() {
  // Optionally store active user in localStorage during quiz login
  return localStorage.getItem("activeQuizUser");
}

backBtn.addEventListener("click", () => {
  window.location.href = "home.html"; // or your quiz page
});
