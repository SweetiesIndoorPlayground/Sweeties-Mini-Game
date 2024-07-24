const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerNameInput = document.getElementById('playerNameInput');

let birdImg, pipeImg, bgImg;
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

let audioContext;
let jumpBuffer, scoreBuffer, gameOverBuffer;

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
console.log('Running on iOS:', isIOS);

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    function loadSound(url) {
        return fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer));
    }

    Promise.all([
        loadSound('jump.mp3'),
        loadSound('score.mp3'),
        loadSound('gameover.mp3')
    ]).then(([jump, score, gameOver]) => {
        jumpBuffer = jump;
        scoreBuffer = score;
        gameOverBuffer = gameOver;
    }).catch(error => console.error('Error loading audio:', error));
}

function playSound(buffer) {
    if (audioContext && buffer) {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
    }
}

document.addEventListener('touchstart', function initAudioOnFirstTouch() {
    initAudio();
    document.removeEventListener('touchstart', initAudioOnFirstTouch);
}, {once: true});

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            console.log(`Image loaded: ${src}`);
            resolve(img);
        };
        img.onerror = (e) => {
            console.error(`Failed to load image: ${src}`, e);
            reject(e);
        };
        img.src = src;
    });
}

Promise.all([
    loadImage('bird.png'),
    loadImage('pipe.png'),
    loadImage('background.png')
]).then(([birdImage, pipeImage, bgImage]) => {
    birdImg = birdImage;
    birdWidth = birdImage.width;
    birdHeight = birdImage.height;
    pipeImg = pipeImage;
    bgImg = bgImage;
    
    bird.width = birdWidth * BIRD_SCALE;
    bird.height = birdHeight * BIRD_SCALE;
    
    console.log('All images loaded, starting game loop');
    gameLoop();
}).catch(error => {
    console.error("Error loading game assets:", error);
});

function startGame() {
    console.log('Starting game');
    playerName = playerNameInput.value.trim() || 'Player';
    playerNameInput.style.display = 'none';
    resetGame();
    gameStarted = true;
    isEnteringName = false;
}

function restartGame() {
    console.log('Restarting game');
    resetGame();
    gameStarted = false;
    isEnteringName = true;
    playerName = '';
    playerNameInput.value = '';
    playerNameInput.style.display = 'block';
}

function resetGame() {
    console.log('Resetting game');
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
    console.log('Game loop starting');
    update();
    draw();
    requestAnimationFrame(gameLoop);
    console.log('Game loop completed');
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
            playSound(scoreBuffer);
            
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
    console.log('Increasing difficulty');
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
    
    playerNameInput.style.display = 'block';
    
    ctx.font = '16px Arial';
    ctx.fillText('Touch outside input to start', canvas.width / 2, canvas.height / 2 + 40);
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
    playSound(jumpBuffer);
}

function endGame() {
    if (frames < 10) return;
    console.log('Game over');
    gameOver = true;
    playSound(gameOverBuffer);
}

function handleTouch(event) {
    event.preventDefault();
    if (isEnteringName) {
        if (event.target !== playerNameInput) {
            startGame();
        }
    } else if (gameOver) {
        restartGame();
    } else {
        jump();
    }
}

canvas.addEventListener('touchstart', handleTouch, {passive: false});
canvas.addEventListener('touchend', handleTouch, {passive: false});

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

window.onerror = function(message, source, lineno, colno, error) {
    console.error('Unhandled error:', message, source, lineno, colno, error);
};

console.log('Game script loaded');
