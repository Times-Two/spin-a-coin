const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const slices = 8;
const rewards = [0, 1, 2, 5, 0, 3, 4, 20];
const colors = ["#f44336", "#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#00bcd4", "#8bc34a", "#3f51b5"];
let spinning = false;
let currentAngle = 0;

let coins = parseInt(localStorage.getItem("coins") || "0");
document.getElementById("coinCount").innerText = coins;

let bonusSpins = parseInt(localStorage.getItem("bonusSpins") || "0");

const DEBUG_MODE = false;

function getToday() {
  return new Date().toLocaleDateString();
}

function loadSpinData() {
  const savedDate = localStorage.getItem("spinDate");
  const savedSpins = localStorage.getItem("spinCount");

  if (savedDate === getToday()) {
    return parseInt(savedSpins || "0");
  } else {
    localStorage.setItem("spinDate", getToday());
    localStorage.setItem("spinCount", "0");
    return 0;
  }
}

function updateSpinCount(count) {
  localStorage.setItem("spinCount", count);
}

let spinCount = loadSpinData();

function updateSpinDisplay() {
  const remaining = Math.max(3 - spinCount, 0) + bonusSpins;
  document.getElementById("spinCountDisplay").innerText = "Spins left: " + remaining;
}

updateSpinDisplay();

function drawWheel() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2 - 5;
  const sliceAngle = (2 * Math.PI) / slices;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < slices; i++) {
    const startAngle = i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.fillStyle = colors[i];
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";

    const text = rewards[i] === 0 ? "Try Again" : rewards[i] + " coins";
    ctx.fillText(text, radius - 25, 5);
    ctx.restore();
  }
}

drawWheel();

const spinBtn = document.getElementById('spinBtn');

function debugLog(message) {
  if (DEBUG_MODE) {
    console.log(message);
    const debugInfo = document.getElementById('debugInfo');
    debugInfo.style.display = 'block';
    debugInfo.innerHTML += message + '<br>';
  }
}

function spin() {
  const userEmail = localStorage.getItem("userEmail");
  if (!userEmail) {
    alert("Please sign in or sign up before spinning the wheel.");
    window.location.href = "privacy.html";
    return;
  }

  if (spinning) return;
  if (spinCount >= 3 && bonusSpins <= 0) {
    alert("❌ You've used all your spins for today. Watch an ad or buy spins.");
    return;
  }

  spinning = true;
  spinBtn.disabled = true;

  if (DEBUG_MODE) {
    document.getElementById('debugInfo').innerHTML = '';
  }

  const minSpins = 5;
  const maxSpins = 8;
  const fullRotations = (Math.random() * (maxSpins - minSpins) + minSpins) * 360;
  const extraDegrees = Math.random() * 360;
  const totalSpin = fullRotations + extraDegrees;

  const finalAngle = currentAngle + totalSpin;
  const start = Date.now();
  const spinTime = 4000;

  function animate() {
    const now = Date.now();
    const elapsed = now - start;
    const progress = Math.min(elapsed / spinTime, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentRotation = currentAngle + (totalSpin * eased);
    canvas.style.transform = `rotate(${currentRotation}deg)`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      currentAngle = finalAngle;
      const normalizedAngle = (360 - (finalAngle % 360)) % 360;
      const sliceAngle = 360 / slices;
      const adjustedAngle = (normalizedAngle + sliceAngle / 2) % 360;
      const sliceIndex = Math.floor(adjustedAngle / sliceAngle);

      const reward = rewards[sliceIndex];
      coins += reward;
      localStorage.setItem("coins", coins);
      document.getElementById("coinCount").innerText = coins;

      if (reward > 0) {
        alert("🎉 You won " + reward + " coins!");
      } else {
        alert("😔 Try again! Better luck next time.");
      }

      if (spinCount < 3) {
        spinCount++;
        updateSpinCount(spinCount);
      } else if (bonusSpins > 0) {
        bonusSpins--;
        localStorage.setItem("bonusSpins", bonusSpins);
      }

      updateSpinDisplay();
      spinning = false;
      spinBtn.disabled = false;
    }
  }

  animate();
}

/* --- PAYSTACK PAYMENT --- */

function buyCoins() {
  if (spinning) return;
  const purchaseMessage = document.getElementById("purchaseMessage");
  purchaseMessage.textContent = "";

  // Get user email dynamically (prompt for demo)
  let email = prompt("Please enter your email for payment receipt:");
  if (!email || !email.includes("@")) {
    purchaseMessage.textContent = "❌ Valid email is required to proceed.";
    purchaseMessage.className = "message error";
    return;
  }

  var handler = PaystackPop.setup({
    key: 'YOUR_PAYSTACK_PUBLIC_KEY', // Replace with your Paystack public key
    email: email,
    amount: 9900, // 0.99 GHS in kobo/pesewas (smallest currency unit)
    currency: 'GHS',
    callback: function(response) {
      // Successful payment callback
      coins += 50;
      bonusSpins += 3;
      localStorage.setItem("coins", coins);
      localStorage.setItem("bonusSpins", bonusSpins);
      document.getElementById("coinCount").innerText = coins;
      updateSpinDisplay();

      purchaseMessage.textContent = "✅ Payment successful! You received 50 coins and 3 spins.";
      purchaseMessage.className = "message success";
      setTimeout(() => { purchaseMessage.textContent = ""; }, 6000);
    },
    onClose: function() {
      purchaseMessage.textContent = "❌ Payment was cancelled.";
      purchaseMessage.className = "message error";
      setTimeout(() => { purchaseMessage.textContent = ""; }, 4000);
    }
  });
  handler.openIframe();
}

/* --- GOOGLE ADSENSE REWARDED ADS --- */

// Replace this with your actual AdSense rewarded ad client and slot IDs:
const adsenseRewardedAdClient = "pub-8630603554537037"; // Your AdSense publisher ID
const adsenseRewardedAdSlot = "1234567890"; // Your Rewarded Ad Unit ID

// Enable button only after Ads script loads
window.onload = function() {
  if (typeof window.adsbygoogle !== "undefined") {
    document.getElementById("watchAdBtn").disabled = false;
  }
};

// Rewarded ad instance holder
let rewardedAd;

// Load the rewarded ad
function loadRewardedAd() {
  rewardedAd = new window.adsbygoogle.RewardedAd({
    adClient: adsenseRewardedAdClient,
    adSlot: adsenseRewardedAdSlot,
  });

  rewardedAd.load().then(() => {
    console.log("Rewarded ad loaded");
  }).catch((err) => {
    console.error("Rewarded ad failed to load:", err);
    document.getElementById("adMessage").textContent = "⚠️ Ads not available now.";
  });
}

loadRewardedAd();

function watchAd() {
  if (!rewardedAd) {
    document.getElementById("adMessage").textContent = "⚠️ Ad not loaded yet. Try again shortly.";
    return;
  }
  const adMessage = document.getElementById("adMessage");
  adMessage.textContent = "Playing ad...";

  rewardedAd.show().then(() => {
    // User watched ad fully, reward them
    coins += 5;
    bonusSpins++;
    localStorage.setItem("coins", coins);
    localStorage.setItem("bonusSpins", bonusSpins);
    document.getElementById("coinCount").innerText = coins;
    updateSpinDisplay();
    adMessage.textContent = "✅ Thanks for watching! You earned 5 coins and 1 spin.";

    // Reload ad for next watch
    loadRewardedAd();

    setTimeout(() => {
      adMessage.textContent = "";
    }, 6000);
  }).catch((err) => {
    console.error("Ad failed or skipped:", err);
    adMessage.textContent = "❌ Ad not completed. No reward given.";
    setTimeout(() => { adMessage.textContent = ""; }, 4000);
  });
}

/* --- REDEEM --- */

function redeem() {
  const phoneInput = document.getElementById("phoneInput");
  const phone = phoneInput.value.trim();
  const redeemMessage = document.getElementById("redeemMessage");
  const phonePattern = /^[0-9]{8,15}$/;

  if (!phone) {
    redeemMessage.textContent = "❌ Please enter your phone number.";
    redeemMessage.className = "message error";
    return;
  }
  if (!phonePattern.test(phone)) {
    redeemMessage.textContent = "❌ Invalid phone number format.";
    redeemMessage.className = "message error";
    return;
  }
  if (coins < 100) {
    redeemMessage.textContent = "❌ Not enough coins to redeem.";
    redeemMessage.className = "message error";
    return;
  }

  coins -= 100;
  localStorage.setItem("coins", coins);
  document.getElementById("coinCount").innerText = coins;
  redeemMessage.textContent = `✅ Redemption successful! We will contact you on ${phone}.`;
  redeemMessage.className = "message success";
  phoneInput.value = "";
}