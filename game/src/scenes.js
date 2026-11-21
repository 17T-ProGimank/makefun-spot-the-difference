// Twin Lookout scenes: three original places painted fresh on canvas every
// round — a lakeside cabin, a night campfire and a harbour at sunrise. Each
// scene is one painter function that draws the same picture twice; the right
// panel passes the set of active difference ids, so only those seven spots
// change. No image files, no network: every pixel is procedural.

import { mulberry32, range, rangeInt } from './rng.js';

export const PANEL_W = 560;
export const PANEL_H = 420;

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function pine(ctx, x, baseY, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - size * 0.06, baseY - size * 0.22, size * 0.12, size * 0.22);
  for (let tier = 0; tier < 3; tier += 1) {
    const tierW = size * (0.52 - tier * 0.13);
    const tierTop = baseY - size * (0.22 + tier * 0.26);
    const tierBottom = baseY - size * (tier * 0.26 - 0.02);
    ctx.beginPath();
    ctx.moveTo(x, tierTop);
    ctx.lineTo(x - tierW, tierBottom);
    ctx.lineTo(x + tierW, tierBottom);
    ctx.closePath();
    ctx.fill();
  }
}

function cloudPuff(ctx, x, y, scale) {
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ellipse(ctx, x, y, 34 * scale, 16 * scale);
  ellipse(ctx, x - 24 * scale, y + 5 * scale, 22 * scale, 12 * scale);
  ellipse(ctx, x + 26 * scale, y + 5 * scale, 24 * scale, 13 * scale);
}

function birdMark(ctx, x, y, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.quadraticCurveTo(x - size * 0.4, y - size * 0.7, x, y);
  ctx.quadraticCurveTo(x + size * 0.4, y - size * 0.7, x + size, y);
  ctx.stroke();
}

function flower(ctx, x, y, petalColor) {
  ctx.strokeStyle = '#2f7a3d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 14);
  ctx.stroke();
  ctx.fillStyle = petalColor;
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    ellipse(ctx, x + Math.cos(angle) * 7, y + Math.sin(angle) * 7, 5, 5);
  }
  ctx.fillStyle = '#ffd23e';
  ellipse(ctx, x, y, 4.5, 4.5);
}

// ---------------------------------------------------------------- scene 1
function paintCabin(ctx, active) {
  const sky = ctx.createLinearGradient(0, 0, 0, 280);
  sky.addColorStop(0, '#7ec3ef');
  sky.addColorStop(1, '#d9f1ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_W, 280);

  // Sun, top right. Difference "sunglasses": cool shades on the sun.
  ctx.fillStyle = '#ffd23e';
  ellipse(ctx, 470, 62, 32, 32);
  ctx.strokeStyle = '#f5b81e';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(470 + Math.cos(angle) * 38, 62 + Math.sin(angle) * 38);
    ctx.lineTo(470 + Math.cos(angle) * 48, 62 + Math.sin(angle) * 48);
    ctx.stroke();
  }
  if (active.has('sunglasses')) {
    ctx.fillStyle = '#1d2733';
    ellipse(ctx, 458, 58, 10, 7);
    ellipse(ctx, 482, 58, 10, 7);
    ctx.fillRect(466, 56, 6, 3);
    ctx.strokeStyle = '#1d2733';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(448, 56);
    ctx.lineTo(440, 52);
    ctx.moveTo(492, 56);
    ctx.lineTo(500, 52);
    ctx.stroke();
  }

  cloudPuff(ctx, 110, 66, 1);
  cloudPuff(ctx, 285, 42, 0.8);
  cloudPuff(ctx, 400, 112, 0.7);

  // Birds. Difference "bird": the third bird is gone on the right.
  birdMark(ctx, 195, 88, 10, '#33475c');
  birdMark(ctx, 248, 62, 9, '#33475c');
  if (!active.has('bird')) birdMark(ctx, 322, 96, 10, '#33475c');

  // Mountains and hills.
  ctx.fillStyle = '#8fb0d4';
  ctx.beginPath();
  ctx.moveTo(0, 270);
  ctx.lineTo(120, 150);
  ctx.lineTo(230, 270);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a8c4de';
  ctx.beginPath();
  ctx.moveTo(180, 270);
  ctx.lineTo(330, 130);
  ctx.lineTo(470, 270);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6da05e';
  ctx.beginPath();
  ctx.moveTo(0, 280);
  ctx.quadraticCurveTo(180, 220, 380, 275);
  ctx.quadraticCurveTo(480, 250, 560, 280);
  ctx.lineTo(560, 300);
  ctx.lineTo(0, 300);
  ctx.closePath();
  ctx.fill();

  // Lake.
  const lake = ctx.createLinearGradient(0, 285, 0, PANEL_H);
  lake.addColorStop(0, '#4aa3d8');
  lake.addColorStop(1, '#256b9e');
  ctx.fillStyle = lake;
  ctx.fillRect(0, 285, PANEL_W, PANEL_H - 285);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  for (const [x, y, len] of [[60, 320, 70], [180, 350, 90], [330, 315, 60], [430, 360, 80], [90, 385, 60]]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }

  // Rowboat. Difference "boat": the boat is gone on the right.
  if (!active.has('boat')) {
    ctx.fillStyle = '#a4552e';
    ctx.beginPath();
    ctx.moveTo(372, 322);
    ctx.lineTo(432, 322);
    ctx.lineTo(420, 336);
    ctx.lineTo(384, 336);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7c3c1e';
    ctx.fillRect(398, 300, 4, 22);
    ctx.fillStyle = '#f2ead8';
    ctx.beginPath();
    ctx.moveTo(402, 300);
    ctx.lineTo(402, 318);
    ctx.lineTo(424, 318);
    ctx.closePath();
    ctx.fill();
  }

  // Cabin.
  ctx.fillStyle = '#b07a45';
  ctx.fillRect(120, 210, 130, 100);
  ctx.fillStyle = '#8a5a2e';
  ctx.beginPath();
  ctx.moveTo(108, 212);
  ctx.lineTo(185, 158);
  ctx.lineTo(262, 212);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6e4522';
  ctx.fillRect(228, 168, 18, 44);
  // Difference "smoke": the chimney smoke is gone on the right.
  if (!active.has('smoke')) {
    ctx.fillStyle = 'rgba(240,240,240,0.9)';
    ellipse(ctx, 240, 148, 10, 8);
    ellipse(ctx, 248, 132, 13, 10);
    ellipse(ctx, 258, 114, 15, 11);
  }
  // Door and windows. Difference "window": the right window goes dark.
  ctx.fillStyle = '#5d3a1a';
  ctx.fillRect(168, 252, 30, 58);
  ctx.fillStyle = '#ffe08a';
  ctx.fillRect(134, 232, 22, 22);
  ctx.fillStyle = active.has('window') ? '#3a4a5c' : '#ffe08a';
  ctx.fillRect(214, 232, 22, 22);
  ctx.strokeStyle = '#5d3a1a';
  ctx.lineWidth = 2;
  ctx.strokeRect(134, 232, 22, 22);
  ctx.strokeRect(214, 232, 22, 22);
  ctx.beginPath();
  ctx.moveTo(168, 310);
  ctx.lineTo(185, 310);
  ctx.stroke();

  // Pines. Difference "pine": the far-right pine is gone on the right.
  pine(ctx, 62, 292, 74, '#2e6b34');
  pine(ctx, 318, 288, 66, '#357a3a');
  if (!active.has('pine')) pine(ctx, 505, 292, 80, '#2e6b34');

  // Path from the door to the lake.
  ctx.fillStyle = '#d9c49a';
  ctx.beginPath();
  ctx.moveTo(172, 310);
  ctx.lineTo(198, 310);
  ctx.lineTo(212, 420);
  ctx.lineTo(158, 420);
  ctx.closePath();
  ctx.fill();

  // Flower bed along the bottom. Difference "flower": the middle bloom
  // changes from pink to blue on the right.
  flower(ctx, 60, 392, '#ff7fa5');
  flower(ctx, 150, 398, '#ff9e3d');
  flower(ctx, 280, 392, active.has('flower') ? '#5aa2ff' : '#ff7fa5');
  flower(ctx, 380, 398, '#c77dff');
  flower(ctx, 470, 392, '#ff9e3d');
}

// ---------------------------------------------------------------- scene 2
function paintCamp(ctx, active) {
  const rand = mulberry32(20261121);
  const sky = ctx.createLinearGradient(0, 0, 0, 320);
  sky.addColorStop(0, '#0a0f2e');
  sky.addColorStop(0.7, '#1d2c55');
  sky.addColorStop(1, '#31456e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_W, 320);

  // Stars, one of them bright. Difference "brightstar": it is gone.
  for (let i = 0; i < 46; i += 1) {
    const x = range(rand, 10, 550);
    const y = range(rand, 10, 240);
    const r = range(rand, 0.8, 2);
    ctx.fillStyle = `rgba(255,255,255,${range(rand, 0.4, 0.95)})`;
    ellipse(ctx, x, y, r, r);
  }
  if (!active.has('brightstar')) {
    ctx.fillStyle = '#fff6c9';
    ellipse(ctx, 120, 58, 4, 4);
    ctx.strokeStyle = 'rgba(255,246,201,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(120, 44);
    ctx.lineTo(120, 72);
    ctx.moveTo(106, 58);
    ctx.lineTo(134, 58);
    ctx.stroke();
  }

  // Moon. Difference "crater": the moon is smooth on the right.
  ctx.fillStyle = '#f7ecc8';
  ellipse(ctx, 462, 72, 28, 28);
  if (!active.has('crater')) {
    ctx.fillStyle = '#d9cba0';
    ellipse(ctx, 452, 64, 6, 6);
    ellipse(ctx, 472, 80, 4.5, 4.5);
    ellipse(ctx, 468, 58, 3.5, 3.5);
  }

  // Ground and pine silhouettes.
  ctx.fillStyle = '#14261a';
  ctx.fillRect(0, 300, PANEL_W, 120);
  ctx.fillStyle = '#1d3a26';
  ctx.beginPath();
  ctx.moveTo(0, 310);
  ctx.quadraticCurveTo(200, 270, 400, 305);
  ctx.quadraticCurveTo(500, 285, 560, 310);
  ctx.lineTo(560, 320);
  ctx.lineTo(0, 320);
  ctx.closePath();
  ctx.fill();
  pine(ctx, 300, 300, 60, '#0f2013');
  if (!active.has('pine')) pine(ctx, 512, 300, 84, '#0f2013');
  pine(ctx, 40, 305, 70, '#0f2013');

  // Owl on the left pine's branch. Difference "owl": the owl is gone.
  ctx.strokeStyle = '#0f2013';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(58, 208);
  ctx.lineTo(104, 208);
  ctx.stroke();
  if (!active.has('owl')) {
    ctx.fillStyle = '#7a5230';
    ellipse(ctx, 82, 192, 13, 17);
    ctx.fillStyle = '#fff';
    ellipse(ctx, 77, 186, 4, 4);
    ellipse(ctx, 88, 186, 4, 4);
    ctx.fillStyle = '#1d2733';
    ellipse(ctx, 77, 186, 2, 2);
    ellipse(ctx, 88, 186, 2, 2);
    ctx.fillStyle = '#f5b81e';
    ctx.beginPath();
    ctx.moveTo(82, 192);
    ctx.lineTo(78, 197);
    ctx.lineTo(86, 197);
    ctx.closePath();
    ctx.fill();
  }

  // Tent. Difference "flag": the little flag on the peak is gone.
  ctx.fillStyle = '#e8703a';
  ctx.beginPath();
  ctx.moveTo(120, 310);
  ctx.lineTo(185, 218);
  ctx.lineTo(250, 310);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c65a28';
  ctx.beginPath();
  ctx.moveTo(185, 218);
  ctx.lineTo(250, 310);
  ctx.lineTo(185, 310);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.moveTo(168, 310);
  ctx.lineTo(185, 268);
  ctx.lineTo(202, 310);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a5a2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(185, 218);
  ctx.lineTo(185, 196);
  ctx.stroke();
  if (!active.has('flag')) {
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.moveTo(185, 196);
    ctx.lineTo(205, 201);
    ctx.lineTo(185, 207);
    ctx.closePath();
    ctx.fill();
  }

  // Backpack by the tent.
  ctx.fillStyle = '#3f6fb5';
  ctx.beginPath();
  ctx.roundRect(258, 322, 34, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#2c4f85';
  ctx.fillRect(258, 334, 34, 6);

  // Campfire: stone ring, logs, flame.
  // Warm glow so the fire reads at night, then logs and a taller flame.
  const glow = ctx.createRadialGradient(380, 320, 4, 380, 320, 70);
  glow.addColorStop(0, 'rgba(255,170,60,0.35)');
  glow.addColorStop(1, 'rgba(255,170,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(300, 240, 160, 140);
  ctx.fillStyle = '#8d8d8d';
  for (const [x, y] of [[352, 356], [368, 362], [392, 362], [408, 356], [380, 366]]) {
    ellipse(ctx, x, y, 9, 7);
  }
  ctx.strokeStyle = '#6e4522';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(362, 352);
  ctx.lineTo(398, 340);
  ctx.moveTo(398, 352);
  ctx.lineTo(362, 340);
  ctx.stroke();
  ctx.fillStyle = '#ff8c1a';
  ctx.beginPath();
  ctx.moveTo(380, 344);
  ctx.quadraticCurveTo(358, 314, 380, 288);
  ctx.quadraticCurveTo(402, 314, 380, 344);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd23e';
  ctx.beginPath();
  ctx.moveTo(380, 344);
  ctx.quadraticCurveTo(368, 324, 380, 306);
  ctx.quadraticCurveTo(392, 324, 380, 344);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,180,60,0.8)';
  for (const [x, y] of [[368, 300], [392, 296], [380, 282]]) {
    ellipse(ctx, x, y, 2.5, 2.5);
  }

  // Spare log. Difference "log": it is gone on the right.
  if (!active.has('log')) {
    ctx.fillStyle = '#8a5a2e';
    ctx.beginPath();
    ctx.roundRect(318, 356, 40, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#c89a6a';
    ellipse(ctx, 318, 362, 4, 6);
  }

  // Marshmallow stick. Difference "marshmallow": the marshmallow is gone.
  ctx.strokeStyle = '#a98a5f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(424, 366);
  ctx.lineTo(398, 306);
  ctx.stroke();
  if (!active.has('marshmallow')) {
    ctx.fillStyle = '#fff7e8';
    ctx.beginPath();
    ctx.roundRect(390, 292, 14, 16, 5);
    ctx.fill();
    ctx.fillStyle = '#e8d5b0';
    ctx.fillRect(390, 300, 14, 3);
  }
}

// ---------------------------------------------------------------- scene 3
function paintHarbor(ctx, active) {
  const rand = mulberry32(777);
  const sky = ctx.createLinearGradient(0, 0, 0, 260);
  sky.addColorStop(0, '#ff9e57');
  sky.addColorStop(0.55, '#ffc98a');
  sky.addColorStop(1, '#ffe9c4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_W, 260);

  // Low sun and its reflection path on the sea.
  ctx.fillStyle = '#fff3b0';
  ellipse(ctx, 300, 168, 34, 34);
  ctx.fillStyle = 'rgba(255,243,176,0.5)';
  ellipse(ctx, 300, 168, 48, 48);

  // Gulls. Difference "gull": the third gull is gone on the right.
  birdMark(ctx, 190, 84, 11, '#5c4632');
  birdMark(ctx, 252, 58, 10, '#5c4632');
  if (!active.has('gull')) birdMark(ctx, 338, 92, 11, '#5c4632');

  // Sea.
  const sea = ctx.createLinearGradient(0, 250, 0, PANEL_H);
  sea.addColorStop(0, '#3d8fae');
  sea.addColorStop(1, '#1d5a78');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 250, PANEL_W, PANEL_H - 250);
  ctx.fillStyle = 'rgba(255,243,176,0.55)';
  for (const [x, y, w] of [[270, 268, 60], [258, 292, 84], [244, 318, 108], [228, 346, 132], [210, 376, 156]]) {
    ctx.fillRect(x, y, w, 5);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    const y = 262 + i * 18 + range(rand, -3, 3);
    const x = range(rand, 20, 420);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + range(rand, 30, 70), y);
    ctx.stroke();
  }

  // Lighthouse. Difference "flag": the flag turns blue on the right.
  // Difference "beam": the light beam is off on the right.
  ctx.fillStyle = '#f4ede0';
  ctx.beginPath();
  ctx.moveTo(74, 300);
  ctx.lineTo(80, 128);
  ctx.lineTo(112, 128);
  ctx.lineTo(118, 300);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d94f3d';
  ctx.fillRect(78, 168, 36, 22);
  ctx.fillRect(76, 232, 40, 22);
  ctx.fillStyle = '#33475c';
  ctx.fillRect(72, 118, 48, 12);
  ctx.fillStyle = '#ffe08a';
  ctx.fillRect(82, 96, 28, 22);
  ctx.strokeStyle = '#33475c';
  ctx.lineWidth = 2;
  ctx.strokeRect(82, 96, 28, 22);
  ctx.beginPath();
  ctx.moveTo(96, 96);
  ctx.lineTo(96, 78);
  ctx.stroke();
  ctx.fillStyle = active.has('flag') ? '#3f6fb5' : '#d94f3d';
  ctx.beginPath();
  ctx.moveTo(96, 78);
  ctx.lineTo(118, 84);
  ctx.lineTo(96, 90);
  ctx.closePath();
  ctx.fill();
  if (!active.has('beam')) {
    ctx.fillStyle = 'rgba(255,240,150,0.35)';
    ctx.beginPath();
    ctx.moveTo(110, 104);
    ctx.lineTo(300, 60);
    ctx.lineTo(300, 148);
    ctx.lineTo(110, 112);
    ctx.closePath();
    ctx.fill();
  }

  // Sailboat A (white sail) and sailboat B. Difference "sailboat": B is gone.
  ctx.fillStyle = '#7c3c1e';
  ctx.beginPath();
  ctx.moveTo(330, 296);
  ctx.lineTo(386, 296);
  ctx.lineTo(374, 310);
  ctx.lineTo(342, 310);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5d3a1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(358, 296);
  ctx.lineTo(358, 246);
  ctx.stroke();
  ctx.fillStyle = '#fdf6e3';
  ctx.beginPath();
  ctx.moveTo(358, 248);
  ctx.lineTo(358, 292);
  ctx.lineTo(384, 292);
  ctx.closePath();
  ctx.fill();
  if (!active.has('sailboat')) {
    ctx.fillStyle = '#8a5a2e';
    ctx.beginPath();
    ctx.moveTo(436, 322);
    ctx.lineTo(486, 322);
    ctx.lineTo(476, 334);
    ctx.lineTo(446, 334);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5d3a1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(461, 322);
    ctx.lineTo(461, 280);
    ctx.stroke();
    ctx.fillStyle = '#d94f3d';
    ctx.beginPath();
    ctx.moveTo(461, 282);
    ctx.lineTo(461, 318);
    ctx.lineTo(484, 318);
    ctx.closePath();
    ctx.fill();
  }

  // Buoy. Difference "buoy": it is gone on the right.
  if (!active.has('buoy')) {
    ctx.fillStyle = '#ff8c1a';
    ctx.beginPath();
    ctx.moveTo(296, 352);
    ctx.lineTo(312, 352);
    ctx.lineTo(308, 368);
    ctx.lineTo(300, 368);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(296, 358, 16, 4);
  }

  // Wooden pier with crates. Difference "crate": one crate is gone.
  // Difference "anchor": the anchor leaning on the pier is gone.
  ctx.fillStyle = '#8a5a2e';
  ctx.fillRect(0, 372, 220, 14);
  ctx.fillStyle = '#a06a35';
  for (let x = 8; x < 220; x += 28) ctx.fillRect(x, 372, 20, 14);
  ctx.fillStyle = '#6e4522';
  ctx.fillRect(18, 386, 8, 34);
  ctx.fillRect(190, 386, 8, 34);
  ctx.fillStyle = '#c89a6a';
  ctx.fillRect(52, 336, 32, 36);
  ctx.fillRect(88, 336, 32, 36);
  if (!active.has('crate')) {
    ctx.fillStyle = '#b07a45';
    ctx.fillRect(70, 302, 32, 34);
    ctx.strokeStyle = '#8a5a2e';
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 302, 32, 34);
    ctx.beginPath();
    ctx.moveTo(70, 302);
    ctx.lineTo(102, 336);
    ctx.moveTo(102, 302);
    ctx.lineTo(70, 336);
    ctx.stroke();
  }
  if (!active.has('anchor')) {
    ctx.strokeStyle = '#33475c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(168, 356, 12, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(168, 344);
    ctx.lineTo(168, 372);
    ctx.moveTo(156, 350);
    ctx.lineTo(180, 350);
    ctx.stroke();
  }
}

export const SCENES = [
  {
    id: 'cabin',
    name: 'Lakeside Cabin',
    tagline: 'A quiet morning by the lake — seven things changed.',
    seed: 11,
    paint: paintCabin,
    diffs: [
      { id: 'smoke', label: 'Chimney smoke', x: 248, y: 132, r: 26 },
      { id: 'sunglasses', label: 'Sun sunglasses', x: 470, y: 62, r: 34 },
      { id: 'window', label: 'Dark window', x: 225, y: 243, r: 22 },
      { id: 'bird', label: 'Missing bird', x: 322, y: 96, r: 20 },
      { id: 'flower', label: 'Blue flower', x: 280, y: 392, r: 18 },
      { id: 'boat', label: 'Missing rowboat', x: 402, y: 320, r: 30 },
      { id: 'pine', label: 'Missing pine', x: 505, y: 255, r: 28 },
    ],
  },
  {
    id: 'camp',
    name: 'Campfire Night',
    tagline: 'Stars, a tent and a crackling fire — seven things changed.',
    seed: 22,
    paint: paintCamp,
    diffs: [
      { id: 'brightstar', label: 'Bright star', x: 120, y: 58, r: 20 },
      { id: 'crater', label: 'Smooth moon', x: 462, y: 72, r: 30 },
      { id: 'flag', label: 'Tent flag', x: 194, y: 200, r: 20 },
      { id: 'marshmallow', label: 'Marshmallow', x: 397, y: 300, r: 24 },
      { id: 'owl', label: 'Sleeping owl', x: 82, y: 192, r: 24 },
      { id: 'log', label: 'Spare log', x: 338, y: 362, r: 24 },
      { id: 'pine', label: 'Missing pine', x: 512, y: 258, r: 28 },
    ],
  },
  {
    id: 'harbor',
    name: 'Harbour Sunrise',
    tagline: 'First light over the boats — seven things changed.',
    seed: 33,
    paint: paintHarbor,
    diffs: [
      { id: 'beam', label: 'Lighthouse beam', x: 205, y: 104, r: 30 },
      { id: 'sailboat', label: 'Red sailboat', x: 461, y: 306, r: 30 },
      { id: 'gull', label: 'Missing gull', x: 338, y: 92, r: 18 },
      { id: 'crate', label: 'Top crate', x: 86, y: 319, r: 22 },
      { id: 'anchor', label: 'Anchor', x: 168, y: 358, r: 22 },
      { id: 'flag', label: 'Blue flag', x: 104, y: 84, r: 18 },
      { id: 'buoy', label: 'Buoy', x: 304, y: 360, r: 18 },
    ],
  },
];

export function paintScene(ctx, scene, activeDiffIds) {
  ctx.clearRect(0, 0, PANEL_W, PANEL_H);
  scene.paint(ctx, activeDiffIds);
}
