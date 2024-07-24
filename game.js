const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let birdImg, pipeImg, bgImg;
let jumpSound, scoreSound, gameOverSound;
let birdWidth, birdHeight;
let playerName = '';

const BIRD_SCALE = 0.5;
const INITIAL_PIPE_GAP = 120;
const INITIAL_PIPE_SPEED = 2;

const bird = {
    x: 50,
    y: 0,
    width: 0,
    height: 0,
    velocity: 0,
    gravity: 0.3,
    jump: -6
};

let pipes = [];
let score = 0;
let gameOver = false;
let gameStarted = false;
let frames = 0;
let isEnteringName = true;
let pipeGap = INITIAL_PIPE_GAP;
let pipeSpeed = INITIAL_PIPE_SPEED;
let difficulty = 1;

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function loadSound(src) {
    return new Promise((resolve, reject) => {
        const sound = new Audio(src);
        sound.oncanplaythrough = () => resolve(sound);
        sound.onerror = reject;
        sound.src = src;
    });
}

Promise.all([
    loadImage('bird.png'),
    loadImage('pipe.png'),
    loadImage('background.png'),
    loadSound('jump.mp3'),
    loadSound('score.mp3'),
    loadSound('gameover.mp3')
]).then(([birdImage, pipeImage, bgImage, jumpAudio, scoreAudio, gameOverAudio]) => {
    birdImg = birdImage;
    birdWidth = birdImage.width;
    birdHeight = birdImage.height;
    pipeImg = pipeImage;
    bgImg = bgImage;
    jumpSound = jumpAudio;
    scoreSound = scoreAudio;
    gameOverSound = gameOverAudio;
    
    bird.width = birdWidth * BIRD_SCALE;
    bird.height = birdHeight * BIRD_SCALE;
    
    gameLoop();
}).catch(error => {
    console.error("Error loading game assets:", error);
});

function startGame() {
    resetGame();
    gameStarted = true;
    isEnteringName = false;
}

function restartGame() {
    resetGame();
    gameStarted = false;
    isEnteringName = true;
    playerName = '';
}

function resetGame() {
    bird.y = canvas.height / 2 - bird.height / 2;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    gameOver = false;
    frames = 0;
    pipeGap = INITIAL_PIPE_GAP;
    pipeSpeed = INITIAL_PIPE_SPEED;
    difficulty = 1;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (isEnteringName || gameOver) return;

    frames++;

    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    if (frames > 100 && frames % 150 === 0) {
        const pipeHeight = canvas.height;
        const topPipeBottom = Math.random() * (canvas.height - pipeGap - 200) + 100;

        pipes.push({
            x: canvas.width,
            y: topPipeBottom,
            width: 52,
            height: pipeHeight,
            passed: false
        });
    }

    pipes.forEach((pipe, index) => {
        pipe.x -= pipeSpeed;

        if (pipe.x + pipe.width < 0) {
            pipes.splice(index, 1);
        }

        if (pipe.x + pipe.width < bird.x && !pipe.passed) {
            pipe.passed = true;
            score++;
            scoreSound.play();
            
            if (score % 5 === 0) {
                increaseDifficulty();
            }
        }

        if (
            bird.x < pipe.x + pipe.width &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.y || bird.y + bird.height > pipe.y + pipeGap)
        ) {
            endGame();
        }
    });

    if (bird.y + bird.height > canvas.height) {
        endGame();
    }
}

function increaseDifficulty() {
    difficulty++;
    pipeSpeed += 0.5;
    pipeGap = Math.max(INITIAL_PIPE_GAP - (difficulty - 1) * 5, 70);
}

function draw() {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    if (isEnteringName) {
        drawNameInput();
    } else if (gameOver) {
        drawGameOver();
    } else {
        pipes.forEach(pipe => {
            ctx.save();
            ctx.scale(1, -1);
            ctx.drawImage(pipeImg, pipe.x, -pipe.y, pipe.width, pipe.height);
            ctx.restore();

            ctx.drawImage(pipeImg, pipe.x, pipe.y + pipeGap, pipe.width, pipe.height);
        });

        ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

        drawScore();
    }
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Difficulty: ${difficulty}`, 10, 60);
}

function drawNameInput() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Enter Your Name:', canvas.width / 2, canvas.height / 2 - 40);
    
    const displayName = playerName.length > 15 ? playerName.slice(0, 15) + '...' : playerName;
    ctx.fillText(displayName + '|', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '16px Arial';
    ctx.fillText('Touch to start', canvas.width / 2, canvas.height / 2 + 40);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60);
    
    ctx.font = '20px Arial';
    const displayName = playerName.length > 15 ? playerName.slice(0, 15) + '...' : playerName;
    ctx.fillText(`Player: ${displayName}`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(`Difficulty: ${difficulty}`, canvas.width / 2, canvas.height / 2 + 50);
    
    ctx.font = '16px Arial';
    ctx.fillText('Touch to restart', canvas.width / 2, canvas.height / 2 + 90);
}

function jump() {
    if (gameOver || isEnteringName) return;
    bird.velocity = bird.jump;
    jumpSound.play();
}

function endGame() {
    if (frames < 10) return;
    gameOver = true;
    gameOverSound.play();
}

function getTouchPos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.touches[0].clientX - rect.left) * scaleX,
        y: (evt.touches[0].clientY - rect.top) * scaleY
    };
}

canvas.addEventListener('touchstart', event => {
    event.preventDefault();
    const touchPos = getTouchPos(canvas, event);
    if (isEnteringName) {
        startGame();
    } else if (gameOver) {
        restartGame();
    } else {
        jump();
    }
});

function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const canvas = document.getElementById('gameCanvas');
    const aspectRatio = canvas.width / canvas.height;
    const newWidth = container.clientWidth;
    const newHeight = newWidth / aspectRatio;
    
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
