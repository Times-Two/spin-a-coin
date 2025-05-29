 // Game state
    let gameState = {
      coins: parseInt(localStorage.getItem('coins')) || 0,
      ghsBalance: parseFloat(localStorage.getItem('ghsBalance')) || 0,
      dailySpins: parseInt(localStorage.getItem('dailySpins')) || 5,
      lastResetDate: localStorage.getItem('lastResetDate') || new Date().toDateString(),
      selectedBet: null,
      isSpinning: false
    };

    // Wheel configuration
    const wheel = document.getElementById('wheel');
    const ctx = wheel.getContext('2d');
    const segments = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffa726', '#ab47bc', '#ef5350', '#26a69a'];
    
    // Create 100 segments (1-100)
    for (let i = 1; i <= 100; i++) {
      segments.push({
        number: i,
        color: colors[i % colors.length]
      });
    }

    let currentRotation = 0;

    function checkDailyReset() {
      const today = new Date().toDateString();
      if (gameState.lastResetDate !== today) {
        gameState.dailySpins = 5;
        gameState.lastResetDate = today;
        saveGameState();
      }
    }

    function saveGameState() {
      localStorage.setItem('coins', gameState.coins);
      localStorage.setItem('ghsBalance', gameState.ghsBalance.toFixed(2));
      localStorage.setItem('dailySpins', gameState.dailySpins);
      localStorage.setItem('lastResetDate', gameState.lastResetDate);
    }

    function updateDisplay() {
      document.getElementById('coinCount').textContent = gameState.coins;
      document.getElementById('ghsBalance').textContent = gameState.ghsBalance.toFixed(2);
      document.getElementById('spinCountDisplay').textContent = `${gameState.dailySpins}/5`;
      
      // Update button states
      document.getElementById('spinBtn').disabled = gameState.dailySpins <= 0 || gameState.isSpinning;
      document.getElementById('redeemBtn').disabled = gameState.coins < 1000;
      document.getElementById('watchAdBtn').disabled = gameState.dailySpins >= 5;
    }

    function drawWheel() {
      const centerX = wheel.width / 2;
      const centerY = wheel.height / 2;
      const radius = 150;
      const anglePerSegment = (2 * Math.PI) / segments.length;

      ctx.clearRect(0, 0, wheel.width, wheel.height);

      segments.forEach((segment, index) => {
        const startAngle = index * anglePerSegment;
        const endAngle = startAngle + anglePerSegment;

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw number (only for visible segments)
        if (index % 5 === 0) {
          const textAngle = startAngle + anglePerSegment / 2;
          const textX = centerX + Math.cos(textAngle) * (radius * 0.7);
          const textY = centerY + Math.sin(textAngle) * (radius * 0.7);
          
          ctx.save();
          ctx.translate(textX, textY);
          ctx.rotate(textAngle + Math.PI / 2);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(segment.number.toString(), 0, 0);
          ctx.restore();
        }
      });

      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
      ctx.fillStyle = '#333';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    function selectBet(type) {
      gameState.selectedBet = type;
      document.querySelectorAll('.bet-option').forEach(btn => btn.classList.remove('selected'));
      document.getElementById(type + 'Bet').classList.add('selected');
    }

    function spin() {
      if (gameState.dailySpins <= 0 || gameState.isSpinning) return;

      const betAmount = parseInt(document.getElementById('betAmount').value) || 0;
      
      // Check if user wants to bet (optional)
      if (betAmount > 0) {
        if (betAmount > gameState.coins) {
          showMessage('spinResult', 'Not enough coins to place this bet!', 'error');
          return;
        }
        
        if (!gameState.selectedBet) {
          showMessage('spinResult', 'Please select HIGH or LOW bet first!', 'error');
          return;
        }
        
        gameState.coins -= betAmount;
      }

      gameState.isSpinning = true;
      gameState.dailySpins--;
      
      const spinResult = Math.floor(Math.random() * 100) + 1;
      const rotations = 5 + Math.random() * 5;
      const finalAngle = (spinResult - 1) * (360 / 100);
      const totalRotation = rotations * 360 + finalAngle;
      
      currentRotation += totalRotation;
      wheel.style.transform = `rotate(${currentRotation}deg)`;

      setTimeout(() => {
        gameState.isSpinning = false;
        
        // Always give base reward for daily spins
        const baseReward = Math.floor(Math.random() * 20) + 5; // 5-25 coins
        let totalWin = baseReward;
        let message = `🎉 Landed on ${spinResult}! Base reward: +${baseReward} coins`;
        
        // Check betting if user placed a bet
        if (betAmount > 0 && gameState.selectedBet) {
          const isHigh = spinResult > 50;
          const userBetHigh = gameState.selectedBet === 'high';
          const won = (isHigh && userBetHigh) || (!isHigh && !userBetHigh);
          
          if (won) {
            const winAmount = Math.floor(betAmount * 1.8); // 80% profit
            totalWin += winAmount;
            message = `🎉 Bet WON! Landed on ${spinResult}. Base: +${baseReward}, Bet win: +${winAmount} coins!`;
          } else {
            message = `😔 Bet lost! Landed on ${spinResult}. Base reward: +${baseReward} coins`;
          }
        }
        
        gameState.coins += totalWin;
        showMessage('spinResult', message, totalWin > baseReward ? 'success' : 'info');
        
        saveGameState();
        updateDisplay();
      }, 3000);

      updateDisplay();
    }

    function watchAd() {
      // Simulate ad watching
      showMessage('adMessage', 'Loading ad...', 'info');
      
      setTimeout(() => {
        gameState.dailySpins += 2;
        if (gameState.dailySpins > 5) gameState.dailySpins = 5;
        
        showMessage('adMessage', '🎉 Ad watched! +2 spins added!', 'success');
        saveGameState();
        updateDisplay();
        
        setTimeout(() => {
          document.getElementById('adMessage').textContent = '';
          document.getElementById('adMessage').className = 'message';
        }, 3000);
      }, 2000);
    }

    function buySpins() {
      if (gameState.ghsBalance < 2) {
        showMessage('purchaseMessage', 'Insufficient GHS balance!', 'error');
        return;
      }
      
      gameState.ghsBalance -= 2;
      gameState.dailySpins += 5;
      if (gameState.dailySpins > 5) gameState.dailySpins = 5;
      
      showMessage('purchaseMessage', '🎉 5 spins purchased! -2 GHS', 'success');
      saveGameState();
      updateDisplay();
      
      setTimeout(() => {
        document.getElementById('purchaseMessage').textContent = '';
        document.getElementById('purchaseMessage').className = 'message';
      }, 3000);
    }

    function redeemCoins() {
      if (gameState.coins < 1000) {
        showMessage('walletMessage', 'Need 1000 coins to redeem!', 'error');
        return;
      }
      
      gameState.coins -= 1000;
      gameState.ghsBalance += 40;
      
      showMessage('walletMessage', '🎉 Redeemed 1000 coins for 40 GHS!', 'success');
      saveGameState();
      updateDisplay();
      
      setTimeout(() => {
        document.getElementById('walletMessage').textContent = '';
        document.getElementById('walletMessage').className = 'message';
      }, 3000);
    }

    function depositGHS() {
      const amount = parseFloat(document.getElementById('depositAmount').value);
      
      if (!amount || amount <= 0) {
        showMessage('walletMessage', 'Please enter a valid amount!', 'error');
        return;
      }
      
      // Simulate payment processing
      showMessage('walletMessage', 'Processing payment...', 'info');
      
      setTimeout(() => {
        gameState.ghsBalance += amount;
        document.getElementById('depositAmount').value = '';
        
        showMessage('walletMessage', `🎉 Successfully deposited ${amount.toFixed(2)} GHS!`, 'success');
        saveGameState();
        updateDisplay();
        
        setTimeout(() => {
          document.getElementById('walletMessage').textContent = '';
          document.getElementById('walletMessage').className = 'message';
        }, 3000);
      }, 2000);
    }

    function showMessage(elementId, message, type) {
      const element = document.getElementById(elementId);
      element.textContent = message;
      element.className = `message ${type}`;
    }

    // Initialize game
    function init() {
      checkDailyReset();
      drawWheel();
      updateDisplay();
      
      // Auto-select high bet by default
      selectBet('high');
    }

    // Start the game
    init();