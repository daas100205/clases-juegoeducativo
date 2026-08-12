document.addEventListener('DOMContentLoaded', () => {

    // --- Generar estrellas animadas (adaptado al rendimiento del dispositivo) ---
    (function generateStars() {
        // Detectar rendimiento: deviceMemory y hardwareConcurrency son indicadores
        const mem = navigator.deviceMemory || 4;        // GB de RAM (si disponible)
        const cores = navigator.hardwareConcurrency || 4;
        const lowEnd = mem <= 2 || cores <= 2;
        const count = lowEnd ? 40 : 80; // antes eran 120

        const frag = document.createDocumentFragment(); // un solo reflow al insertar
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star-particle';
            const size = Math.random() * 3 + 1;
            star.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                --duration: ${(Math.random() * 4 + 2).toFixed(1)}s;
                --delay: -${(Math.random() * 6).toFixed(1)}s;
            `;
            frag.appendChild(star);
        }
        document.body.appendChild(frag);
    })();

    const loginModal = document.getElementById('loginModal');
    const mainContainer = document.getElementById('mainContainer');
    const astronautNameInput = document.getElementById('astronautName');
    const startBtn = document.getElementById('startBtn');
    
    const displayName = document.getElementById('displayName');
    const displayScore = document.getElementById('displayScore');
    const finishMissionBtn = document.getElementById('finishMissionBtn');
    
    const diplomaModal = document.getElementById('diplomaModal');
    const diplomaName = document.getElementById('diplomaName');
    const diplomaScore = document.getElementById('diplomaScore');
    const printBtn = document.getElementById('printBtn');
    const restartBtn = document.getElementById('restartBtn');

    // Comprobar si ya hay un usuario guardado
    const savedName = sessionStorage.getItem('astronautName');
    const savedScoresStr = sessionStorage.getItem('astronautScores');
    let savedScoreTotal = 0;
    
    if (savedScoresStr) {
        try {
            const scores = JSON.parse(savedScoresStr);
            savedScoreTotal = Object.values(scores).reduce((a, b) => a + b, 0);
        } catch (e) {}
    }

    if (savedName) {
        // Usuario ya registrado, mostrar menú principal
        if (loginModal) loginModal.classList.add('hidden');
        if (mainContainer) mainContainer.classList.remove('hidden');
        updateHeader(savedName, savedScoreTotal);
    }

    // Botón de iniciar (guardar nombre)
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const name = astronautNameInput.value.trim();
            if (name.length > 0) {
                sessionStorage.setItem('astronautName', name);
                const initialScores = { multiplicacion: 0, sopa: 0, crucigrama: 0, rompecabezas: 0, ahorcado: 0, memoria: 0, simon: 0 };
                sessionStorage.setItem('astronautScores', JSON.stringify(initialScores)); // Iniciar puntos en 0
                
                loginModal.classList.add('hidden');
                mainContainer.classList.remove('hidden');
                updateHeader(name, 0);
            } else {
                alert('¡Por favor, ingresa tu nombre de astronauta para continuar!');
            }
        });
    }

    // Permitir iniciar con Enter
    if (astronautNameInput) {
        astronautNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                startBtn.click();
            }
        });
    }

    // Actualizar Header
    function updateHeader(name, score) {
        if(displayName) displayName.textContent = name;
        if(displayScore) displayScore.textContent = score;
    }

    // Terminar Misión (Mostrar Diploma)
    if (finishMissionBtn) {
        finishMissionBtn.addEventListener('click', () => {
            const name = sessionStorage.getItem('astronautName');
            const scoresStr = sessionStorage.getItem('astronautScores');
            let scores = { multiplicacion: 0, sopa: 0, crucigrama: 0, rompecabezas: 0, ahorcado: 0, memoria: 0, simon: 0 };
            
            if (scoresStr) {
                try {
                    scores = JSON.parse(scoresStr);
                } catch (e) {}
            }
            
            const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

            if(diplomaName) diplomaName.textContent = name;
            if(diplomaScore) diplomaScore.textContent = totalScore;

            // Mapa de nombres bonitos por juego
            const gameLabels = {
                multiplicacion: '🔢 Multiplicación',
                sopa:           '🔤 Sopa de Letras',
                crucigrama:     '🧩 Crucigrama',
                rompecabezas:   '🖼️ Rompecabezas',
                ahorcado:       '🔡 Planeta Misterioso',
                memoria:        '🃏 Memoria',
                simon:          '🎵 Secuencia Estelar'
            };

            // Construir desglose solo con juegos jugados (puntos > 0)
            const breakdown = document.getElementById('scoreBreakdown');
            if (breakdown) {
                const jugados = Object.entries(scores).filter(([k, v]) => v > 0);
                if (jugados.length === 0) {
                    breakdown.innerHTML = `<p style="color:rgba(255,255,255,0.5); font-size:0.9rem;">Aún no has jugado ninguna actividad.</p>`;
                } else {
                    breakdown.innerHTML = `<p><strong>📋 Juegos completados:</strong></p>` +
                        jugados.map(([key, val]) =>
                            `<p>${gameLabels[key] || key}: <strong>${val} pts</strong></p>`
                        ).join('');
                }
            }

            // Poner la fecha de hoy en el diploma
            const diplomaDate = document.getElementById('diplomaDate');
            if (diplomaDate) {
                const today = new Date();
                diplomaDate.textContent = today.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
            }

            mainContainer.classList.add('hidden');
            diplomaModal.classList.remove('hidden');
            // Hacer scroll al inicio del modal
            diplomaModal.scrollTop = 0;
        });
    }

    // Convierte una URL de imagen a base64 (para evitar problemas CORS en html2canvas)
    function toBase64(url) {
        return new Promise((resolve) => {
            // Si ya es base64 (foto subida por el usuario), la devolvemos directo
            if (url.startsWith('data:')) { resolve(url); return; }
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                c.getContext('2d').drawImage(img, 0, 0);
                try { resolve(c.toDataURL('image/png')); } catch(e) { resolve(url); }
            };
            img.onerror = () => resolve(url);
            img.src = url + '?t=' + Date.now(); // cache-bust
        });
    }

    // Descargar Diploma como imagen PNG
    if (printBtn) {
        printBtn.addEventListener('click', async () => {
            const name    = sessionStorage.getItem('astronautName') || 'Astronauta';
            const element = document.getElementById('diplomaElement');
            const picker  = document.getElementById('photoPicker');
            const actions = document.querySelector('.diploma-actions');
            const photo   = document.getElementById('diplomaPhoto');
            const sealImgs = element.querySelectorAll('.seal');

            printBtn.disabled = true;
            printBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';

            // Ocultar controles que no deben aparecer en la imagen
            if (picker)  picker.style.display  = 'none';
            if (actions) actions.style.display = 'none';

            // Pre-convertir imágenes a base64 para que html2canvas las renderice bien
            const originalPhotoSrc = photo ? photo.src : null;
            const originalSealSrcs = [];
            if (photo && originalPhotoSrc) {
                photo.src = await toBase64(originalPhotoSrc);
            }
            for (const seal of sealImgs) {
                originalSealSrcs.push(seal.src);
                seal.src = await toBase64(seal.src);
            }

            // Añadir clase para exportación horizontal
            element.classList.add('landscape-export');

            html2canvas(element, {
                backgroundColor: '#12003a',
                scale: 2.5,
                useCORS: true,
                allowTaint: true,
                logging: false,
                imageTimeout: 0,
                removeContainer: true
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `diploma-${name.replace(/\s+/g, '_')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();

                // Restaurar todo
                element.classList.remove('landscape-export');
                if (photo && originalPhotoSrc) photo.src = originalPhotoSrc;
                sealImgs.forEach((seal, i) => { seal.src = originalSealSrcs[i]; });
                if (picker)  picker.style.display  = '';
                if (actions) actions.style.display = '';
                printBtn.disabled = false;
                printBtn.innerHTML = '<i class="fa-solid fa-download"></i> Descargar Diploma';
            }).catch(() => {
                element.classList.remove('landscape-export');
                if (photo && originalPhotoSrc) photo.src = originalPhotoSrc;
                sealImgs.forEach((seal, i) => { seal.src = originalSealSrcs[i]; });
                if (picker)  picker.style.display  = '';
                if (actions) actions.style.display = '';
                printBtn.disabled = false;
                printBtn.innerHTML = '<i class="fa-solid fa-download"></i> Descargar Diploma';
                alert('No se pudo generar la imagen. Intenta de nuevo.');
            });
        });
    }

    // Reiniciar
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            sessionStorage.removeItem('astronautName');
            sessionStorage.removeItem('astronautScores');
            window.location.reload();
        });
    }

    // ---- Galería de avatares para el diploma ----
    const AVATARS = [
        { src: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png',  label: 'Astronauta' },
        { src: 'https://cdn-icons-png.flaticon.com/512/3069/3069190.png',  label: 'Astronauta 2' },
        { src: 'https://cdn-icons-png.flaticon.com/512/2920/2920349.png',  label: 'Robot' },
        { src: 'https://cdn-icons-png.flaticon.com/512/6645/6645275.png',  label: 'Alien' },
        { src: 'https://cdn-icons-png.flaticon.com/512/3159/3159697.png',  label: 'Científico' },
        { src: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',  label: 'Estudiante' },
    ];

    const avatarRow   = document.getElementById('avatarRow');
    const diplomaPhoto = document.getElementById('diplomaPhoto');
    const photoUpload  = document.getElementById('photoUpload');

    if (avatarRow && diplomaPhoto) {
        // Generar avatares
        AVATARS.forEach(av => {
            const img = document.createElement('img');
            img.src   = av.src;
            img.alt   = av.label;
            img.title = av.label;
            img.className = 'avatar-opt';
            img.crossOrigin = 'anonymous';
            img.addEventListener('click', () => {
                document.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('chosen'));
                img.classList.add('chosen');
                diplomaPhoto.src = av.src;
                diplomaPhoto.crossOrigin = 'anonymous';
            });
            avatarRow.appendChild(img);
        });

        // Upload foto propia
        if (photoUpload) {
            photoUpload.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                    document.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('chosen'));
                    diplomaPhoto.src = ev.target.result;
                    diplomaPhoto.crossOrigin = null; // foto local no necesita CORS
                };
                reader.readAsDataURL(file);
            });
        }
    }

});

// Función global para actualizar y obtener puntos (usada por los juegos)
window.gameAPI = {
    checkAuth: function() {
        if (!sessionStorage.getItem('astronautName')) {
            window.location.href = 'index.html';
        }
    },
    addPoints: function(points, gameId) {
        let scores = { multiplicacion: 0, sopa: 0, crucigrama: 0, rompecabezas: 0, ahorcado: 0, memoria: 0, simon: 0 };
        const savedScoresStr = sessionStorage.getItem('astronautScores');
        
        if (savedScoresStr) {
            try {
                scores = JSON.parse(savedScoresStr);
            } catch (e) {}
        }
        
        if (scores[gameId] !== undefined) {
            scores[gameId] += points;
        } else {
            scores[gameId] = points;
        }
        
        sessionStorage.setItem('astronautScores', JSON.stringify(scores));
        
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        
        // Intentar actualizar el DOM si estamos en la página principal o juegos
        const displayScore = document.getElementById('displayScore');
        const gameScore = document.getElementById('gameScore'); // Para las páginas de juegos
        
        const elementToUpdate = displayScore || gameScore;
        
        if (elementToUpdate) {
            elementToUpdate.textContent = totalScore;
            // Pequeña animación
            elementToUpdate.style.transform = 'scale(1.5)';
            elementToUpdate.style.color = '#fff';
            setTimeout(() => {
                elementToUpdate.style.transform = 'scale(1)';
                elementToUpdate.style.color = 'var(--secondary-color)';
            }, 300);
        }
    },
    getScore: function() {
        let total = 0;
        const savedScoresStr = sessionStorage.getItem('astronautScores');
        if (savedScoresStr) {
            try {
                const scores = JSON.parse(savedScoresStr);
                total = Object.values(scores).reduce((a, b) => a + b, 0);
            } catch (e) {}
        }
        return total;
    },
    getName: function() {
        return sessionStorage.getItem('astronautName') || 'Astronauta';
    },
    checkAuth: function() {
        // Redirigir al index si intenta entrar a un juego sin registrarse
        if (!sessionStorage.getItem('astronautName')) {
            window.location.href = 'index.html';
        }
    }
};
