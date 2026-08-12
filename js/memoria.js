document.addEventListener('DOMContentLoaded', () => {
    if (window.gameAPI) window.gameAPI.checkAuth();

    const gameScore  = document.getElementById('gameScore');
    const memoryGrid = document.getElementById('memoryGrid');
    const movesEl    = document.getElementById('movesCount');
    const pairsEl    = document.getElementById('pairsCount');
    const winMessage = document.getElementById('winMessage');

    if (window.gameAPI && gameScore) gameScore.textContent = window.gameAPI.getScore();

    // Iconos de temática espacial (8 pares = 16 cartas)
    const emojis = ['🚀', '🛸', '🛰️', '🌍', '🌕', '☀️', '⭐', '☄️'];
    let cards = [...emojis, ...emojis];
    
    let moves = 0;
    let pairsFound = 0;
    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;

    function initGame() {
        // Mezclar cartas
        cards.sort(() => 0.5 - Math.random());

        memoryGrid.innerHTML = '';
        
        cards.forEach((emoji, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'memory-card';
            cardEl.dataset.emoji = emoji;
            cardEl.dataset.index = index;

            cardEl.innerHTML = `
                <div class="card-inner">
                    <div class="card-front"></div>
                    <div class="card-back">${emoji}</div>
                </div>
            `;

            cardEl.addEventListener('click', () => flipCard(cardEl));
            memoryGrid.appendChild(cardEl);
        });
    }

    function flipCard(card) {
        if (lockBoard) return;
        if (card === firstCard) return;
        if (card.classList.contains('matched')) return;

        card.classList.add('flipped');

        if (!firstCard) {
            firstCard = card;
            return;
        }

        secondCard = card;
        moves++;
        movesEl.textContent = moves;
        checkForMatch();
    }

    function checkForMatch() {
        const isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;

        if (isMatch) {
            disableCards();
            pairsFound++;
            pairsEl.textContent = `${pairsFound}/8`;
            
            if (pairsFound === 8) {
                setTimeout(handleWin, 500);
            }
        } else {
            unflipCards();
        }
    }

    function disableCards() {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        resetBoard();
    }

    function unflipCards() {
        lockBoard = true;
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            resetBoard();
        }, 1000);
    }

    function resetBoard() {
        [firstCard, secondCard] = [null, null];
        lockBoard = false;
    }

    function handleWin() {
        winMessage.classList.add('show');
        if (window.gameAPI) {
            window.gameAPI.addPoints(50, 'memoria');
            if (gameScore) gameScore.textContent = window.gameAPI.getScore();
        }
    }

    initGame();
});
