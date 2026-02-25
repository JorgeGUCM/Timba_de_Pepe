
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

// Estado del juego
const ESTADO_JUEGO = {ESPERA: 0, COMPLETA: 1, JUGANDO: 2, FINALIZADO: 3};
let estado = ESTADO_JUEGO.ESPERA;

// Jugadores 4 maximo
const players = [
    { name: null, cards: [], score: 0, bet: 0, standing: false, active: true },
    { name: null, cards: [], score: 0, bet: 0, standing: false, active: false },
    { name: null, cards: [], score: 0, bet: 0, standing: false, active: false },
    { name: null, cards: [], score: 0, bet: 0, standing: false, active: false }
];
let num_players = 0;

const MY_INDEX = 0;

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



/*
-------------------
    Miscelaneos
-------------------
*/

// Para finalizar el juego
function determinarResultado() {
    estado = ESTADO_JUEGO.FINALIZADO;

    const p = players[0];
    if (p.score > LIMITE) {
        mostrarEstado('😞 Te has pasado con ' + p.score + '. ¡Suerte la próxima!', 'danger');
    } else {
        mostrarEstado('🎉 ¡Buen juego! Has sacado ' + p.score);
    }

    document.getElementById('btnPedirCarta').disabled = true;
    document.getElementById('btnPlantarse').disabled = true;
    mostrarBotonNuevaPartida();
}

// Para la baraja
function barajar(baraja){
    for (let i = baraja.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
    }
    return baraja;
}

function crearBaraja(baraja) {
    baraja = [];
    for (const p of PALOS) {
        for (const n of NUMS) {
            baraja.push({ code: n + p, num: n, palo: p });
        }
    }
    return barajar(baraja);
}

// Para el boton de nueva partida
function mostrarBotonNuevaPartida() {
    if (document.getElementById('btnNueva')) return;
    let target = document.querySelector("#target_btnNueva");
    target.innerHTML = `
    <button class="btn btn-success px-4 mt-2" id="btnNueva">🔄 Nueva Partida</button>
    `;

    let nueva = document.querySelector("#btnNueva");
    nueva.onclick = () => nuevaPartida();
    return nueva;
}

// Para las fichas y cervezas
function actualizarCartera(fichas, cervezas) {
    document.getElementById('fichas').innerHTML = fichas;
    document.getElementById('cervezas').innerHTML = cervezas;
}

// Para debug
function staticStart(){
    for (let i = 0; i < 4; i++) {
        players[i].name = "Player " + i;
        players[i].active = true;
        players[i].standing = false;
        players[i].score = 0;
        players[i].bet = 0;
        players[i].cards = [];
    }
}

/*
---------------
    Botones
---------------
*/

// Plantarse
let btnPlantarse = document.querySelector("#btnPlantarse");
btnPlantarse.onclick = () => plantarse();
function plantarse() {
    if (estado == ESTADO_JUEGO.ESPERA || estado == ESTADO_JUEGO.FINALIZADO) return;
    
    // Recibiriamos el indice del jugador
    players[0].standing = true;
    console.log("El jugador se ha plantado!");

    determinarResultado();
}

// Estados de mesa
function nuevaPartida() {
    estado = ESTADO_JUEGO.JUGANDO;

    console.log("El juego a empezado")

    // Debug only
    staticStart();

    let baraja = [];
    baraja = crearBaraja(baraja);
    console.log("La baraja a sido creada y barajada");
    console.log(baraja);

    document.getElementById('btnNueva').remove();
    
    document.querySelector("#btnPedirCarta").disabled = false;
    document.querySelector("#btnPlantarse").disabled = false;

    const mensaje = document.getElementById('apuestaActualDisplay');
    if (mensaje) mensaje.classList.remove('show');
    mostrarEstado('🃏 ¡Comienza la ronda! Pide carta cuando quieras.', 'info');
}

function mesaEspera() {
    estado = ESTADO_JUEGO.ESPERA;

    console.log("Juego ha entrado en modo espera");

    // Poner aqui fichas del usuario
    actualizarCartera(FICHAS_ESTATICAS, CERVEZAS_ESTATICAS);

    mostrarBotonNuevaPartida().disabled = true;

    document.querySelector("#btnPedirCarta").disabled = true;
    document.querySelector("#btnPlantarse").disabled = true;
}

// Para apostar
let apostar = document.querySelector("#apostar");
apostar.onclick = () => apuestaInicial(apostar);

function nuevaApuesta(){
    let apuesta = document.querySelector("#apuesta");
    let bet = parseInt(document.getElementById('cantidadApuesta').value, 10);
    if(bet > 0){
        players[0].bet += bet;
        // Muestra la nueva apuesta
        apuesta.innerHTML = players[0].bet;
        mostrarApuesta();
    }
}

function apuestaInicial(apostar){
    let apuesta = document.querySelector("#apuesta");
    let bet = parseInt(document.getElementById('cantidadApuesta').value, 10);
    if(bet >= MIN_BET){
        players[0].bet = bet;
        // Muestra la apuesta inicial
        apuesta.innerHTML = bet;
        
        document.querySelector("#btnNueva").disabled = false;
        apostar.onclick = () => nuevaApuesta();
        mostrarApuesta();
    }
    
}

// Para el panel de apostar
document.querySelector("#btnApostar").onclick = () => mostrarApuesta();
document.querySelector("#btnCancelarApuesta").onclick = () => mostrarApuesta();
function mostrarApuesta(){
    document.querySelector("#panelApuesta").classList.toggle("show");
}

function ajustarApuesta(n) {
    const input = document.getElementById('cantidadApuesta');
    if (!input) return;
    let val = parseInt(input.value, 10) || 0;
    val += n;
    if (val < 1) val = 1;
    input.value = val;
}

// Para controlar el estado del juego
document.addEventListener('DOMContentLoaded', () => controlador());
function controlador(){
    // Se cargara info del backend
    if(estado == ESTADO_JUEGO.ESPERA)
        mesaEspera();
    else
        nuevaPartida();
}