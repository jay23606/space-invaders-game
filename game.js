// Game variables
let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let scoreElement = document.getElementById('score');
let livesElement = document.getElementById('lives');
let finalScoreElement = document.getElementById('finalScore');
let lobbyScreen = document.getElementById('lobby');
let gameScreen = document.getElementById('gameScreen');
let gameOverScreen = document.getElementById('gameOver');

// Game states
let gameState = 'lobby'; // lobby, playing, gameOver
let score = 0;
let lives = 3;

// Player variables
let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 30,
    speed: 7,
    color: '#00ff00'
};

// Bullet variables
let bullets = [];
let bulletSpeed = 10;

// Enemy variables
let enemies = [];
let enemyWidth = 40;
let enemyHeight = 30;
let enemySpeed = 1;
let enemyDirection = 1;
let enemyDropDistance = 20;

// Game loop variables
let animationId;

// DOM elements
const startBtn = document.getElementById('startBtn');
const instructionsBtn = document.getElementById('instructionsBtn');
const closeInstructions = document.getElementById('closeInstructions');
const restartBtn = document.getElementById('restartBtn');

// Event listeners
startBtn.addEventListener('click', startGame);
instructionsBtn.addEventListener('click', showInstructions);
closeInstructions.addEventListener('click', hideInstructions);
restartBtn.addEventListener('click', resetGame);

// Keyboard input
let keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Fire bullet with spacebar
    if (e.key === ' ' && gameState === 'playing') {
        fireBullet();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Initialize enemies
function initEnemies() {
    enemies = [];
    const rows = 5;
    const cols = 10;
    const padding = 20;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            enemies.push({
                x: col * (enemyWidth + padding) + 50,
                y: row * (enemyHeight + padding) + 50,
                width: enemyWidth,
                height: enemyHeight,
                color: '#ff0000'
            });
        }
    }
}

// Start the game
function startGame() {
    gameState = 'playing';
    lobbyScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    score = 0;
    lives = 3;
    updateUI();
    initEnemies();
    gameLoop();
}

// Show instructions
function showInstructions() {
    document.getElementById('instructions').classList.remove('hidden');
}

// Hide instructions
function hideInstructions() {
    document.getElementById('instructions').classList.add('hidden');
}

// Fire a bullet
function fireBullet() {
    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 15,
        color: '#00ffff'
    });
}

// Update UI elements
function updateUI() {
    scoreElement.textContent = `Score: ${score}`;
    livesElement.textContent = `Lives: ${lives}`;
}

// Game over function
function gameOver() {
    gameState = 'gameOver';
    cancelAnimationFrame(animationId);
    finalScoreElement.textContent = `Your Score: ${score}`;
    gameOverScreen.classList.remove('hidden');
}

// Reset game state
function resetGame() {
    gameOverScreen.classList.add('hidden');
    startGame();
}

// Main game loop
function gameLoop() {
    if (gameState !== 'playing') return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Move player
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    
    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw player details
    ctx.fillStyle = '#00aa00';
    ctx.fillRect(player.x + 10, player.y - 10, player.width - 20, 10);
    
    // Update and draw bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bulletSpeed;
        
        ctx.fillStyle = bullets[i].color;
        ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
        
        // Remove bullets that go off screen
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
    
    // Update and draw enemies
    let moveDown = false;
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].x += enemySpeed * enemyDirection;
        
        // Check if enemy hits the edge
        if (enemies[i].x <= 0 || enemies[i].x + enemies[i].width >= canvas.width) {
            moveDown = true;
        }
        
        // Draw enemy
        ctx.fillStyle = enemies[i].color;
        ctx.fillRect(enemies[i].x, enemies[i].y, enemies[i].width, enemies[i].height);
        
        // Enemy details (alien face)
        ctx.fillStyle = '#000';
        ctx.fillRect(enemies[i].x + 10, enemies[i].y + 8, 6, 6);
        ctx.fillRect(enemies[i].x + enemyWidth - 16, enemies[i].y + 8, 6, 6);
    }
    
    // Move enemies down if needed
    if (moveDown) {
        enemyDirection *= -1;
        for (let i = 0; i < enemies.length; i++) {
            enemies[i].y += enemyDropDistance;
            
            // Check if enemies reached the bottom
            if (enemies[i].y + enemies[i].height > player.y) {
                gameOver();
                return;
            }
        }
    }
    
    // Bullet-enemy collision detection
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (
                bullets[i] &&
                bullets[i].x < enemies[j].x + enemies[j].width &&
                bullets[i].x + bullets[i].width > enemies[j].x &&
                bullets[i].y < enemies[j].y + enemies[j].height &&
                bullets[i].y + bullets[i].height > enemies[j].y
            ) {
                // Remove bullet and enemy on collision
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 100;
                updateUI();
                
                // Check if all enemies are destroyed
                if (enemies.length === 0) {
                    initEnemies();
                }
                break;
            }
        }
    }
    
    // Player-enemy collision detection
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (
            player.x < enemies[i].x + enemies[i].width &&
            player.x + player.width > enemies[i].x &&
            player.y < enemies[i].y + enemies[i].height &&
            player.y + player.height > enemies[i].y
        ) {
            // Player hit by enemy
            lives--;
            updateUI();
            
            if (lives <= 0) {
                gameOver();
                return;
            }
            
            // Reset enemy position after collision
            enemies.splice(i, 1);
            initEnemies();
        }
    }
    
    // Continue game loop
    animationId = requestAnimationFrame(gameLoop);
}

// Initialize the game
initEnemies();