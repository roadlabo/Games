"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// DOM 要素
const scoreSpan = document.getElementById("score");
const livesSpan = document.getElementById("lives");
const chapterSpan = document.getElementById("chapter");
const storyText = document.getElementById("story-text");
const startOverlay = document.getElementById("start-overlay");
const messageText = document.getElementById("message-text");
const messageSubtext = document.getElementById("message-subtext");

function showOverlay() {
  if (!startOverlay) return;
  startOverlay.style.display = "flex";
  startOverlay.classList.remove("hidden");
}

function hideOverlay() {
  if (!startOverlay) return;
  startOverlay.style.display = "none";
  startOverlay.classList.add("hidden");
}

// ゲーム状態
const GameState = {
  TITLE: "title",
  PLAYING: "playing",
  GAME_OVER: "gameover",
  CLEAR: "clear",
};
let gameState = GameState.TITLE;

// プレイヤー
const player = {
  x: 80,
  y: canvas.height / 2,
  width: 32,
  height: 24,
  speed: 4,
  vy: 0,
};

// 弾と敵
let bullets = [];
let enemies = [];
let particles = [];

// スコアとライフ
let score = 0;
let lives = 3;
let frameCount = 0;
let chapter = 1;

// キー入力
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  Space: false,
};
let canShoot = true;

// ストーリー用テキスト
const chapters = [
  {
    id: 1,
    text:
      "第1章：静かな町の空に、不気味な光が走る――。\n" +
      "ゆっくりと迫る偵察ドローンを迎撃せよ。",
  },
  {
    id: 2,
    text:
      "第2章：敵は本格的な侵攻を開始した。\n" +
      "攻撃的なドローンが波状攻撃を仕掛けてくる。",
  },
  {
    id: 3,
    text:
      "最終章：巨大な親玉ドローンが出現したようだ……。\n" +
      "町を守れるのは、あなたとクウコ１号だけだ。",
  },
];

// ランダム用
function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

// 初期化
function resetGame() {
  player.y = canvas.height / 2;
  bullets = [];
  enemies = [];
  particles = [];
  score = 0;
  lives = 3;
  frameCount = 0;
  chapter = 1;
  chapterSpan.textContent = chapter.toString();
  updateStoryForChapter();
}

// ストーリー更新
function updateStoryForChapter() {
  const ch = chapters.find((c) => c.id === chapter);
  if (ch) {
    storyText.innerHTML =
      ch.text.replace(/\n/g, "<br>") +
      "<br><br>【操作】↑↓キー: 移動　Space: ショット";
  }
}

// キーイベント
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.code === "Space") {
    e.preventDefault();
  }

  if (e.key === "ArrowUp") keys.ArrowUp = true;
  if (e.key === "ArrowDown") keys.ArrowDown = true;
  if (e.code === "Space") keys.Space = true;

  if (gameState === GameState.TITLE && e.key === "Enter") {
    hideOverlay();
    resetGame();
    gameState = GameState.PLAYING;
  } else if (
    (gameState === GameState.GAME_OVER || gameState === GameState.CLEAR) &&
    e.key === "Enter"
  ) {
    hideOverlay();
    resetGame();
    gameState = GameState.PLAYING;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowUp") keys.ArrowUp = false;
  if (e.key === "ArrowDown") keys.ArrowDown = false;
  if (e.code === "Space") keys.Space = false;
});

// 弾生成
function shoot() {
  if (!canShoot) return;
  canShoot = false;

  bullets.push({
    x: player.x + player.width,
    y: player.y + player.height / 2,
    vx: 8,
    radius: 4,
  });

  // ショット連射間隔
  setTimeout(() => {
    canShoot = true;
  }, 120);
}

// 敵生成
function spawnEnemy() {
  const baseSpeed = 2 + chapter * 0.4;
  const enemy = {
    x: canvas.width + 20,
    y: randRange(40, canvas.height - 40),
    width: 28,
    height: 28,
    vx: -baseSpeed,
    hp: chapter >= 3 ? 3 : chapter >= 2 ? 2 : 1,
    color: chapter === 1 ? "#66ccff" : chapter === 2 ? "#ffcc66" : "#ff6699",
  };
  enemies.push(enemy);
}

// パーティクル生成（敵撃破エフェクト）
function spawnExplosion(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x,
      y,
      vx: randRange(-2, 2),
      vy: randRange(-2, 2),
      life: randRange(20, 40),
      color,
    });
  }
}

// 当たり判定
function rectIntersect(a, b) {
  return !(
    a.x > b.x + b.width ||
    a.x + a.width < b.x ||
    a.y > b.y + b.height ||
    a.y + a.height < b.y
  );
}

function circleRectIntersect(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

// ステージ進行条件
function updateChapterIfNeeded() {
  if (chapter === 1 && score >= 300) {
    chapter = 2;
    chapterSpan.textContent = chapter.toString();
    updateStoryForChapter();
  } else if (chapter === 2 && score >= 800) {
    chapter = 3;
    chapterSpan.textContent = chapter.toString();
    updateStoryForChapter();
  } else if (chapter === 3 && score >= 1500) {
    // クリア演出
    gameState = GameState.CLEAR;
    messageText.textContent = "任務完了！";
    messageSubtext.textContent =
      "町ツヤマは守られた。おつかれさま、パイロット。Enterキーで再出撃。";
    showOverlay();
  }
}

// メインループ
function update() {
  if (gameState === GameState.PLAYING) {
    frameCount++;

    // プレイヤーの移動
    if (keys.ArrowUp) {
      player.y -= player.speed;
    }
    if (keys.ArrowDown) {
      player.y += player.speed;
    }
    player.y = Math.max(10, Math.min(canvas.height - player.height - 10, player.y));

    // ショット
    if (keys.Space) {
      shoot();
    }

    // 弾の更新
    bullets.forEach((b) => {
      b.x += b.vx;
    });
    bullets = bullets.filter((b) => b.x < canvas.width + 20);

    // 敵の生成頻度（章によって変える）
    let spawnInterval = 80;
    if (chapter === 2) spawnInterval = 60;
    if (chapter === 3) spawnInterval = 45;

    if (frameCount % spawnInterval === 0) {
      spawnEnemy();
    }

    // 敵の更新
    enemies.forEach((e) => {
      e.x += e.vx;
    });
    enemies = enemies.filter((e) => e.x > -60);

    // パーティクル更新
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
    });
    particles = particles.filter((p) => p.life > 0);

    // 弾と敵の衝突判定
    bullets.forEach((b) => {
      enemies.forEach((e) => {
        if (
          circleRectIntersect(
            { x: b.x, y: b.y, radius: b.radius },
            { x: e.x, y: e.y, width: e.width, height: e.height }
          )
        ) {
          b.hit = true;
          e.hp -= 1;
          if (e.hp <= 0) {
            e.dead = true;
            score += 50;
            scoreSpan.textContent = score.toString();
            spawnExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
          }
        }
      });
    });

    bullets = bullets.filter((b) => !b.hit);
    enemies = enemies.filter((e) => !e.dead);

    // 敵とプレイヤーの衝突判定
    enemies.forEach((e) => {
      if (
        rectIntersect(
          { x: player.x, y: player.y, width: player.width, height: player.height },
          { x: e.x, y: e.y, width: e.width, height: e.height }
        )
      ) {
        e.dead = true;
        lives -= 1;
        livesSpan.textContent = lives.toString();
        spawnExplosion(player.x + player.width / 2, player.y + player.height / 2, "#ffffff");
        if (lives <= 0) {
          gameState = GameState.GAME_OVER;
          messageText.textContent = "ゲームオーバー";
          messageSubtext.textContent = "町ツヤマは謎のドローンに占拠された……。Enterキーで再挑戦。";
          showOverlay();
        }
      }
    });
    enemies = enemies.filter((e) => !e.dead);

    // ストーリー進行
    updateChapterIfNeeded();
  }
}

// 描画
function drawBackground() {
  // シンプルな星空＋横ライン
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 星
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 60; i++) {
    const x = (i * 73 + frameCount * 0.5) % canvas.width;
    const y = (i * 37) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }

  // 地平線
  ctx.strokeStyle = "#223344";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 50);
  ctx.lineTo(canvas.width, canvas.height - 50);
  ctx.stroke();
}

function drawPlayer() {
  // シンプルな三角形の機体
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = "#66ffcc";
  ctx.beginPath();
  ctx.moveTo(0, player.height / 2);
  ctx.lineTo(player.width, 0);
  ctx.lineTo(player.width, player.height);
  ctx.closePath();
  ctx.fill();

  // コクピット
  ctx.fillStyle = "#003344";
  ctx.fillRect(player.width * 0.4, player.height * 0.25, 8, player.height * 0.5);
  ctx.restore();
}

function drawBullets() {
  ctx.fillStyle = "#ffdd55";
  bullets.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawEnemies() {
  enemies.forEach((e) => {
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x, e.y, e.width, e.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x, e.y, e.width, e.height);
  });
}

function drawParticles() {
  particles.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life / 40);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
    ctx.globalAlpha = 1.0;
  });
}

function gameLoop() {
  update();
  drawBackground();
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawParticles();
  requestAnimationFrame(gameLoop);
}

// タイトルメッセージ初期表示
function initTitle() {
  messageText.textContent = "星空防衛隊：クウコ１号 出撃準備";
  messageSubtext.textContent = "Enterキーで出撃開始。↑↓で移動、Spaceでショット。";
  showOverlay();
  updateStoryForChapter();
  scoreSpan.textContent = score.toString();
  livesSpan.textContent = lives.toString();
}

initTitle();
gameLoop();
