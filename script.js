const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

const roadLeft = 70;
const roadWidth = 340;

const keys = {};
let lastTime = 0;
let spawnTimer = 0;
let score = 0;
let gameRunning = true;
let bestScore = Number(localStorage.getItem("bike-best-score") || 0);

bestEl.textContent = bestScore;

const bike = {
  x: canvas.width * 0.4,
  y: canvas.height - 120,
  width: 52,
  height: 90,
  speed: 0,
  maxSpeed: 8,
  acceleration: 0.3,
};

const obstacles = [];

document.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;

  if (!gameRunning) {
    resetGame();
  }

  if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
    bike.speed = -bike.maxSpeed;
  }
  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
    bike.speed = bike.maxSpeed;
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

function resetGame() {
  bike.y = canvas.height - 120;
  bike.speed = 0;
  obstacles.length = 0;
  score = 0;
  scoreEl.textContent = score;
  spawnTimer = 0;
  gameRunning = true;
}

function updateScore() {
  score += 1;
  scoreEl.textContent = score;

  if (score > bestScore) {
    bestScore = score;
    bestEl.textContent = bestScore;
    localStorage.setItem("bike-best-score", String(bestScore));
  }
}

function spawnObstacle() {
  const type = Math.random() > 0.5 ? "cone" : "barrier";
  const width = type === "cone" ? 40 : 58;
  const height = type === "cone" ? 44 : 60;

  obstacles.push({
    x: roadLeft + Math.random() * (roadWidth - width),
    y: -height,
    width,
    height,
    type,
  });
}

function drawRoad() {
  ctx.fillStyle = "#6f7a8c";
  ctx.fillRect(roadLeft, 0, roadWidth, canvas.height);

  ctx.fillStyle = "#f1f5f9";
  for (let i = 0; i < 14; i += 1) {
    const y = (i * 80 + (score * 2) % 80) - 80;
    ctx.fillRect(roadLeft + roadWidth / 2 - 8, y, 16, 50);
  }

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 4;
  ctx.strokeRect(roadLeft, 0, roadWidth, canvas.height);

  ctx.strokeStyle = "#f39f18";
  ctx.beginPath();
  ctx.moveTo(roadLeft, 0);
  ctx.lineTo(roadLeft, canvas.height);
  ctx.moveTo(roadLeft + roadWidth, 0);
  ctx.lineTo(roadLeft + roadWidth, canvas.height);
  ctx.stroke();
}

function drawBike() {
  const { x, y, width: w, height: h } = bike;

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x + 10, y + 20, w - 20, h - 25);

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(x + 14, y + h - 12, 14, 0, Math.PI * 2);
  ctx.arc(x + w - 14, y + h - 12, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f97316";
  ctx.fillRect(x + 12, y + 8, w - 24, 14);

  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 16);
  ctx.lineTo(x + w - 6, y + 16);
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(x + w / 2 - 8, y + 30, 16, 24);
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(x + w / 2 - 12, y + 52, 24, 18);
}

function drawObstacle(obstacle) {
  if (obstacle.type === "cone") {
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
    ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
    ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }
}

function handleInput() {
  if (keys.arrowup || keys.w) {
    bike.speed -= bike.acceleration;
  } else if (keys.arrowdown || keys.s) {
    bike.speed += bike.acceleration;
  } else {
    bike.speed *= 0.94;
  }

  bike.speed = Math.max(-bike.maxSpeed, Math.min(bike.maxSpeed, bike.speed));
  bike.y += bike.speed;
  bike.y = Math.max(20, Math.min(canvas.height - bike.height - 10, bike.y));
}

function checkCollisions() {
  for (const obstacle of obstacles) {
    const hit =
      bike.x < obstacle.x + obstacle.width &&
      bike.x + bike.width > obstacle.x &&
      bike.y < obstacle.y + obstacle.height &&
      bike.y + bike.height > obstacle.y;

    if (hit) {
      gameRunning = false;
      return;
    }
  }
}

function update(delta) {
  if (!gameRunning) return;

  handleInput();
  spawnTimer += delta;

  if (spawnTimer > 900) {
    spawnObstacle();
    spawnTimer = 0;
  }

  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    obstacles[i].y += 5 + score / 120;

    if (obstacles[i].y > canvas.height + 50) {
      obstacles.splice(i, 1);
      updateScore();
    }
  }

  checkCollisions();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRoad();
  drawBike();
  obstacles.forEach(drawObstacle);

  if (!gameRunning) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 42px Arial";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "24px Arial";
    ctx.fillText("Press any key to restart", canvas.width / 2, canvas.height / 2 + 30);
  }
}

function gameLoop(time) {
  const delta = time - lastTime;
  lastTime = time;
  update(delta);
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop(0);
