document.addEventListener('DOMContentLoaded', () => {
    if (window.gameAPI) window.gameAPI.checkAuth();

    const gameScore    = document.getElementById('gameScore');
    const rocketFigure = document.getElementById('rocketFigure');
    const damageBar    = document.getElementById('damageBar');
    const categoryHint = document.getElementById('categoryHint');
    const wordDisplay  = document.getElementById('wordDisplay');
    const keyboard     = document.getElementById('keyboard');
    const resultMsg    = document.getElementById('resultMsg');
    const playAgainRow = document.getElementById('playAgainRow');
    const nextWordBtn  = document.getElementById('nextWordBtn');

    if (window.gameAPI && gameScore) gameScore.textContent = window.gameAPI.getScore();

    const wordBank = [
        { category: 'Astro', word: 'ASTRONAUTA' },
        { category: 'Planeta', word: 'JUPITER' },
        { category: 'Cuerpo Celeste', word: 'METEORITO' },
        { category: 'Ciencia', word: 'GRAVEDAD' },
        { category: 'Vehículo', word: 'TRANSBORDADOR' },
        { category: 'Animal', word: 'TORTUGA' },
        { category: 'Astro', word: 'SATELITE' },
        { category: 'Naturaleza', word: 'VOLCAN' },
        { category: 'Materia', word: 'OXIGENO' }
    ];

    let currentItem = null;
    let guessedLetters = [];
    let maxLives = 6;
    let lives = maxLives;
    let isGameOver = false;

    // Estados del cohete según las vidas
    const rocketStates = [
        '💥', // 0 vidas
        '🔥', // 1 vida
        '☄️', // 2 vidas
        '🛰️', // 3 vidas
        '🛸', // 4 vidas
        '🚀', // 5 vidas
        '🚀✨' // 6 vidas (intacto)
    ];

    function initGame() {
        isGameOver = false;
        lives = maxLives;
        guessedLetters = [];
        resultMsg.textContent = '';
        resultMsg.className = 'result-msg';
        playAgainRow.style.display = 'none';

        // Escoger palabra al azar
        currentItem = wordBank[Math.floor(Math.random() * wordBank.length)];
        
        categoryHint.textContent = `Pista: ${currentItem.category}`;
        rocketFigure.textContent = rocketStates[lives];
        
        drawDamageBar();
        drawWord();
        drawKeyboard();
    }

    function drawDamageBar() {
        damageBar.innerHTML = '';
        for (let i = 0; i < maxLives; i++) {
            const dot = document.createElement('div');
            dot.className = 'life-dot';
            if (i >= lives) dot.classList.add('lost');
            damageBar.appendChild(dot);
        }
    }

    function drawWord() {
        wordDisplay.innerHTML = '';
        const wordArr = currentItem.word.split('');
        
        wordArr.forEach(char => {
            const box = document.createElement('div');
            box.className = 'letter-box';
            if (char === ' ') {
                box.classList.add('space-char');
            } else {
                if (guessedLetters.includes(char)) {
                    box.textContent = char;
                    box.classList.add('revealed');
                } else {
                    box.textContent = '';
                }
            }
            wordDisplay.appendChild(box);
        });
    }

    function drawKeyboard() {
        keyboard.innerHTML = '';
        const layout = 'QWERTYUIOPASDFGHJKLÑZXCVBNM';
        layout.split('').forEach(char => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = char;
            
            if (guessedLetters.includes(char)) {
                btn.disabled = true;
                if (currentItem.word.includes(char)) {
                    btn.classList.add('correct');
                } else {
                    btn.classList.add('wrong');
                }
            }

            btn.addEventListener('click', () => handleGuess(char));
            keyboard.appendChild(btn);
        });
    }

    function handleGuess(char) {
        if (isGameOver || guessedLetters.includes(char)) return;

        guessedLetters.push(char);

        if (currentItem.word.includes(char)) {
            // Acierto
            drawWord();
            drawKeyboard();
            checkWin();
        } else {
            // Fallo
            lives--;
            rocketFigure.textContent = rocketStates[lives];
            rocketFigure.style.transform = `rotate(${(maxLives - lives) * 15}deg)`;
            setTimeout(() => rocketFigure.style.transform = 'none', 300);
            
            drawDamageBar();
            drawKeyboard();
            checkLose();
        }
    }

    function checkWin() {
        const wordArr = currentItem.word.split('').filter(c => c !== ' ');
        const allGuessed = wordArr.every(char => guessedLetters.includes(char));

        if (allGuessed) {
            isGameOver = true;
            resultMsg.textContent = '¡Palabra Descubierta! +30 Puntos ⭐';
            resultMsg.classList.add('win');
            playAgainRow.style.display = 'flex';
            
            // Animación victoria
            rocketFigure.style.transform = 'translateY(-30px) scale(1.2)';
            
            if (window.gameAPI) {
                window.gameAPI.addPoints(30, 'ahorcado');
                if (gameScore) gameScore.textContent = window.gameAPI.getScore();
            }
        }
    }

    function checkLose() {
        if (lives <= 0) {
            isGameOver = true;
            resultMsg.textContent = `¡Oh no! La palabra era: ${currentItem.word}`;
            resultMsg.classList.add('lose');
            playAgainRow.style.display = 'flex';
            
            // Mostrar palabra completa
            wordDisplay.innerHTML = '';
            currentItem.word.split('').forEach(char => {
                const box = document.createElement('div');
                box.className = 'letter-box';
                if (char === ' ') {
                    box.classList.add('space-char');
                } else {
                    box.textContent = char;
                    if (!guessedLetters.includes(char)) box.style.color = '#e74c3c';
                }
                wordDisplay.appendChild(box);
            });
            
            // Animación derrota
            rocketFigure.style.transform = 'translateY(20px) rotate(180deg)';
        }
    }

    nextWordBtn.addEventListener('click', initGame);

    // Soporte teclado físico
    document.addEventListener('keydown', (e) => {
        if (isGameOver) return;
        const key = e.key.toUpperCase();
        if (/^[A-ZÑ]$/.test(key)) {
            handleGuess(key);
        }
    });

    initGame();
});
