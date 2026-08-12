document.addEventListener('DOMContentLoaded', () => {
    if (window.gameAPI) window.gameAPI.checkAuth();

    const gameScore    = document.getElementById('gameScore');
    const problemDisp  = document.getElementById('problemDisplay');
    const optionsCont  = document.getElementById('optionsContainer');
    const feedbackMsg  = document.getElementById('feedbackMsg');
    const streakBar    = document.getElementById('streakBar');
    const correctCount = document.getElementById('correctCount');
    const wrongCount   = document.getElementById('wrongCount');
    const questionsCount = document.getElementById('questionsCount');
    const levelBadge   = document.getElementById('levelBadge'); // nuevo

    if (window.gameAPI && gameScore) gameScore.textContent = window.gameAPI.getScore();

    let correctAnswer = 0;
    let isProcessing  = false;
    let correct  = 0;
    let wrong    = 0;
    let questions = 0;
    let streak   = 0;
    let currentOp = '×'; // operación actual para mostrar en feedback
    const streakMax = 5;

    // ---- Sistema de niveles ----
    // Nivel 1 (0-4 aciertos):  ×/÷  factores 2-5
    // Nivel 2 (5-9 aciertos):  ×/÷  factores 2-8
    // Nivel 3 (10-14 aciertos): ×/÷  factores 2-10
    // Nivel 4 (15+ aciertos):  ×/÷  factores 2-12
    function getLevel() {
        if (correct < 5)  return 1;
        if (correct < 10) return 2;
        if (correct < 15) return 3;
        return 4;
    }
    function getMaxFactor() {
        return [0, 5, 8, 10, 12][getLevel()];
    }
    function getLevelLabel() {
        return ['', '🌱 Nivel 1', '⚡ Nivel 2', '🔥 Nivel 3', '💫 Nivel 4'][getLevel()];
    }

    // Crear puntos de racha
    if (streakBar) {
        for (let i = 0; i < streakMax; i++) {
            const dot = document.createElement('div');
            dot.className = 'streak-dot';
            dot.id = `streak-dot-${i}`;
            streakBar.appendChild(dot);
        }
    }

    function updateStats() {
        if (correctCount)   correctCount.textContent   = correct;
        if (wrongCount)     wrongCount.textContent     = wrong;
        if (questionsCount) questionsCount.textContent = questions;
        if (gameScore && window.gameAPI) gameScore.textContent = window.gameAPI.getScore();
        if (levelBadge) levelBadge.textContent = getLevelLabel();
    }

    function updateStreak() {
        if (!streakBar) return;
        const dots = streakBar.querySelectorAll('.streak-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i < streak);
        });
    }

    function generateProblem() {
        isProcessing = false;
        feedbackMsg.textContent = '';

        const max = getMaxFactor();
        const num1 = Math.floor(Math.random() * (max - 1)) + 2;
        const num2 = Math.floor(Math.random() * (max - 1)) + 2;

        // Mezclar operaciones: 50% multiplicación, 50% división
        // Para divisiones generamos num1*num2 y dividimos entre num2
        const useDivision = Math.random() < 0.5;

        if (useDivision) {
            // Dividendo = num1 * num2  (siempre exacto)
            const dividend = num1 * num2;
            correctAnswer = num1; // resultado
            currentOp = '÷';

            problemDisp.style.opacity = 0;
            setTimeout(() => {
                problemDisp.innerHTML = `<span>${dividend} ÷ ${num2} = ?</span>`;
                problemDisp.style.opacity = 1;
            }, 150);

            generateOptions(correctAnswer, num1, num2, 'div');
        } else {
            correctAnswer = num1 * num2;
            currentOp = '×';

            problemDisp.style.opacity = 0;
            setTimeout(() => {
                problemDisp.innerHTML = `<span>${num1} × ${num2} = ?</span>`;
                problemDisp.style.opacity = 1;
            }, 150);

            generateOptions(correctAnswer, num1, num2, 'mul');
        }

        questions++;
        updateStats();
    }

    function generateOptions(correct, n1, n2, type) {
        optionsCont.innerHTML = '';
        let options = new Set([correct]);

        const strategies = type === 'mul'
            ? [
                () => correct + n1,
                () => correct - n2,
                () => correct + n2,
                () => (n1 + 1) * n2,
                () => n1 * (n2 + 1),
                () => correct + Math.floor(Math.random() * 8) - 4,
              ]
            : [
                () => correct + 1,
                () => correct - 1,
                () => correct + 2,
                () => n2,           // el divisor como distractor
                () => n1 * n2,      // el dividendo como distractor
                () => correct + Math.floor(Math.random() * 4) + 1,
              ];

        let attempts = 0;
        while (options.size < 4 && attempts < 60) {
            const fake = strategies[Math.floor(Math.random() * strategies.length)]();
            if (fake > 0 && fake !== correct) options.add(fake);
            attempts++;
        }

        [...options].sort(() => Math.random() - 0.5).forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.addEventListener('click', () => handleAnswer(btn, opt === correct));
            optionsCont.appendChild(btn);
        });
    }

    function handleAnswer(btn, isCorrect) {
        if (isProcessing) return;
        isProcessing = true;

        if (isCorrect) {
            btn.classList.add('correct');
            correct++;
            streak = Math.min(streakMax, streak + 1);
            updateStreak();

            const rachaBonus = streak === streakMax ? 5 : 0;
            const nivelBonus = getLevel() - 1;        // +0, +1, +2, +3 según nivel
            const pts = 10 + rachaBonus + nivelBonus;

            const opLabel = currentOp === '÷' ? '¡División correcta!' : '¡Correcto!';
            feedbackMsg.textContent = streak === streakMax
                ? `¡RACHA PERFECTA! +${pts} pts 🔥`
                : `${opLabel} +${pts} pts ⭐`;
            feedbackMsg.style.color = '#2ecc71';

            // Aviso de subida de nivel
            const prevLevel = getLevel();
            if (window.gameAPI) window.gameAPI.addPoints(pts, 'multiplicacion');
            updateStats();
            const newLevel = getLevel();
            if (newLevel > prevLevel) {
                feedbackMsg.textContent = `🚀 ¡Subiste al ${getLevelLabel()}! +${pts} pts`;
                feedbackMsg.style.color = '#f1c40f';
            }

            setTimeout(generateProblem, 1600);
        } else {
            btn.classList.add('wrong');
            wrong++;
            streak = 0;
            updateStreak();

            const opName = currentOp === '÷' ? 'división' : 'multiplicación';
            feedbackMsg.textContent = `¡Ups! La ${opName} no es esa. Revisa bien 🔭`;
            feedbackMsg.style.color = '#e74c3c';
            updateStats();

            setTimeout(() => {
                btn.classList.remove('wrong');
                isProcessing = false;
                feedbackMsg.textContent = '';
            }, 1200);
        }
    }

    generateProblem();
    updateStats();
});
