"use strict";

/**
 * ══════════════════════════════════════════
 *  Siete y Medio — Lógica de juego (frontend)
 * ══════════════════════════════════════════
 *
 *  Reglas:
 *   - Cartas 1–7 valen su valor nominal.
 *   - Figuras (S=Sota, C=Caballo, R=Rey) valen 0.5.
 *   - El objetivo es acercarse a 7.5 sin pasarse.
 *   - Si te pasas de 7.5, pierdes automáticamente.
 *
 *  Baraja española: 40 cartas (palos B, C, E, O).
 *  Imágenes en /img/baraja/{num}{palo}.png
 *  Reversos en /img/baraja/reverso1.png
 */

const SieteYMedio = (() => {

    /* ─── Constantes ─── */
    const PALOS = ['B', 'C', 'E', 'O'];
    const PALO_NOMBRES = { B: 'Bastos', C: 'Copas', E: 'Espadas', O: 'Oros' };
    const NUMS = ['1', '2', '3', '4', '5', '6', '7', 'S', 'C', 'R'];
    const FIGURAS = ['S', 'C', 'R'];
    const IMG_BASE = '/img/baraja/';
    const REVERSO = IMG_BASE + 'reverso1.png';
    const LIMITE = 7.5;

    /* ─── Fichas & Cervezas (persistente por usuario) ─── */
    const STORAGE_KEY_FICHAS = 'timba_fichas_' + (typeof config !== 'undefined' ? config.userId : 0);
    const STORAGE_KEY_CERVEZAS = 'timba_cervezas_' + (typeof config !== 'undefined' ? config.userId : 0);
    const FICHAS_INICIALES = (typeof config !== 'undefined' && config.admin) ? 500 : 100;
    const CERVEZAS_INICIALES = 0;

    function cargarFichas() {
        const saved = localStorage.getItem(STORAGE_KEY_FICHAS);
        if (saved !== null) return parseInt(saved, 10);
        // Primera vez: asignar fichas iniciales
        localStorage.setItem(STORAGE_KEY_FICHAS, FICHAS_INICIALES);
        return FICHAS_INICIALES;
    }

    function guardarFichas(amount) {
        localStorage.setItem(STORAGE_KEY_FICHAS, amount);
    }

    function cargarCervezas() {
        const saved = localStorage.getItem(STORAGE_KEY_CERVEZAS);
        if (saved !== null) return parseInt(saved, 10);
        localStorage.setItem(STORAGE_KEY_CERVEZAS, CERVEZAS_INICIALES);
        return CERVEZAS_INICIALES;
    }

    function guardarCervezas(amount) {
        localStorage.setItem(STORAGE_KEY_CERVEZAS, amount);
    }

    let fichas = 0;
    let cervezas = 0;

    /* ─── Estado del juego ─── */
    let mesa = [];          // baraja restante
    let gameOver = false;
    let gameStarted = false; // la partida no empieza hasta que pidas carta
    let currentBet = 0;
    let boteTotal = 0;      // suma de todas las apuestas de la ronda

    const players = [
        { name: 'Tú', cards: [], score: 0, standing: false, active: true, bet: 0 },
        { name: 'Jugador 2', cards: [], score: 0, standing: false, active: true, bet: 0 },
        { name: null, cards: [], score: 0, standing: false, active: false, bet: 0 },
        { name: null, cards: [], score: 0, standing: false, active: false, bet: 0 }
    ];

    const MY_INDEX = 0;

    /* ═══════════════════════════════════════
       Baraja
       ═══════════════════════════════════════ */

    function crearBaraja() {
        mesa = [];
        for (const p of PALOS) {
            for (const n of NUMS) {
                mesa.push({ code: n + p, num: n, palo: p });
            }
        }
        barajar();
    }

    function barajar() {
        for (let i = mesa.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [mesa[i], mesa[j]] = [mesa[j], mesa[i]];
        }
    }

    function robarCarta() {
        if (mesa.length === 0) return null;
        return mesa.pop();
    }

    /** Valor de una carta según las reglas de Siete y Medio */
    function valorCarta(carta) {
        if (FIGURAS.includes(carta.num)) return 0.5;
        return parseInt(carta.num, 10);
    }

    /** Nombre legible de una carta */
    function nombreCarta(carta) {
        const numNombre = {
            '1': 'As', '2': '2', '3': '3', '4': '4',
            '5': '5', '6': '6', '7': '7',
            'S': 'Sota', 'C': 'Caballo', 'R': 'Rey'
        };
        return (numNombre[carta.num] || carta.num) + ' de ' + PALO_NOMBRES[carta.palo];
    }

    /* ═══════════════════════════════════════
       Renderizado
       ═══════════════════════════════════════ */

    function createCardImg(carta, faceDown) {
        const img = document.createElement('img');
        img.src = faceDown ? REVERSO : IMG_BASE + carta.code + '.png';
        img.alt = faceDown ? 'Carta boca abajo' : nombreCarta(carta);
        img.className = 'playing-card';
        img.title = faceDown ? '' : nombreCarta(carta) + ' (' + valorCarta(carta) + ' pts)';
        return img;
    }

    function renderCards(idx) {
        const p = players[idx];
        const zone = document.getElementById('cards-' + idx);
        if (!zone || !p.active) return;
        zone.innerHTML = '';
        p.cards.forEach((c, i) => {
            // Tú (MY_INDEX) siempre ves tus cartas.
            // Los demás: TODAS las cartas se muestran como reverso hasta que la partida termine.
            const faceDown = (idx !== MY_INDEX && !gameOver);
            zone.appendChild(createCardImg(c, faceDown));
        });
    }

    function updateScore(idx) {
        const p = players[idx];
        if (!p.active) return;
        const el = document.getElementById('score-' + idx);
        if (!el) return;
        // Solo mostrar tu puntuación; los demás oculta hasta que termine
        if (idx === MY_INDEX) {
            el.textContent = p.score % 1 === 0 ? p.score : p.score.toFixed(1);
        } else if (gameOver) {
            el.textContent = p.score % 1 === 0 ? p.score : p.score.toFixed(1);
        } else {
            el.textContent = '?';
        }
    }

    function updateSlotStatus(idx) {
        const slot = document.getElementById('slot-' + idx);
        if (!slot) return;
        const p = players[idx];

        if (!p.active) {
            slot.classList.add('empty');
            slot.querySelector('.player-name').textContent = 'Esperando…';
            return;
        }

        slot.classList.remove('empty');
        const nameEl = slot.querySelector('.player-name');

        let badge = '';
        if (gameOver && p.score > LIMITE) {
            badge = '<span class="badge bg-danger">Eliminado</span>';
        } else if (p.standing) {
            badge = '<span class="badge bg-warning text-dark">Plantado</span>';
        } else {
            badge = '<span class="badge bg-success">Activo</span>';
        }
        nameEl.innerHTML = '🃏 ' + p.name + ' ' + badge;
    }

    function renderAll() {
        for (let i = 0; i < 4; i++) {
            renderCards(i);
            updateScore(i);
            updateSlotStatus(i);
        }
    }

    /** Actualizar el display de fichas y cervezas en la UI */
    function updateWalletDisplay() {
        const fichasEl = document.getElementById('fichasDisplay');
        if (fichasEl) fichasEl.textContent = fichas;
        const cervezasEl = document.getElementById('cervezasDisplay');
        if (cervezasEl) cervezasEl.textContent = cervezas;
    }

    function showStatus(msg, type) {
        type = type || 'info';
        const el = document.getElementById('gameStatus');
        if (!el) return;
        el.className = 'game-status mt-3 mx-auto show alert alert-' + type;
        el.style.maxWidth = '500px';
        el.innerHTML = msg;
    }

    function disableActions() {
        const ids = ['btnPedirCarta', 'btnPlantarse', 'btnApostar'];
        ids.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = true;
        });
        const panel = document.getElementById('betPanel');
        if (panel) panel.classList.remove('show');
    }

    function enableActions() {
        // Habilitar Apostar, pero dejar Pedir/Plantar para después de apostar
        const btnApostar = document.getElementById('btnApostar');
        if (btnApostar) btnApostar.disabled = false;

        const ids = ['btnPedirCarta', 'btnPlantarse'];
        ids.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = true; // Deshabilitados hasta que se apueste
        });
    }

    function enableGameActions() {
        const ids = ['btnPedirCarta', 'btnPlantarse'];
        ids.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });
    }

    /* ═══════════════════════════════════════
       IA sencilla para los oponentes
       ═══════════════════════════════════════ */

    function iaApostar(idx) {
        const p = players[idx];
        if (!p.active) return;
        // La IA apuesta entre 5 y 50 fichas
        p.bet = Math.floor(Math.random() * 10) * 5 + 5; // 5, 10, 15 ... 50
        boteTotal += p.bet;
    }

    function iaJugar(idx) {
        const p = players[idx];
        if (!p.active || p.standing || p.score > LIMITE) return;

        // Estrategia simple: pedir carta si score < 5, luego probabilidad decreciente
        while (p.score <= LIMITE && !p.standing) {
            if (p.score >= 6) {
                if (Math.random() < 0.75) {
                    p.standing = true;
                    break;
                }
            } else if (p.score >= 5) {
                if (Math.random() < 0.4) {
                    p.standing = true;
                    break;
                }
            }

            const carta = robarCarta();
            if (!carta) { p.standing = true; break; }

            p.cards.push(carta);
            p.score += valorCarta(carta);
            p.score = Math.round(p.score * 10) / 10;

            if (p.score > LIMITE) break;
            if (p.score === LIMITE) { p.standing = true; break; }
        }
    }

    /* ═══════════════════════════════════════
       Determinar ganador
       ═══════════════════════════════════════ */

    function determinarResultado() {
        // Hacer que los oponentes activos jueguen
        for (let i = 1; i < 4; i++) {
            if (players[i].active) iaJugar(i);
        }

        gameOver = true;

        // Revelar todas las cartas
        renderAll();

        // Buscar el mejor score que no se pase
        let mejorScore = -1;
        let ganadores = [];

        for (let i = 0; i < 4; i++) {
            const p = players[i];
            if (!p.active) continue;
            if (p.score > LIMITE) continue;

            if (p.score > mejorScore) {
                mejorScore = p.score;
                ganadores = [i];
            } else if (p.score === mejorScore) {
                ganadores.push(i);
            }
        }

        // Repartir fichas
        if (ganadores.length === 0) {
            // Nadie gana, fichas perdidas
            showStatus('💀 ¡Todos se pasaron! Se pierden ' + boteTotal + ' fichas del bote.', 'danger');
        } else if (ganadores.length === 1) {
            const g = players[ganadores[0]];
            const scoreStr = g.score % 1 === 0 ? g.score : g.score.toFixed(1);
            if (ganadores[0] === MY_INDEX) {
                // ¡Ganaste! Recibes todo el bote
                fichas += boteTotal;
                guardarFichas(fichas);
                // Bonus: ganar una cerveza
                cervezas += 1;
                guardarCervezas(cervezas);
                showStatus('🎉 ¡Has ganado con ' + scoreStr + ' puntos! Ganas <strong>' + boteTotal + ' fichas</strong> y 🍺 1 cerveza.', 'success');
            } else {
                showStatus('😞 Ha ganado <strong>' + g.name + '</strong> con ' + scoreStr + ' puntos. Pierdes tu apuesta de ' + players[MY_INDEX].bet + ' fichas.', 'warning');
            }
        } else {
            // Empate: se reparte el bote
            const nombres = ganadores.map(i => players[i].name).join(', ');
            const parte = Math.floor(boteTotal / ganadores.length);
            if (ganadores.includes(MY_INDEX)) {
                fichas += parte;
                guardarFichas(fichas);
                showStatus('🤝 Empate entre ' + nombres + '. Te llevas <strong>' + parte + ' fichas</strong> del bote.', 'info');
            } else {
                showStatus('🤝 Empate entre ' + nombres + ' con ' + mejorScore + ' puntos. Pierdes tu apuesta.', 'info');
            }
        }

        updateWalletDisplay();
        disableActions();
        mostrarBotonNuevaPartida();
    }

    function mostrarBotonNuevaPartida() {
        const container = document.getElementById('gameActions');
        if (!container) return;
        if (document.getElementById('btnNuevaPartida')) return;

        const btn = document.createElement('button');
        btn.id = 'btnNuevaPartida';
        btn.className = 'btn btn-success px-4 mt-2';
        btn.innerHTML = '🔄 Nueva Partida';
        btn.onclick = nuevaPartida;
        container.appendChild(btn);
    }

    /* ═══════════════════════════════════════
       Acciones públicas
       ═══════════════════════════════════════ */

    function pedirCarta() {
        if (gameOver || !gameStarted) return;
        const me = players[MY_INDEX];
        if (me.standing) return;

        const carta = robarCarta();
        if (!carta) {
            showStatus('¡No quedan más cartas en la baraja!', 'warning');
            return;
        }

        me.cards.push(carta);
        me.score += valorCarta(carta);
        me.score = Math.round(me.score * 10) / 10;

        renderCards(MY_INDEX);
        updateScore(MY_INDEX);

        if (me.score > LIMITE) {
            showStatus('💥 ¡Te has pasado con ' + me.score.toFixed(1) + ' puntos! Pierdes tu apuesta.', 'danger');
            determinarResultado();
        } else if (me.score === LIMITE) {
            showStatus('🎯 ¡Siete y Medio! ¡Perfecto!', 'success');
            me.standing = true;
            updateSlotStatus(MY_INDEX);
            determinarResultado();
        }
    }

    function plantarse() {
        if (gameOver || !gameStarted) return;
        const me = players[MY_INDEX];
        if (me.standing) return;

        // No se puede plantar sin haber pedido carta
        if (!gameStarted || me.cards.length === 0) {
            showStatus('⚠️ Debes pedir al menos una carta antes de plantarte.', 'warning');
            return;
        }

        me.standing = true;
        updateSlotStatus(MY_INDEX);

        const scoreStr = me.score % 1 === 0 ? me.score : me.score.toFixed(1);
        showStatus('✋ Te has plantado con ' + scoreStr + ' puntos. Los rivales juegan…', 'warning');

        setTimeout(() => {
            determinarResultado();
        }, 800);
    }

    function toggleBetPanel() {
        if (gameOver) return;
        const panel = document.getElementById('betPanel');
        if (panel) panel.classList.toggle('show');
    }

    function ajustarApuesta(amount) {
        const input = document.getElementById('betAmount');
        if (!input) return;
        let val = parseInt(input.value, 10) || 0;
        val = Math.max(1, Math.min(fichas, val + amount)); // no superar tus fichas
        input.value = val;
    }

    function confirmarApuesta() {
        const input = document.getElementById('betAmount');
        if (!input) return;
        let amount = Math.max(1, parseInt(input.value, 10) || 1);

        // No puedes apostar más de lo que tienes
        if (amount > fichas) {
            showStatus('⚠️ No tienes suficientes fichas. Tienes ' + fichas + '.', 'danger');
            return;
        }

        // Descontar fichas
        fichas -= amount;
        guardarFichas(fichas);

        currentBet = amount;
        players[MY_INDEX].bet = amount;
        boteTotal += amount;

        updateWalletDisplay();

        const display = document.getElementById('currentBetDisplay');
        if (display) {
            display.textContent = '💰 Apuesta: ' + amount + ' fichas (Bote: ' + boteTotal + ')';
            display.classList.add('show');
        }

        const panel = document.getElementById('betPanel');
        if (panel) panel.classList.remove('show');

        // Deshabilitar botón de apostar (solo una apuesta por ronda)
        const btnApostar = document.getElementById('btnApostar');
        if (btnApostar) btnApostar.disabled = true;

        // Disparar apuestas de la IA
        for (let i = 1; i < 4; i++) {
            if (players[i].active) {
                iaApostar(i);
            }
        }

        // Habilitar botones de juego
        gameStarted = true;
        enableGameActions();

        showStatus('Has apostado ' + amount + ' fichas. Bote total: ' + boteTotal + ' fichas. ¡Ahora puedes **Pedir Carta**!', 'success');
    }

    /** Gastar cervezas en eventos */
    function gastarCervezas(cantidad, evento) {
        if (cervezas < cantidad) {
            showStatus('⚠️ No tienes suficientes cervezas. Tienes ' + cervezas + '.', 'danger');
            return false;
        }
        cervezas -= cantidad;
        guardarCervezas(cervezas);
        updateWalletDisplay();
        showStatus('🍺 Has usado ' + cantidad + ' cervezas en: ' + evento, 'info');
        return true;
    }

    /* ═══════════════════════════════════════
       Inicio / Nueva Partida
       ═══════════════════════════════════════ */

    function nuevaPartida() {
        // Reset state
        gameOver = false;
        gameStarted = false;
        currentBet = 0;
        boteTotal = 0;

        for (let i = 0; i < 4; i++) {
            players[i].cards = [];
            players[i].score = 0;
            players[i].standing = false;
            players[i].bet = 0;
        }

        crearBaraja();
        enableActions();

        // Recargar fichas y cervezas del storage
        fichas = cargarFichas();
        cervezas = cargarCervezas();
        updateWalletDisplay();

        // Limpiar status
        const statusEl = document.getElementById('gameStatus');
        if (statusEl) {
            statusEl.className = 'game-status mt-3 mx-auto';
            statusEl.innerHTML = '';
        }

        // Limpiar apuesta display
        const betDisplay = document.getElementById('currentBetDisplay');
        if (betDisplay) {
            betDisplay.classList.remove('show');
            betDisplay.textContent = '';
        }

        // Quitar botón nueva partida
        const btnNueva = document.getElementById('btnNuevaPartida');
        if (btnNueva) btnNueva.remove();

        crearBaraja();
        enableActions();

        // NO repartir carta inicial — la partida empieza cuando el jugador pulse "Pedir Carta"
        renderAll();
        showStatus('🃏 Nueva ronda. Apuesta tus fichas para empezar.', 'info');
    }

    /* ═══════════════════════════════════════
       Init on DOM ready
       ═══════════════════════════════════════ */

    document.addEventListener('DOMContentLoaded', () => {
        nuevaPartida();
    });

    /* ─── API pública ─── */
    return {
        pedirCarta,
        plantarse,
        toggleBetPanel,
        ajustarApuesta,
        confirmarApuesta,
        nuevaPartida,
        gastarCervezas
    };

})();

/* Exponer funciones globales para los onclick del HTML */
function pedirCarta() { SieteYMedio.pedirCarta(); }
function plantarse() { SieteYMedio.plantarse(); }
function toggleBetPanel() { SieteYMedio.toggleBetPanel(); }
function ajustarApuesta(n) { SieteYMedio.ajustarApuesta(n); }
function confirmarApuesta() { SieteYMedio.confirmarApuesta(); }
function gastarCervezas(n, e) { SieteYMedio.gastarCervezas(n, e); }
