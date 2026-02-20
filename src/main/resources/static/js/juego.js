"use strict";
/**
 * ══════════════════════════════════════════
 *  Siete y Medio — Versión Reducida (Entrega)
 * ══════════════════════════════════════════
 *
 *  Reglas Simplificadas:
 *   - Solo un jugador (Tú).
 *   - Sin apuestas obligatorias.
 *   - Objetivo: acercarse a 7.5.
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
    const FICHAS_ESTATICAS = 500;
    const CERVEZAS_ESTATICAS = 10;
    let fichas = FICHAS_ESTATICAS;
    let cervezas = CERVEZAS_ESTATICAS;
    /* ─── Estado ─── */
    let mesa = [];
    let gameOver = false;
    let gameStarted = false;
    const players = [
        { name: 'Tú', cards: [], score: 0, standing: false, active: true },
        { name: null, cards: [], score: 0, standing: false, active: false },
        { name: null, cards: [], score: 0, standing: false, active: false },
        { name: null, cards: [], score: 0, standing: false, active: false }
    ];
    const MY_INDEX = 0;
    /* ─── Baraja ─── */
    function crearBaraja() {
        mesa = [];
        for (const p of PALOS) {
            for (const n of NUMS) {
                mesa.push({ code: n + p, num: n, palo: p });
            }
        }
        for (let i = mesa.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [mesa[i], mesa[j]] = [mesa[j], mesa[i]];
        }
    }
    function robarCarta() { return mesa.pop(); }

    function valorCarta(carta) {
        if (FIGURAS.includes(carta.num)) return 0.5;
        return parseInt(carta.num, 10);
    }

    function nombreCarta(carta) {
        const numNombre = { '1': 'As', 'S': 'Sota', 'C': 'Caballo', 'R': 'Rey' };
        return (numNombre[carta.num] || carta.num) + ' de ' + PALO_NOMBRES[carta.palo];
    }


    function createCardImg(carta) {
        const img = document.createElement('img');
        img.src = IMG_BASE + carta.code + '.png';
        img.className = 'playing-card';
        img.alt = nombreCarta(carta);
        return img;
    }
    function renderCards(idx) {
        const zone = document.getElementById('cards-' + idx);
        if (!zone) return;
        zone.innerHTML = '';
        players[idx].cards.forEach(c => zone.appendChild(createCardImg(c)));
    }


    function showStatus(msg, type = 'info') {
        const el = document.getElementById('gameStatus');
        if (!el) return;
        el.className = 'game-status mt-3 mx-auto show alert alert-' + type;
        el.style.maxWidth = '500px';
        el.innerHTML = msg;
    }
    /* ─── Acciones ─── */
    function pedirCarta() {
        if (gameOver || !gameStarted) return;
        const p = players[MY_INDEX];
        const carta = robarCarta();
        if (!carta) return;
        p.cards.push(carta);
        p.score += valorCarta(carta);
        p.score = Math.round(p.score * 10) / 10;
        renderCards(MY_INDEX);

        if (p.score > LIMITE) determinarResultado();
    }
    function plantarse() {
        if (gameOver || !gameStarted) return;
        players[MY_INDEX].standing = true;
        determinarResultado();
    }
    function determinarResultado() {
        gameOver = true;

        const p = players[MY_INDEX];
        if (p.score > LIMITE) {
            showStatus('😞 Te has pasado con ' + p.score + '. ¡Suerte la próxima!', 'danger');
        } else {
            showStatus('🎉 ¡Buen juego! Has sacado ' + p.score);
        }

        document.getElementById('btnPedirCarta').disabled = true;
        document.getElementById('btnPlantarse').disabled = true;
        mostrarBotonNuevaPartida();
    }
    function mostrarBotonNuevaPartida() {
        if (document.getElementById('btnNuevaPartida')) return;
        const btn = document.createElement('button');
        btn.id = 'btnNuevaPartida';
        btn.className = 'btn btn-success px-4 mt-2';
        btn.innerHTML = '🔄 Nueva Partida';
        btn.onclick = () => SieteYMedio.nuevaPartida();
        document.getElementById('gameActions').appendChild(btn);
    }

    function mostrarApuesta() {
        const panel = document.getElementById('betPanel');
        if (panel) panel.classList.toggle('show');
    }


    function nuevaPartida() {
        gameOver = false;
        gameStarted = true;
        players[0].cards = [];
        players[0].score = 0;
        players[0].standing = false;
        crearBaraja();
        const btnN = document.getElementById('btnNuevaPartida');
        if (btnN) btnN.remove();
        document.getElementById('btnPedirCarta').disabled = false;
        document.getElementById('btnPlantarse').disabled = false;
        showStatus('🃏 ¡Comienza la ronda! Pide carta cuando quieras.', 'info');
    }

    document.addEventListener('DOMContentLoaded', () => nuevaPartida());

    return {
        pedirCarta,
        plantarse,
        nuevaPartida,
        mostrarApuesta,
        gastarCervezas: () => { }
    };
})();
// Globales para HTML
const pedirCarta = () => SieteYMedio.pedirCarta();
const plantarse = () => SieteYMedio.plantarse();
const nuevaPartida = () => SieteYMedio.nuevaPartida();
const mostrarApuesta = () => SieteYMedio.mostrarApuesta();


