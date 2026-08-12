document.addEventListener('DOMContentLoaded', () => {
    if (window.gameAPI) window.gameAPI.checkAuth();

    const gameScore = document.getElementById('gameScore');
    if (window.gameAPI && gameScore) {
        gameScore.textContent = window.gameAPI.getScore();
    }

    const boardElement = document.getElementById('board');
    const horizontalCluesElement = document.getElementById('horizontalClues');
    const verticalCluesElement = document.getElementById('verticalClues');
    const checkBtn = document.getElementById('checkBtn');
    const winMessage = document.getElementById('winMessage');

    // -------------------------------------------------------
    // Banco de crucigramas. Cada uno tiene palabras colocadas
    // manualmente sobre un grid de 12x12.
    // row/col son índices base-0.
    // -------------------------------------------------------
    const puzzles = [
        {
            label: 'Espacio',
            gridSize: 12,
            words: [
                { id:1, word:'COHETE',    row:0, col:0, dir:'H', clue:'Vehículo que viaja al espacio.' },
                { id:2, word:'COSMOS',    row:0, col:0, dir:'V', clue:'Otro nombre para el universo.' },
                { id:3, word:'ORBITA',    row:2, col:3, dir:'H', clue:'Trayectoria de un planeta alrededor del Sol.' },
                { id:4, word:'MARTE',     row:0, col:5, dir:'V', clue:'El planeta rojo.' },
                { id:5, word:'ESTRELLA',  row:5, col:1, dir:'H', clue:'Astro que emite luz propia.' },
                { id:6, word:'SOL',       row:5, col:5, dir:'V', clue:'Estrella centro de nuestro sistema.' },
                { id:7, word:'LUNA',      row:8, col:3, dir:'H', clue:'Satélite natural de la Tierra.' },
                { id:8, word:'GALAXIA',   row:10, col:0, dir:'H', clue:'Sistema de millones de estrellas.' },
            ]
        },
        {
            label: 'Ciencias',
            gridSize: 12,
            words: [
                { id:1, word:'CIENCIA',   row:0, col:1, dir:'H', clue:'Estudio del mundo natural.' },
                { id:2, word:'CELULA',    row:0, col:2, dir:'V', clue:'Unidad básica de la vida.' },
                { id:3, word:'ENERGIA',   row:3, col:0, dir:'H', clue:'Capacidad de realizar trabajo.' },
                { id:4, word:'AGUA',      row:0, col:7, dir:'V', clue:'Líquido esencial para la vida, H₂O.' },
                { id:5, word:'GRAVEDAD',  row:6, col:2, dir:'H', clue:'Fuerza que nos mantiene en la Tierra.' },
                { id:6, word:'ATOMO',     row:3, col:7, dir:'V', clue:'Partícula más pequeña de un elemento.' },
                { id:7, word:'LUZ',       row:10, col:0, dir:'H', clue:'Radiación que hace que veamos los colores.' },
            ]
        },
        {
            label: 'Animales',
            gridSize: 12,
            words: [
                { id:1, word:'ELEFANTE',  row:0, col:0, dir:'H', clue:'El animal terrestre más grande.' },
                { id:2, word:'EAGLE',     row:0, col:4, dir:'V', clue:'(En inglés) Águila.' },
                { id:3, word:'DELFIN',    row:3, col:2, dir:'H', clue:'Mamífero marino muy inteligente.' },
                { id:4, word:'LEON',      row:0, col:0, dir:'V', clue:'Rey de la selva.' },
                { id:5, word:'TIGRE',     row:6, col:1, dir:'H', clue:'Felino rayado más grande del mundo.' },
                { id:6, word:'BALLENA',   row:9, col:0, dir:'H', clue:'Animal más grande del planeta.' },
                { id:7, word:'NIDO',      row:3, col:7, dir:'V', clue:'Hogar de las aves.' },
            ]
        }
    ];

    // Elegir crucigrama al azar
    const currentPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    const gridSize = currentPuzzle.gridSize;

    // Construir grid de datos
    let grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));

    // Para evitar colisiones, sólo colocar letras si la celda está vacía o tiene la misma letra
    const validWords = [];
    currentPuzzle.words.forEach(w => {
        let canPlace = true;
        for (let i = 0; i < w.word.length; i++) {
            const r = w.row + (w.dir === 'V' ? i : 0);
            const c = w.col + (w.dir === 'H' ? i : 0);
            if (r >= gridSize || c >= gridSize) { canPlace = false; break; }
            if (grid[r][c] && grid[r][c].letter !== w.word[i]) { canPlace = false; break; }
        }
        if (canPlace) {
            for (let i = 0; i < w.word.length; i++) {
                const r = w.row + (w.dir === 'V' ? i : 0);
                const c = w.col + (w.dir === 'H' ? i : 0);
                if (!grid[r][c]) grid[r][c] = { letter: w.word[i], num: null };
                if (i === 0) grid[r][c].num = w.id;
            }
            validWords.push(w);
        }
    });

    // Mostrar label del crucigrama
    const titleEl = document.querySelector('.title-glow');
    if (titleEl) titleEl.textContent = `Crucigrama: ${currentPuzzle.label}`;

    // Renderizar tablero
    boardElement.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    const inputs = [];

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cellWrapper = document.createElement('div');
            cellWrapper.className = 'cell-wrapper';

            const cellData = grid[r][c];

            if (cellData) {
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.className = 'cell';
                input.dataset.r = r;
                input.dataset.c = c;
                input.dataset.letter = cellData.letter;

                inputs.push(input);

                input.addEventListener('keydown', function(e) {
                    // Borrar con Backspace
                    if (e.key === 'Backspace' && this.value === '') {
                        const idx = inputs.indexOf(this);
                        if (idx > 0) inputs[idx - 1].focus();
                    }
                });

                input.addEventListener('input', function() {
                    this.value = this.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 1);
                    if (this.value.length === 1) {
                        const idx = inputs.indexOf(this);
                        if (idx + 1 < inputs.length) inputs[idx + 1].focus();
                    }
                });

                // Seleccionar todo el contenido al hacer click
                input.addEventListener('click', function() { this.select(); });

                if (cellData.num) {
                    const numDiv = document.createElement('div');
                    numDiv.className = 'cell-num';
                    numDiv.textContent = cellData.num;
                    cellWrapper.appendChild(numDiv);
                }

                cellWrapper.appendChild(input);
            } else {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'cell empty';
                cellWrapper.appendChild(emptyCell);
            }

            boardElement.appendChild(cellWrapper);
        }
    }

    // Renderizar pistas
    validWords.forEach(w => {
        const p = document.createElement('p');
        p.className = 'clue-item';
        p.innerHTML = `<span>${w.id}.</span> ${w.clue}`;
        if (w.dir === 'H') {
            horizontalCluesElement.appendChild(p);
        } else {
            verticalCluesElement.appendChild(p);
        }
    });

    // Verificar respuestas
    checkBtn.addEventListener('click', () => {
        let allCorrect = true;
        let emptyCount = 0;
        let wrongCount = 0;

        inputs.forEach(input => {
            if (input.classList.contains('correct')) return; // ya correcta, saltar

            const correctLetter = input.dataset.letter;
            const userLetter = input.value.toUpperCase();

            if (!userLetter) {
                emptyCount++;
                allCorrect = false;
            } else if (userLetter === correctLetter) {
                input.classList.add('correct');
            } else {
                wrongCount++;
                allCorrect = false;
                input.classList.add('wrong-input');
                setTimeout(() => {
                    input.classList.remove('wrong-input');
                    input.value = '';
                }, 600);
            }
        });

        if (emptyCount > 0 && wrongCount === 0) {
            // Solo faltan campos vacíos
            // No interrumpir, dejar continuar
        }

        if (allCorrect && inputs.every(i => i.classList.contains('correct'))) {
            winMessage.classList.add('show');
            checkBtn.style.display = 'none';
            if (window.gameAPI) {
                window.gameAPI.addPoints(40, 'crucigrama');
                gameScore.textContent = window.gameAPI.getScore();
            }
        } else if (wrongCount > 0) {
            const fbEl = document.getElementById('feedbackCrucigrama');
            if (fbEl) {
                fbEl.textContent = `${wrongCount} respuesta(s) incorrecta(s) borrada(s). ¡Intenta de nuevo!`;
                fbEl.style.color = '#e74c3c';
                fbEl.className = 'feedback-anim';
                setTimeout(() => fbEl.textContent = '', 2500);
            }
        }
    });
});
