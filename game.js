const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const scoreEl = document.getElementById('score');
const highEl = document.getElementById('high');

let keys = {};
addEventListener('keydown', e => keys[e.code] = true);
addEventListener('keyup', e => keys[e.code] = false);
document.getElementById('left').addEventListener('pointerdown', () => keys['TouchLeft'] = true);
document.getElementById('left').addEventListener('pointerup', () => keys['TouchLeft'] = false);
document.getElementById('right').addEventListener('pointerdown', () => keys['TouchRight'] = true);
document.getElementById('right').addEventListener('pointerup', () => keys['TouchRight'] = false);
document.getElementById('acc').addEventListener('pointerdown', () => keys['TouchAcc'] = true);
document.getElementById('acc').addEventListener('pointerup', () => keys['TouchAcc'] = false);

const laneCount = 3;
const laneW = W * 0.5 / laneCount;
const roadX = (W - laneW * laneCount) / 2;

let highScore = Number(localStorage.getItem('f1_high') || 0);

function rand(min, max){ return Math.random() * (max - min) + min; }

// Player (F1 car)
const player = {
  lane: 1, // 0..laneCount-1
  x: 0, y: H - 140, w: laneW * 0.7, h: 60,
  speed: 0, maxSpeed: 8, accel: 0.15, brake: 0.4, color: '#e63946'
};

// Obstacles (outros carros)
let obstacles = [];
let spawnTimer = 0;
let spawnInterval = 80; // frames

let distance = 0;
let running = true;

function reset(){
  player.lane = 1;
  player.speed = 3;
  obstacles = [];
  spawnTimer = 0;
  distance = 0;
  running = true;
}

function laneToX(lane){
  return roadX + lane * laneW + (laneW - player.w) / 2;
}

function update(){
  if (!running) return;

  // Input
  if (keys['ArrowLeft'] || keys['KeyA'] || keys['TouchLeft']){
    if (player.lane > 0){ player.lane--; keys['ArrowLeft']=false; keys['KeyA']=false; keys['TouchLeft']=false; }
  }
  if (keys['ArrowRight'] || keys['KeyD'] || keys['TouchRight']){
    if (player.lane < laneCount - 1){ player.lane++; keys['ArrowRight']=false; keys['KeyD']=false; keys['TouchRight']=false; }
  }
  // accelerate / brake
  if (keys['ArrowUp'] || keys['KeyW'] || keys['TouchAcc']) player.speed += player.accel;
  else if (keys['ArrowDown'] || keys['KeyS']) player.speed -= player.brake * 0.6;
  else player.speed -= 0.02; // natural slowdown

  // clamp speed
  player.speed = Math.max(0, Math.min(player.maxSpeed, player.speed));

  // distance increases with speed
  distance += player.speed * 0.5;

  // spawn obstacles
  spawnTimer++;
  if (spawnTimer > spawnInterval){
    spawnTimer = 0;
    spawnInterval = Math.max(38, 80 - Math.floor(distance / 200)); // get harder
    const lane = Math.floor(rand(0, laneCount));
    const speed = rand(1.0, 3.2) + Math.min(2.8, distance / 700);
    obstacles.push({
      lane,
      x: roadX + lane * laneW + laneW/2,
      y: -120,
      w: laneW*0.7,
      h: 60,
      speed,
      color: '#2b2d42'
    });
  }

  // update obstacles
  for (let i = obstacles.length -1; i >=0; i--){
    const ob = obstacles[i];
    ob.y += ob.speed + player.speed; // relative movement
    // collision?
    const px = laneToX(player.lane);
    if (ob.y + ob.h > player.y && ob.y < player.y + player.h && ob.lane === player.lane){
      // collision -> game over
      running = false;
      if (distance > highScore){ highScore = Math.floor(distance); localStorage.setItem('f1_high', highScore); }
    }
    if (ob.y > H + 200) obstacles.splice(i,1);
  }

  // small horizontal easing to snap player x
  const targetX = laneToX(player.lane);
  // store px in object for drawing
  player.x = targetX;
}

function drawRoad(){
  // background grass
  ctx.fillStyle = '#0f1724';
  ctx.fillRect(0,0,W,H);

  // road
  ctx.fillStyle = '#2f3640';
  const roadW = laneW * laneCount;
  ctx.fillRect(roadX, 0, roadW, H);

  // side lines
  ctx.fillStyle = '#7b8a97';
  ctx.fillRect(roadX - 8, 0, 8, H);
  ctx.fillRect(roadX + roadW, 0, 8, H);

  // lane dashed lines
  ctx.strokeStyle = '#e6e6e6';
  ctx.lineWidth = 4;
  ctx.setLineDash([30, 22]);
  const centerStartX = roadX + laneW/2;
  for (let i = 0; i < laneCount - 1; i++){
    const x = roadX + (i+1)*laneW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawCar(x,y,w,h,color,helmet=false){
  // simple stylized F1 car
  ctx.save();
  ctx.translate(x + w/2, y + h/2);
  // body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-w*0.45, -h*0.15);
  ctx.lineTo(w*0.45, -h*0.15);
  ctx.lineTo(w*0.35, h*0.4);
  ctx.lineTo(-w*0.35, h*0.4);
  ctx.closePath();
  ctx.fill();
  // cockpit
  ctx.fillStyle = '#111';
  ctx.fillRect(-w*0.18, -h*0.25, w*0.36, h*0.18);
  // rear wing
  ctx.fillStyle = '#222';
  ctx.fillRect(-w*0.42, h*0.02, w*0.84, h*0.07);
  // front wing
  ctx.fillRect(-w*0.2, -h*0.28, w*0.4, h*0.05);
  ctx.restore();
}

function draw(){
  // clear
  ctx.clearRect(0,0,W,H);

  // road and environment
  drawRoad();

  // obstacles
  for (const ob of obstacles){
    const ox = roadX + ob.lane * laneW + (laneW - ob.w)/2;
    ctx.fillStyle = ob.color;
    ctx.fillRect(ox, ob.y, ob.w, ob.h);
    // simple headlights
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(ox + ob.w*0.12, ob.y + ob.h - 8, ob.w*0.26, 6);
    ctx.fillRect(ox + ob.w*0.62, ob.y + ob.h - 8, ob.w*0.26, 6);
    drawCar(ox, ob.y, ob.w, ob.h, '#2b2d42');
  }

  // player
  const px = laneToX(player.lane);
  drawCar(px, player.y, player.w, player.h, player.color, true);

  // HUD
  scoreEl.textContent = 'Pontuação: ' + Math.floor(distance);
  highEl.textContent = 'Recorde: ' + highScore;

  if (!running){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(W*0.08, H*0.28, W*0.84, H*0.38);
    ctx.fillStyle = '#fff';
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W/2, H*0.45);
    ctx.font = '18px Arial';
    ctx.fillText('Pontuação: ' + Math.floor(distance), W/2, H*0.52);
    ctx.fillText('Pressione R para reiniciar', W/2, H*0.6);
    ctx.textAlign = 'start';
  }
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

addEventListener('keydown', e => {
  if (e.code === 'KeyR') { reset(); }
  if ((e.code === 'ArrowUp' || e.code === 'KeyW') && !running){ reset(); }
});

reset();
loop();
