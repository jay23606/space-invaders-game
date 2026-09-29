const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
const ui = { lobby: $('lobby'), game: $('gameScreen'), over: $('gameOver'), score: $('score'), lives: $('lives'), level: $('level'), final: $('finalScore'), status: $('connectionStatus'), signal: $('signalBox'), label: $('signalLabel'), actions: $('signalActions'), pause: $('pauseOverlay') };
let mode = 'solo', state = 'lobby', score = 0, lives = 3, wave = 1, enemies = [], bullets = [], players = [], keys = {}, raf = 0, paused = false, last = 0, peer = null, channel = null;
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function status(text) { ui.status.textContent = text; }
function setSignalMode(joining) { ui.signal.classList.remove('hidden'); ui.label.classList.remove('hidden'); ui.actions.classList.remove('hidden'); $('connectBtn').textContent = joining ? 'CONNECT' : 'SET ANSWER'; status(joining ? 'Paste the host code, then connect.' : 'Share your host code. Paste the guest code afterward.'); }
function encode(value) { return btoa(unescape(encodeURIComponent(JSON.stringify(value)))); }
function decode(value) { return JSON.parse(decodeURIComponent(escape(atob(value.trim())))); }
async function waitForIce(pc) { if (pc.iceGatheringState === 'complete') return; await new Promise(resolve => { const done = () => { if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', done); resolve(); } }; pc.addEventListener('icegatheringstatechange', done); setTimeout(resolve, 5000); }); }
function makePeer(host) {
    peer = new RTCPeerConnection(ICE);
    peer.onconnectionstatechange = () => { if (['failed', 'disconnected', 'closed'].includes(peer.connectionState)) status('Peer disconnected.'); };
    if (host) {
        channel = peer.createDataChannel('invaders');
        setupChannel();
    } else peer.ondatachannel = event => { channel = event.channel; setupChannel(); };
    return peer;
}
function setupChannel() {
    channel.onopen = () => { status('Connected! Two-player co-op ready.'); if (mode === 'guest') channel.send(JSON.stringify({ type: 'ready' })); };
    channel.onmessage = event => { const msg = JSON.parse(event.data); if (mode === 'host') { if (msg.type === 'input') { players[1].left = msg.left; players[1].right = msg.right; } if (msg.type === 'fire') fire(1); } else if (msg.type === 'state') applyState(msg); };
}
async function hostGame() { mode = 'host'; makePeer(true); const offer = await peer.createOffer(); await peer.setLocalDescription(offer); await waitForIce(peer); ui.signal.value = encode(peer.localDescription); setSignalMode(false); }
async function joinGame() { mode = 'guest'; makePeer(false); setSignalMode(true); }
async function connectSignal() {
    try {
        const signal = decode(ui.signal.value);
        if (mode === 'guest') { await peer.setRemoteDescription(signal); const answer = await peer.createAnswer(); await peer.setLocalDescription(answer); await waitForIce(peer); ui.signal.value = encode(peer.localDescription); status('Share this answer code with the host.'); }
        else { await peer.setRemoteDescription(signal); status('Connecting to guest…'); }
    } catch (error) { status('Invalid connection code. Copy it exactly.'); }
}
async function copySignal() { try { await navigator.clipboard.writeText(ui.signal.value); status('Connection code copied.'); } catch { status('Select and copy the connection code manually.'); } }
function initEnemies() { enemies = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) enemies.push({ x: 50 + c * 60, y: 55 + r * 45, w: 40, h: 28 }); }
function startGame() { state = 'playing'; paused = false; score = 0; lives = 3; wave = 1; bullets = []; players = [{ x: 250, y: 545, color: '#50f5a9', left: false, right: false }, ...(mode === 'host' && channel ? [{ x: 550, y: 545, color: '#5cc8ff', left: false, right: false }] : [])]; initEnemies(); ui.lobby.classList.add('hidden'); ui.game.classList.remove('hidden'); ui.over.classList.add('hidden'); updateUi(); cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop); }
function updateUi() { ui.score.textContent = `Score: ${score}`; ui.lives.textContent = `Lives: ${lives}`; ui.level.textContent = `Wave: ${wave}`; }
function fire(player = 0) { if (state !== 'playing' || paused || !players[player]) return; const p = players[player]; if (bullets.filter(b => b.owner === player).length >= 3) return; bullets.push({ x: p.x + 21, y: p.y, owner: player }); }
function hit(a, b) { return a.x < b.x + b.w && a.x + 4 > b.x && a.y < b.y + b.h && a.y + 15 > b.y; }
function drawPlayer(p) { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 42, 20); ctx.fillRect(p.x + 14, p.y - 10, 14, 10); }
function applyState(msg) { if (state !== 'playing') startGame(); score = msg.score; lives = msg.lives; wave = msg.wave; enemies = msg.enemies; players = msg.players; bullets = msg.bullets; updateUi(); }
function sendState() { if (channel?.readyState === 'open') channel.send(JSON.stringify({ type: 'state', score, lives, wave, enemies, bullets, players })); }
function finish(won = false) { state = 'over'; cancelAnimationFrame(raf); ui.over.classList.remove('hidden'); $('gameOverTitle').textContent = won ? 'WAVE CLEAR!' : 'GAME OVER'; $('resultLabel').textContent = won ? 'MISSION COMPLETE' : 'MISSION FAILED'; ui.final.textContent = `Team score: ${score}`; }
function loop(now) { if (state !== 'playing') return; const dt = Math.min((now - last) / 16.67, 2); last = now; if (!paused) { if (mode !== 'guest') update(dt); draw(); } raf = requestAnimationFrame(loop); }
function update(dt) {
    players.forEach((p, i) => { if (p.left) p.x -= 7 * dt; if (p.right) p.x += 7 * dt; p.x = Math.max(0, Math.min(canvas.width - 42, p.x)); });
    bullets.forEach(b => b.y -= 11 * dt); bullets = bullets.filter(b => b.y > -20);
    let edge = enemies.some(e => e.x <= 0 || e.x + e.w >= canvas.width); if (edge) enemies.forEach(e => { e.y += 18; });
    const direction = edge ? -1 : 1; enemies.forEach(e => e.x += direction * (0.7 + wave * .12) * dt);
    for (let i = bullets.length - 1; i >= 0; i--) for (let j = enemies.length - 1; j >= 0; j--) if (hit(bullets[i], enemies[j])) { score += 10; bullets.splice(i, 1); enemies.splice(j, 1); break; }
    if (enemies.some(e => e.y + e.h >= players[0].y)) return finish();
    if (!enemies.length) { wave++; initEnemies(); }
    updateUi(); sendState();
}
function draw() { ctx.fillStyle = '#050816'; ctx.fillRect(0, 0, canvas.width, canvas.height); enemies.forEach((e, i) => { ctx.fillStyle = i % 2 ? '#ff6b9d' : '#ffcb6b'; ctx.fillRect(e.x, e.y, e.w, e.h); ctx.fillStyle = '#050816'; ctx.fillRect(e.x + 9, e.y + 8, 6, 6); ctx.fillRect(e.x + 25, e.y + 8, 6, 6); }); players.forEach(drawPlayer); bullets.forEach(b => { ctx.fillStyle = b.owner ? '#5cc8ff' : '#50f5a9'; ctx.fillRect(b.x, b.y, 4, 15); }); }
function togglePause() { if (state !== 'playing') return; paused = !paused; ui.pause.classList.toggle('hidden', !paused); $('pauseBtn').textContent = paused ? 'Resume' : 'Pause'; }
function setKey(key, value) { const k = key.toLowerCase(); if (mode === 'guest') { if (['arrowleft', 'a'].includes(k)) players[0].left = value; if (['arrowright', 'd'].includes(k)) players[0].right = value; if (channel?.readyState === 'open') channel.send(JSON.stringify({ type: 'input', left: players[0].left, right: players[0].right })); } else { if (['arrowleft', 'a'].includes(k)) players[0].left = value; if (['arrowright', 'd'].includes(k)) players[0].right = value; } }
document.addEventListener('keydown', e => { if (e.repeat) return; if (e.key.toLowerCase() === 'p') return togglePause(); setKey(e.key, true); if (e.code === 'Space') { e.preventDefault(); mode === 'guest' ? channel?.send(JSON.stringify({ type: 'fire' })) : fire(0); } });
document.addEventListener('keyup', e => setKey(e.key, false));
$('startBtn').onclick = () => { mode = 'solo'; startGame(); }; $('hostBtn').onclick = hostGame; $('joinBtn').onclick = joinGame; $('connectBtn').onclick = connectSignal; $('copySignalBtn').onclick = copySignal; $('instructionsBtn').onclick = () => $('instructions').classList.remove('hidden'); $('closeInstructions').onclick = () => $('instructions').classList.add('hidden'); $('pauseBtn').onclick = togglePause; $('resumeBtn').onclick = togglePause; $('restartBtn').onclick = startGame; $('menuBtn').onclick = () => { state = 'lobby'; ui.game.classList.add('hidden'); ui.lobby.classList.remove('hidden'); };
[['leftBtn', 'ArrowLeft'], ['rightBtn', 'ArrowRight']].forEach(([id, key]) => { const b = $(id); b.onpointerdown = () => setKey(key, true); b.onpointerup = b.onpointercancel = () => setKey(key, false); }); $('fireBtn').onpointerdown = () => mode === 'guest' ? channel?.send(JSON.stringify({ type: 'fire' })) : fire(0);
