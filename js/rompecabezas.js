document.addEventListener('DOMContentLoaded', () => {
    if (window.gameAPI) window.gameAPI.checkAuth();

    const gameScore = document.getElementById('gameScore');
    if (window.gameAPI && gameScore) gameScore.textContent = window.gameAPI.getScore();

    // --- Imágenes prediseñadas (Unsplash libres de derechos) ---
    const presetImages = [
        { src: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=600', label: 'Tierra' },
        { src: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600', label: 'Puente' },
        { src: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600', label: 'Colores' },
        { src: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600', label: 'Perrito' },
        { src: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600', label: 'Gato' },
        { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600', label: 'Naturaleza' },
    ];

    // --- Estado ---
    let selectedImageSrc = null;
    let gridSize = 3;
    let moves = 0;
    let placedPieces = 0;
    let draggedPiece = null;
    let touchDragPiece = null;
    let ghostEl = null;

    // --- Elementos ---
    const gallery        = document.getElementById('gallery');
    const fileInput      = document.getElementById('fileInput');
    const cameraInput    = document.getElementById('cameraInput');
    const startBtn       = document.getElementById('startPuzzleBtn');
    const selectHint     = document.getElementById('selectHint');
    const selectScreen   = document.getElementById('selectScreen');
    const gameScreen     = document.getElementById('gameScreen');
    const refImg         = document.getElementById('refImg');
    const puzzleBoard    = document.getElementById('puzzleBoard');
    const piecesTray     = document.getElementById('piecesTray');
    const winBanner      = document.getElementById('winBanner');
    const backToSelectBtn = document.getElementById('backToSelectBtn');
    const playAgainBtn   = document.getElementById('playAgainBtn');
    const movesEl        = document.getElementById('movesCount');
    const placedEl       = document.getElementById('placedCount');
    const totalEl        = document.getElementById('totalPieces');

    // --- Galería ---
    presetImages.forEach(img => {
        const el = document.createElement('img');
        el.src = img.src;
        el.alt = img.label;
        el.className = 'gallery-img';
        el.title = img.label;
        el.addEventListener('click', () => {
            document.querySelectorAll('.gallery-img').forEach(g => g.classList.remove('chosen'));
            el.classList.add('chosen');
            selectImage(img.src);
        });
        gallery.appendChild(el);
    });

    // --- File inputs ---
    [fileInput, cameraInput].forEach(input => {
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.querySelectorAll('.gallery-img').forEach(g => g.classList.remove('chosen'));
                selectImage(ev.target.result);
            };
            reader.readAsDataURL(file);
        });
    });

    function selectImage(src) {
        selectedImageSrc = src;
        startBtn.disabled = false;
        selectHint.textContent = '✅ Imagen seleccionada. Elige la dificultad y presiona Iniciar.';
        selectHint.style.color = '#2ecc71';
    }

    // --- Dificultad ---
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gridSize = parseInt(btn.dataset.grid);
        });
    });

    // --- Iniciar juego ---
    startBtn.addEventListener('click', () => {
        if (!selectedImageSrc) return;
        buildPuzzle(selectedImageSrc, gridSize);
    });

    backToSelectBtn.addEventListener('click', () => {
        gameScreen.style.display = 'none';
        selectScreen.style.display = '';
    });

    playAgainBtn.addEventListener('click', () => {
        buildPuzzle(selectedImageSrc, gridSize);
    });

    // --- Construir el rompecabezas ---
    function buildPuzzle(src, n) {
        moves = 0; placedPieces = 0;
        if (movesEl)  movesEl.textContent  = 0;
        if (placedEl) placedEl.textContent = 0;
        if (totalEl)  totalEl.textContent  = n * n;

        winBanner.classList.remove('show');

        selectScreen.style.display = 'none';
        gameScreen.style.display   = '';

        // Imagen de referencia
        refImg.src = src;

        // Tamaño de pieza (responsive)
        // Usamos un 90% del ancho de la pantalla en móviles, máximo 400px en PC
        const availableWidth = window.innerWidth < 600 ? window.innerWidth - 40 : Math.min(400, window.innerWidth - 260);
        const totalSize = Math.min(400, availableWidth);
        const pieceSize = Math.floor(totalSize / n);
        
        // Ajustar el total exacto basado en el tamaño de la pieza calculado
        const finalTotalSize = pieceSize * n;

        document.documentElement.style.setProperty('--piece-size', pieceSize + 'px');
        document.documentElement.style.setProperty('--bg-size', finalTotalSize + 'px ' + finalTotalSize + 'px');

        // Crear tablero vacío
        puzzleBoard.innerHTML = '';
        puzzleBoard.style.gridTemplateColumns = `repeat(${n}, ${pieceSize}px)`;
        puzzleBoard.style.gridTemplateRows    = `repeat(${n}, ${pieceSize}px)`;

        const slots = [];
        for (let i = 0; i < n * n; i++) {
            const slot = document.createElement('div');
            slot.className   = 'board-slot';
            slot.dataset.idx = i;
            slot.style.width  = pieceSize + 'px';
            slot.style.height = pieceSize + 'px';

            // Drag-over / drop (ratón)
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!slot.dataset.placed) slot.classList.add('drag-over');
            });
            slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                if (slot.dataset.placed) return;
                if (!draggedPiece) return;
                handleDrop(slot, draggedPiece);
                draggedPiece = null;
            });

            // Touch drop target: detectado desde touchend en la pieza
            puzzleBoard.appendChild(slot);
            slots.push(slot);
        }

        // Crear piezas y mezclarlas
        const indices = shuffle([...Array(n * n).keys()]);
        piecesTray.innerHTML = '';
        const trayN = Math.ceil(Math.sqrt(n * n));
        piecesTray.style.gridTemplateColumns = `repeat(${trayN}, ${pieceSize}px)`;

        indices.forEach(idx => {
            const row = Math.floor(idx / n);
            const col = idx % n;
            const bgX  = -(col * pieceSize);
            const bgY  = -(row * pieceSize);

            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.draggable = true;
            piece.dataset.idx = idx;
            piece.style.backgroundImage    = `url('${src}')`;
            piece.style.backgroundPosition = `${bgX}px ${bgY}px`;
            piece.style.width  = pieceSize + 'px';
            piece.style.height = pieceSize + 'px';

            // Mouse drag
            piece.addEventListener('dragstart', () => {
                draggedPiece = piece;
                setTimeout(() => piece.classList.add('dragging'), 0);
            });
            piece.addEventListener('dragend', () => {
                piece.classList.remove('dragging');
                draggedPiece = null;
            });

            // Touch drag
            piece.addEventListener('touchstart', (e) => {
                e.preventDefault();
                touchDragPiece = piece;
                // Crear fantasma visual
                ghostEl = piece.cloneNode(true);
                ghostEl.style.position = 'fixed';
                ghostEl.style.pointerEvents = 'none';
                ghostEl.style.opacity = '0.8';
                ghostEl.style.zIndex  = '9999';
                ghostEl.style.width   = pieceSize + 'px';
                ghostEl.style.height  = pieceSize + 'px';
                const touch = e.touches[0];
                ghostEl.style.left = (touch.clientX - pieceSize / 2) + 'px';
                ghostEl.style.top  = (touch.clientY - pieceSize / 2) + 'px';
                document.body.appendChild(ghostEl);
            }, { passive: false });

            piece.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                if (ghostEl) {
                    ghostEl.style.left = (touch.clientX - pieceSize / 2) + 'px';
                    ghostEl.style.top  = (touch.clientY - pieceSize / 2) + 'px';
                }
            }, { passive: false });

            piece.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (ghostEl) { ghostEl.remove(); ghostEl = null; }
                const touch = e.changedTouches[0];
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                const slot = el ? el.closest('.board-slot') : null;
                if (slot && !slot.dataset.placed && touchDragPiece) {
                    handleDrop(slot, touchDragPiece);
                }
                touchDragPiece = null;
            }, { passive: false });

            piecesTray.appendChild(piece);
        });
    }

    function handleDrop(slot, piece) {
        const slotIdx  = parseInt(slot.dataset.idx);
        const pieceIdx = parseInt(piece.dataset.idx);

        moves++;
        if (movesEl) movesEl.textContent = moves;

        if (slotIdx === pieceIdx) {
            // ✅ Correcto
            slot.appendChild(piece);
            slot.dataset.placed = '1';
            slot.classList.add('correct');
            piece.classList.add('placed');
            piece.draggable = false;
            placedPieces++;
            if (placedEl) placedEl.textContent = placedPieces;

            const total = gridSize * gridSize;
            if (placedPieces === total) handleWin();
        } else {
            // ❌ Incorrecto — pequeño shake visual en el slot
            slot.style.background = 'rgba(231,76,60,0.3)';
            setTimeout(() => slot.style.background = '', 500);
        }
    }

    function handleWin() {
        winBanner.classList.add('show');
        if (window.gameAPI) {
            window.gameAPI.addPoints(60, 'rompecabezas');
            if (gameScore) gameScore.textContent = window.gameAPI.getScore();
        }
    }

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
});
