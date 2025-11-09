console.log("JS running...");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Fit canvas to window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ------------------- IMAGES -------------------
const background = new Image();
background.src = "images/background.jpg";
background.onload = () => console.log("Background loaded");

const spaceship = new Image();
spaceship.src = "images/character.png";

const obstacleImg = new Image();
obstacleImg.src = "images/object.png";

const keyImg = new Image();
keyImg.src = "images/key.png";

const coinFrames = ["images/coin1.png"].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

// ------------------- SOUNDS -------------------
const coinSound = new Audio("sounds/coin.ogg");
const bumpSound = new Audio("sounds/bump.ogg");
const keySound = new Audio("sounds/key.ogg");
const winSound = new Audio("sounds/win.ogg");

// 🎵 Background Music
const Music = new Audio("music/music.ogg");
Music.loop = true;
Music.volume = 0.6;

// ------------------- GAME VARIABLES -------------------
let coins = [];
let obstacles = [];
let keys = [];
let coinCollectedCount = 0;
let maxCoins = 30;

let coinSpawnCounter = 0;
let obstacleSpawnCounter = 0;
let keySpawnCounter = 0;
let keySpawnInterval = 300;

let keySpawned = false;
let keyCollected = false;
let portal = null;

let ship = {
  x: 100,
  y: canvas.height / 2 - 50,
  width: 100,
  height: 100,
  speed: 20
};

let bgX = 0;
const bgSpeed = 2;
const coinSpeed = 4;
const obstacleSpeed = 4;
const keySpeed = 4;

let gamePaused = false;
let gameStarted = false;
let gameOverFlag = false;
let animationId;

// ------------------- UI ELEMENTS -------------------
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");

const resumeBtn = document.createElement("button");
resumeBtn.textContent = "Resume";
resumeBtn.style.position = "absolute";
resumeBtn.style.top = "50%";
resumeBtn.style.left = "50%";
resumeBtn.style.transform = "translate(-50%, -50%)";
resumeBtn.style.padding = "15px 40px";
resumeBtn.style.fontSize = "24px";
resumeBtn.style.background = "limegreen";
resumeBtn.style.border = "none";
resumeBtn.style.borderRadius = "10px";
resumeBtn.style.cursor = "pointer";
resumeBtn.style.display = "none";
document.body.appendChild(resumeBtn);

const restartBtn = document.createElement("button");
restartBtn.textContent = "Restart";
restartBtn.style.position = "absolute";
restartBtn.style.top = "60%";
restartBtn.style.left = "50%";
restartBtn.style.transform = "translate(-50%, -50%)";
restartBtn.style.padding = "15px 40px";
restartBtn.style.fontSize = "24px";
restartBtn.style.background = "red";
restartBtn.style.border = "none";
restartBtn.style.borderRadius = "10px";
restartBtn.style.cursor = "pointer";
restartBtn.style.display = "none";
document.body.appendChild(restartBtn);

const quitBtn = document.createElement("button");
quitBtn.textContent = "Quit";
quitBtn.style.position = "absolute";
quitBtn.style.top = "70%";
quitBtn.style.left = "50%";
quitBtn.style.transform = "translate(-50%, -50%)";
quitBtn.style.padding = "15px 40px";
quitBtn.style.fontSize = "24px";
quitBtn.style.background = "gray";
quitBtn.style.border = "none";
quitBtn.style.borderRadius = "10px";
quitBtn.style.cursor = "pointer";
quitBtn.style.display = "none";
document.body.appendChild(quitBtn);

const exitBtn = document.createElement("button");
exitBtn.textContent = "Exit";
exitBtn.style.position = "absolute";
exitBtn.style.top = "70%";
exitBtn.style.left = "50%";
exitBtn.style.transform = "translate(-50%, -50%)";
exitBtn.style.padding = "15px 40px";
exitBtn.style.fontSize = "24px";
exitBtn.style.background = "gray";
exitBtn.style.border = "none";
exitBtn.style.borderRadius = "10px";
exitBtn.style.cursor = "pointer";
exitBtn.style.display = "none";
document.body.appendChild(exitBtn);

// ------------------- START BUTTON -------------------
startBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  canvas.style.display = "block";
  document.body.style.background = "black";
  gameStarted = true;

  Music.currentTime = 0;
  Music.play().catch(err => console.log("Music play blocked:", err));

  preloadAssets(startGame);
});

// ------------------- RESUME BUTTON -------------------
resumeBtn.addEventListener("click", () => {
  resumeGame();
});

// ------------------- RESTART BUTTON -------------------
restartBtn.addEventListener("click", () => {
  restartBtn.style.display = "none";
  startGame();
});

// ------------------- QUIT BUTTON -------------------
quitBtn.addEventListener("click", () => {
  cancelAnimationFrame(animationId);
  resumeBtn.style.display = "none";
  restartBtn.style.display = "none";
  quitBtn.style.display = "none";
  canvas.style.display = "none";
  startScreen.style.display = "flex";
  document.body.style.background = "black";
  gameStarted = false;
  // keep music playing
  Music.currentTime = 0;
  Music.play().catch(err => console.log("Music play blocked:", err));
});

// ------------------- EXIT BUTTON -------------------
exitBtn.addEventListener("click", () => {
  cancelAnimationFrame(animationId);
  exitBtn.style.display = "none";
  restartBtn.style.display = "none";
  canvas.style.display = "none";
  startScreen.style.display = "flex";
  document.body.style.background = "black";
  gameStarted = false;
  Music.currentTime = 0;
  Music.play().catch(err => console.log("Music play blocked:", err));
});

// ------------------- PRELOAD -------------------
function preloadAssets(callback) {
  if (!background.complete) {
    background.onload = () => preloadAssets(callback);
    return;
  }

  const assets = [spaceship, obstacleImg, keyImg, ...coinFrames];
  let loaded = 0;
  assets.forEach(img => {
    if (img.complete) {
      loaded++;
      if (loaded === assets.length) callback();
    } else {
      img.onload = () => {
        loaded++;
        if (loaded === assets.length) callback();
      };
    }
  });
}

// ------------------- START GAME -------------------
function startGame() {
  console.log("Starting game...");
  resetGame();
  gamePaused = false;
  gameOverFlag = false;
  resumeBtn.style.display = "none";
  quitBtn.style.display = "none";
  exitBtn.style.display = "none";
  update();
}

// ------------------- DRAW -------------------
function draw() {
  bgX -= bgSpeed;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(background, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(background, bgX + canvas.width, 0, canvas.width, canvas.height);

  ctx.drawImage(spaceship, ship.x, ship.y, ship.width, ship.height);

  drawCoins();
  drawObstacles();
  drawKeys();

  if (keyCollected && portal && portal.img.complete)
    ctx.drawImage(portal.img, portal.x, portal.y, portal.width, portal.height);

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Coins: " + coinCollectedCount, 20, 40);
}

function drawCoins() {
  for (let i = coins.length - 1; i >= 0; i--) {
    let c = coins[i];
    ctx.drawImage(coinFrames[c.frameIndex], c.x, c.y, c.width, c.height);
    c.frameIndex = (c.frameIndex + 1) % coinFrames.length;
    c.x -= coinSpeed;

    if (c.x + c.width < 0 || c.collected) {
      if (c.collected) {
        coinCollectedCount++;
        coinSound.currentTime = 0;
        coinSound.play();
      }
      coins.splice(i, 1);
    }
  }
}

function drawObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let o = obstacles[i];
    ctx.drawImage(obstacleImg, o.x, o.y, o.width, o.height);
    o.x -= obstacleSpeed;
    if (o.x + o.width < 0) obstacles.splice(i, 1);
  }
}

function drawKeys() {
  for (let i = keys.length - 1; i >= 0; i--) {
    let k = keys[i];
    ctx.drawImage(keyImg, k.x, k.y, k.width, k.height);
    k.x -= keySpeed;
    if (k.x + k.width < 0 || k.collected) keys.splice(i, 1);
  }
}

// ------------------- COLLISIONS -------------------
function checkCollisions() {
  for (let c of coins) {
    if (!c.collected && ship.x < c.x + c.width && ship.x + ship.width > c.x && ship.y < c.y + c.height && ship.y + ship.height > c.y)
      c.collected = true;
  }

  for (let o of obstacles) {
    if (ship.x < o.x + o.width && ship.x + ship.width > o.x && ship.y < o.y + o.height && ship.y + ship.height > o.y) {
      bumpSound.currentTime = 0;
      bumpSound.play();
      gameOver();
    }
  }

  for (let k of keys) {
    if (!k.collected && ship.x < k.x + k.width && ship.x + ship.width > k.x && ship.y < k.y + k.height && ship.y + ship.height > k.y) {
      k.collected = true;
      keyCollected = true;
      keySound.currentTime = 0;
      keySound.play();

      portal = {
        x: canvas.width - 150,
        y: canvas.height / 2 - 75,
        width: 150,
        height: 150,
        img: new Image()
      };
      portal.img.src = "images/portal1.png";
    }
  }

  if (keyCollected && portal) {
    if (ship.x < portal.x + portal.width && ship.x + ship.width > portal.x && ship.y < portal.y + portal.height && ship.y + ship.height > portal.y) {
      winSound.currentTime = 0;
      winSound.play();
      winGame();
    }
  }
}

// ------------------- GAME STATES -------------------
function gameOver() {
  cancelAnimationFrame(animationId);
  gamePaused = true;
  gameOverFlag = true;
  draw();
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "red";
  ctx.font = "60px Arial";
  ctx.textAlign = "center";
  ctx.fillText("You Lost!", canvas.width / 2, canvas.height / 2 - 50);
  restartBtn.style.display = "block";
}

function winGame() {
  cancelAnimationFrame(animationId);
  gamePaused = true;
  draw();
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "lime";
  ctx.font = "60px Arial";
  ctx.textAlign = "center";
  ctx.fillText("You Win!", canvas.width / 2, canvas.height / 2 - 50);
  exitBtn.style.display = "block"; // show exit button
}

function pauseGame() {
  if (!gamePaused && !gameOverFlag) {
    gamePaused = true;
    cancelAnimationFrame(animationId);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "yellow";
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Paused", canvas.width / 2, canvas.height / 2 - 50);
    resumeBtn.style.display = "block";
    quitBtn.style.display = "block";
  }
}

function resumeGame() {
  if (gamePaused && !gameOverFlag) {
    gamePaused = false;
    resumeBtn.style.display = "none";
    quitBtn.style.display = "none";
    update();
  }
}

function resetGame() {
  coins = [];
  obstacles = [];
  keys = [];
  coinCollectedCount = 0;
  keySpawned = false;
  keyCollected = false;
  portal = null;
  ship.x = 100;
  ship.y = canvas.height / 2 - 50;
  bgX = 0;
  coinSpawnCounter = 0;
  obstacleSpawnCounter = 0;
  keySpawnCounter = 0;
}

// ------------------- UPDATE -------------------
function update() {
  if (gamePaused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  spawnCoin();
  spawnObstacle();
  spawnKey();
  draw();
  checkCollisions();
  animationId = requestAnimationFrame(update);
}

// ------------------- SPAWN -------------------
function spawnCoin() {
  if (coinCollectedCount >= maxCoins) return;
  coinSpawnCounter++;
  if (coinSpawnCounter > 100) {
    coinSpawnCounter = 0;
    let y = Math.random() * (canvas.height - 50);
    coins.push({ x: canvas.width + 50, y, width: 50, height: 50, frameIndex: 0, collected: false });
  }
}

function spawnObstacle() {
  obstacleSpawnCounter++;
  if (obstacleSpawnCounter > 150) {
    obstacleSpawnCounter = 0;
    let y = Math.random() * (canvas.height - 100);
    obstacles.push({ x: canvas.width + 50, y, width: 100, height: 100 });
  }
}

function spawnKey() {
  if (coinCollectedCount >= maxCoins && !keyCollected) {
    keySpawnCounter++;
    if (!keySpawned || keySpawnCounter > keySpawnInterval) {
      keySpawnCounter = 0;
      keySpawned = true;
      let y = Math.random() * (canvas.height - 50);
      keys.push({ x: canvas.width + 50, y, width: 50, height: 50, collected: false });
    }
  }
}

// ------------------- MOVEMENT + PAUSE -------------------
window.addEventListener("keydown", (e) => {
  if (!gameStarted || gameOverFlag) return;

  if (e.key === "Escape") {
    if (gamePaused) resumeGame();
    else pauseGame();
  }

  if (gamePaused) return;

  if (e.key === "ArrowUp") ship.y -= ship.speed;
  if (e.key === "ArrowDown") ship.y += ship.speed;
  if (e.key === "ArrowLeft") ship.x -= ship.speed;
  if (e.key === "ArrowRight") ship.x += ship.speed;

  ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height - ship.height, ship.y));
});
