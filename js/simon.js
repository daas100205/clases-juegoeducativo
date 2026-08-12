document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (window.gameAPI) window.gameAPI.checkAuth();
    
    // Configurar header
    const displayName = document.getElementById('displayName');
    const gameScore = document.getElementById('gameScore');
    
    if (displayName && window.gameAPI) displayName.textContent = window.gameAPI.getName();
    if (gameScore && window.gameAPI) gameScore.textContent = window.gameAPI.getScore();

    // Elementos del juego
    const simonBoard = document.getElementById('simonBoard');
    const startBtn = document.getElementById('startSimonBtn');
    const gameMessage = document.getElementById('gameMessage');
    const levelDisplay = document.getElementById('levelDisplay');
    const pads = [
        document.getElementById('pad-0'),
        document.getElementById('pad-1'),
        document.getElementById('pad-2'),
        document.getElementById('pad-3')
    ];

    // Variables de estado
    let sequence = [];
    let playerSequence = [];
    let level = 0;
    let isPlaying = false;
    let isPlayerTurn = false;

    // Web Audio API para sonidos
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;

    const padFrequencies = [261.63, 329.63, 392.00, 523.25]; // Notas musicales para cada pad

    function playTone(padIndex) {
        if (!audioCtx) audioCtx = new AudioContext();
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine'; // Sonido suave estilo espacial
        osc.frequency.setValueAtTime(padFrequencies[padIndex], audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }

    // Iniciar Juego
    startBtn.addEventListener('click', () => {
        if (isPlaying) return;
        
        // Inicializar audio en la primera interacción
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        startGame();
    });

    function startGame() {
        sequence = [];
        playerSequence = [];
        level = 0;
        isPlaying = true;
        startBtn.disabled = true;
        startBtn.classList.add('disabled');
        nextLevel();
    }

    function nextLevel() {
        level++;
        playerSequence = [];
        levelDisplay.textContent = level;
        gameMessage.textContent = 'Observa la secuencia...';
        gameMessage.style.color = '#fff';
        
        // Añadir nuevo paso
        const nextPad = Math.floor(Math.random() * 4);
        sequence.push(nextPad);
        
        isPlayerTurn = false;
        
        // Reproducir secuencia
        setTimeout(() => {
            playSequence();
        }, 800);
    }

    function playSequence() {
        let i = 0;
        const interval = setInterval(() => {
            const padIndex = sequence[i];
            activatePad(padIndex);
            
            i++;
            if (i >= sequence.length) {
                clearInterval(interval);
                setTimeout(() => {
                    isPlayerTurn = true;
                    gameMessage.textContent = '¡Tu turno! Repite la secuencia.';
                    gameMessage.style.color = '#00ff66';
                }, 500);
            }
        }, 800 - Math.min(level * 30, 400)); // Se acelera ligeramente cada nivel
    }

    function activatePad(index) {
        const pad = pads[index];
        pad.classList.add('active');
        playTone(index);
        
        setTimeout(() => {
            pad.classList.remove('active');
        }, 300);
    }

    // Manejar clics del jugador
    pads.forEach((pad, index) => {
        pad.addEventListener('click', () => {
            if (!isPlaying || !isPlayerTurn) return;
            
            activatePad(index);
            playerSequence.push(index);
            
            checkSequence(playerSequence.length - 1);
        });
    });

    function checkSequence(currentStep) {
        // ¿Se equivocó?
        if (playerSequence[currentStep] !== sequence[currentStep]) {
            gameOver();
            return;
        }
        
        // ¿Completó la secuencia actual?
        if (playerSequence.length === sequence.length) {
            isPlayerTurn = false;
            
            // Puntos: 10 puntos por nivel completado
            if (window.gameAPI) {
                window.gameAPI.addPoints(10, 'simon');
                gameScore.textContent = window.gameAPI.getScore();
            }
            
            gameMessage.textContent = '¡Correcto! ¡Prepárate para el siguiente nivel!';
            gameMessage.style.color = '#33ccff';
            
            setTimeout(() => {
                nextLevel();
            }, 1000);
        }
    }

    function gameOver() {
        isPlaying = false;
        isPlayerTurn = false;
        
        // Sonido de error
        if (audioCtx) {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        }

        // Animación de error
        simonBoard.classList.add('error-shake');
        pads.forEach(p => p.style.backgroundColor = '#ff0000');
        
        setTimeout(() => {
            simonBoard.classList.remove('error-shake');
            // Restaurar colores originales (quitando el estilo en línea)
            pads.forEach(p => p.style.backgroundColor = '');
        }, 500);

        gameMessage.innerHTML = `¡Oh no! Secuencia incorrecta. Llegaste al nivel ${level}. <br> Ganaste ${level > 1 ? (level-1)*10 : 0} puntos.`;
        gameMessage.style.color = '#ff3366';
        levelDisplay.textContent = 'X';
        
        startBtn.disabled = false;
        startBtn.classList.remove('disabled');
        startBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Volver a Intentar';
    }
});
