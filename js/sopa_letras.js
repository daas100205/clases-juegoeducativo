document.addEventListener('DOMContentLoaded', () => {
    if (window.gameAPI) window.gameAPI.checkAuth();

    const gameScore    = document.getElementById('gameScore');
    const boardElement = document.getElementById('board');
    const wordsListEl  = document.getElementById('wordsList');
    const winMessage   = document.getElementById('winMessage');
    const progressFill = document.getElementById('progressFill');
    const foundCountEl = document.getElementById('foundCount');
    const totalCountEl = document.getElementById('totalCount');

    if (window.gameAPI && gameScore) gameScore.textContent = window.gameAPI.getScore();

    const gridSize = 13;

    // Banco amplio de palabras con temáticas variadas
    const wordBank = {
        'Espacio':   ['COHETE', 'ESPACIO', 'PLANETA', 'ESTRELLA', 'GALAXIA', 'LUNA', 'MARTE', 'ORBITA', 'COMETA', 'NEBULOSA', 'SOL', 'SATURNO'],
        'Animales':  ['ELEFANTE', 'DELFIN', 'TIGRE', 'LEON', 'AGUILA', 'BALLENA', 'JAGUAR', 'TORTUGA', 'LORO', 'PANDA'],
        'Ciencias':  ['CELULA', 'ATOMO', 'ENERGIA', 'GRAVEDAD', 'OXIGENO', 'FOSIL', 'VOLCÁN', 'TORNADO', 'CLOROFILA', 'MASA'],
        'Escuela':   ['LAPIZ', 'CUADERNO', 'MOCHILA', 'MAESTRA', 'SALON', 'TAREA', 'LIBRO', 'GOMA', 'TIJERAS', 'REGLA'],
    };

    // Elegir categoría al azar
    const categories = Object.keys(wordBank);
    const category   = categories[Math.floor(Math.random() * categories.length)];
    const allWords   = wordBank[category];

    // Elegir 5 palabras al azar
    const wordsToFind = allWords.sort(() => 0.5 - Math.random()).slice(0, 5);
    const wordsFound  = [];

    // Actualizar título
    const titleEl = document.getElementById('sopaTitle');
    if (titleEl) titleEl.textContent = `Sopa de Letras: ${category}`;
    if (totalCountEl) totalCountEl.textContent = wordsToFind.length;

    let grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));

    const directions = [
        [0, 1], [1, 0], [1, 1], [-1, 1],
        [0, -1], [-1, 0]  // también de derecha a izquierda y de abajo a arriba
    ];

    function placeWord(word) {
        let attempts = 0;
        while (attempts < 200) {
            const dir = directions[Math.floor(Math.random() * 4)]; // Solo las 4 primeras para facilitar
            const rStart = Math.floor(Math.random() * gridSize);
            const cStart = Math.floor(Math.random() * gridSize);
            let canPlace = true;

            for (let i = 0; i < word.length; i++) {
                const r = rStart + i * dir[0];
                const c = cStart + i * dir[1];
                if (r < 0 || r >= gridSize || c < 0 || c >= gridSize ||
                    (grid[r][c] !== '' && grid[r][c] !== word[i])) {
                    canPlace = false;
                    break;
                }
            }

            if (canPlace) {
                for (let i = 0; i < word.length; i++) {
                    grid[rStart + i * dir[0]][cStart + i * dir[1]] = word[i];
                }
                return true;
            }
            attempts++;
        }
        return false;
    }

    // Colocar palabras
    wordsToFind.forEach(word => {
        placeWord(word);
        const li = document.createElement('li');
        li.textContent = word;
        li.id = `word-${word}`;
        wordsListEl.appendChild(li);
    });

    // Llenar huecos
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < gridSize; r++)
        for (let c = 0; c < gridSize; c++)
            if (grid[r][c] === '')
                grid[r][c] = alpha[Math.floor(Math.random() * alpha.length)];

    // Renderizar tablero
    boardElement.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    let isSelecting  = false;
    let selectedCells = [];
    let startCell    = null;

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = grid[r][c];
            cell.dataset.r = r;
            cell.dataset.c = c;

            cell.addEventListener('mousedown', () => startSelection(cell));
            cell.addEventListener('mouseenter', () => continueSelection(cell));

            cell.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startSelection(cell);
            }, { passive: false });

            cell.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const t = e.touches[0];
                const el = document.elementFromPoint(t.clientX, t.clientY);
                if (el && el.classList.contains('cell')) continueSelection(el);
            }, { passive: false });

            boardElement.appendChild(cell);
        }
    }

    document.addEventListener('mouseup', endSelection);
    document.addEventListener('touchend', endSelection);

    function startSelection(cell) {
        if (cell.classList.contains('found')) return;
        isSelecting   = true;
        startCell     = cell;
        selectedCells = [cell];
        cell.classList.add('selected');
    }

    function continueSelection(cell) {
        if (!isSelecting || !startCell || cell.classList.contains('found')) return;

        document.querySelectorAll('.cell.selected').forEach(c => c.classList.remove('selected'));
        startCell.classList.add('selected');
        selectedCells = [startCell];

        const rS = parseInt(startCell.dataset.r), cS = parseInt(startCell.dataset.c);
        const rE = parseInt(cell.dataset.r),       cE = parseInt(cell.dataset.c);
        const rD = rE - rS, cD = cE - cS;
        const rStep = rD === 0 ? 0 : rD / Math.abs(rD);
        const cStep = cD === 0 ? 0 : cD / Math.abs(cD);

        if (Math.abs(rD) === Math.abs(cD) || rD === 0 || cD === 0) {
            const steps = Math.max(Math.abs(rD), Math.abs(cD));
            for (let i = 1; i <= steps; i++) {
                const target = document.querySelector(`.cell[data-r="${rS + rStep * i}"][data-c="${cS + cStep * i}"]`);
                if (target) { target.classList.add('selected'); selectedCells.push(target); }
            }
        }
    }

    function endSelection() {
        if (!isSelecting) return;
        isSelecting = false;

        const word    = selectedCells.map(c => c.textContent).join('');
        const revWord = word.split('').reverse().join('');
        let matched   = null;

        if (wordsToFind.includes(word) && !wordsFound.includes(word))          matched = word;
        else if (wordsToFind.includes(revWord) && !wordsFound.includes(revWord)) matched = revWord;

        if (matched) {
            wordsFound.push(matched);
            selectedCells.forEach(c => { c.classList.remove('selected'); c.classList.add('found'); });
            document.getElementById(`word-${matched}`).classList.add('found-word');
            updateProgress();
            if (wordsFound.length === wordsToFind.length) handleWin();
        } else {
            selectedCells.forEach(c => c.classList.remove('selected'));
        }

        selectedCells = [];
        startCell     = null;
    }

    function updateProgress() {
        const pct = (wordsFound.length / wordsToFind.length) * 100;
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (foundCountEl) foundCountEl.textContent = wordsFound.length;
    }

    function handleWin() {
        winMessage.classList.add('show');
        if (window.gameAPI) {
            window.gameAPI.addPoints(50, 'sopa');
            if (gameScore) gameScore.textContent = window.gameAPI.getScore();
        }
    }
});
