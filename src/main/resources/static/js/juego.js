"use strict";

const SieteYMedio = (() => {

    /* Cartas */
    const PALOS = ['B', 'C', 'E', 'O'];
    const PALO_NOMBRES = { B: 'Bastos', C: 'Copas', E: 'Espadas', O: 'Oros' };
    const NUMS = ['1', '2', '3', '4', '5', '6', '7', 'S', 'C', 'R'];
    const FIGURAS = ['S', 'C', 'R'];
    const IMG_BASE = '/img/baraja/';
    const REVERSO = IMG_BASE + 'reverso1.png';

    // Limite de puntos
    const LIMITE = 7.5;

    /* Monedas  */
    const FICHAS_ESTATICAS = 500;
    const CERVEZAS_ESTATICAS = 10;
    const MIN_BET = 10;
    let fichas = FICHAS_ESTATICAS;
    let cervezas = CERVEZAS_ESTATICAS;

    // Estado del juego
    const ESTADO_JUEGO = {ESPERA: 0, COMPLETA: 1, JUGANDO: 2, FINALIZADO: 3};
    let estado;

    // Resultado
    let gameOver = false;

    // Jugadores 4 maximo
    const players = [
        { name: null, cards: [], score: 0, bet: 0, standing: false, active: true },
        { name: null, cards: [], score: 0, bet: 0, standing: false, active: false },
        { name: null, cards: [], score: 0, bet: 0, standing: false, active: false },
        { name: null, cards: [], score: 0, bet: 0, standing: false, active: false }
    ];

    const MY_INDEX = 0;

    function barajar(baraja){
        for (let i = baraja.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
        }
    }

    function crearBaraja(baraja) {
        baraja = [];
        for (const p of PALOS) {
            for (const n of NUMS) {
                baraja.push({ code: n + p, num: n, palo: p });
            }
        }
        barajar(baraja)
    }
    function robarCarta() { return baraja.pop(); }

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
        img.className = 'carta-jugador';
        img.alt = nombreCarta(carta);
        return img;
    }
    function renderCards(idx) {
        const zone = document.getElementById('cards-' + idx);
        if (!zone) return;
        zone.innerHTML = '';
        players[idx].cards.forEach(c => zone.appendChild(createCardImg(c)));
    }


    function mostrarEstado(msg, type = 'info') {
        const el = document.getElementById('estadoJuego');
        if (!el) return;
        el.className = 'estado-juego mt-3 mx-auto show alert alert-' + type;
        el.style.maxWidth = '500px';
        el.innerHTML = msg;
    }


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
            mostrarEstado('😞 Te has pasado con ' + p.score + '. ¡Suerte la próxima!', 'danger');
        } else {
            mostrarEstado('🎉 ¡Buen juego! Has sacado ' + p.score);
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
        const panel = document.getElementById('panelApuesta');
        if (panel) panel.classList.toggle('show');
    }

    function ajustarApuesta(n) {
        const input = document.getElementById('cantidadApuesta');
        if (!input) return;
        let val = parseInt(input.value, 10) || 0;
        val += n;
        if (val < 1) val = 1;
        input.value = val;
    }

    function confirmarApuesta() {
        const input = document.getElementById('cantidadApuesta');
        if (!input) return;
        const val = parseInt(input.value, 10);
        const display = document.getElementById('apuestaActualDisplay');
        if (display) {
            display.innerText = 'Apuesta: ' + val;
            display.classList.add('show');
        }
        mostrarApuesta();
    }

    function actualizarCartera() {
        const fDisplay = document.getElementById('fichasDisplay');
        const cDisplay = document.getElementById('cervezasDisplay');
        if (fDisplay) fDisplay.innerText = fichas;
        if (cDisplay) cDisplay.innerText = cervezas;
    }

    function staticStart(){
        for (let i = 0; i < 4; i++) {
            players[i].name = "Player " + i;
            players[i].active = true;
            players[i].standing = false;
            players[i].score = 0;
            player[i].bet = 0;
            players[i].cards = [];
        }
    }

    function nuevaPartida() {
        gameOver = false;
        estado = ESTADO_JUEGO.ESPERA;

        staticStart();

        let baraja = [];
        crearBaraja(baraja);
        actualizarCartera();
        const btnN = document.getElementById('btnNuevaPartida');
        if (btnN) btnN.remove();
        document.getElementById('btnPedirCarta').disabled = false;
        document.getElementById('btnPlantarse').disabled = false;
        const disp = document.getElementById('apuestaActualDisplay');
        if (disp) disp.classList.remove('show');
        mostrarEstado('🃏 ¡Comienza la ronda! Pide carta cuando quieras.', 'info');
    }

    document.addEventListener('DOMContentLoaded', () => nuevaPartida());

    return {
        pedirCarta,
        plantarse,
        nuevaPartida,
        mostrarApuesta,
        ajustarApuesta,
        confirmarApuesta,
        gastarCervezas: () => { }
    };
})();

//Para poder llamar a las funciones desde el HTML
const pedirCarta = () => SieteYMedio.pedirCarta();
const plantarse = () => SieteYMedio.plantarse();
const nuevaPartida = () => SieteYMedio.nuevaPartida();
const mostrarApuesta = () => SieteYMedio.mostrarApuesta();
const ajustarApuesta = (n) => SieteYMedio.ajustarApuesta(n);
const confirmarApuesta = () => SieteYMedio.confirmarApuesta();


