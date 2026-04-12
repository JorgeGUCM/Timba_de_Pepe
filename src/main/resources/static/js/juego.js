/* Cartas */
const PALOS = ['B', 'C', 'E', 'O'];
const PALO_NOMBRES = { B: 'Bastos', C: 'Copas', E: 'Espadas', O: 'Oros' };
const NUMS = ['1', '2', '3', '4', '5', '6', '7', 'S', 'C', 'R'];
const FIGURAS = ['S', 'C', 'R'];
const IMG_BASE = '/img/baraja/';
const REVERSO = IMG_BASE + 'reverso1.png';

const LIMITE = 7.5;
const MIN_BET = 10; 

const ESTADO_JUEGO = {ESPERA: 0, COMPLETA: 1, JUGANDO: 2, FINALIZADO: 3};
let estado = ESTADO_JUEGO.ESPERA;
let miJugadorId = null;

const players = [
    { name: null, cards: [], score: 0, bet: 0, standing: false, active: false },
    { name: null, cards: [], score: 0, bet: 0, standing: false, active: false },
    { name: null, cards: [], score: 0, bet: 0, standing: false, active: false },
    { name: null, cards: [], score: 0, bet: 0, standing: false, active: false }
];
let playerIndex;
let num_players = 0;

let elemFichas = document.querySelector("#fichas");
let elemCervezas = document.querySelector("#cervezas");

let playerDisplay = "active-";
let playerSlot = "slot-";
let playerEsperando = `<span class="badge bg-secondary">Esperando...</span>`;
let playerActivo = `<span class="badge bg-success">Activo</span>`;
let playerPlantado = `<span class="badge bg-warning">Plantado</span>`;
let playerOver = `<span class="badge bg-danger">Sobrepuntos</span>`;
let playerCards = "cards-";
let playerScore = "score-";

let elemMensaje = document.querySelector("#mensaje");
let elemApuesta = document.querySelector("#apuesta");

let btnPedir = document.querySelector("#btnPedir");
let btnPlantarse = document.querySelector("#btnPlantarse");
let btnApostar = document.querySelector("#btnApostar");
let targetBtn = document.querySelector("#target-btnNueva");

let elemPanelApuesta = document.querySelector("#panelApuesta");
let elemCantApuesta = document.querySelector("#cantApuesta");
let btnConfirmApuesta = document.querySelector("#btnConfirmApuesta"); 
let btnCancelApuesta = document.querySelector("#btnCancelApuesta");

let fichas = 0;
let cervezas = 0;

/* ------------ Otras funciones ------------ */
function valorCarta(carta){
    if(FIGURAS.includes(carta.num))
        return 0.5;
    else
        return parseInt(carta.num, 10);
}
function nombreCarta(carta){
    let numNombre = { '1': 'As', 'S': 'Sota', 'C': 'Caballo', 'R': 'Rey' };
    return (numNombre[carta.num] || carta.num) + ' de ' + PALO_NOMBRES[carta.palo];
}
function createCardImg(carta){
    let img = document.createElement('img');
    img.src = IMG_BASE + carta.code + '.png';
    img.className = 'carta-jugador';
    img.alt = nombreCarta(carta);
    img.draggable = false;
    return img;
}
function createCardReverse(){
    let img = document.createElement('img');
    img.src = REVERSO;
    img.className = 'carta-jugador';
    img.alt = "Reverso de carta";
    img.draggable = false;
    return img;
}

/* ------------ Funciones de apoyo a pintar ------------ */
function mostrarMonedas(f, c){
    elemFichas.innerHTML = f;
    elemCervezas.innerHTML = c;
}
function mostarJugadores(){
    let i = 1;
    players.forEach((p) => {
        let display = "#"+playerDisplay+i;
        let slot = "#"+playerSlot+i;
        let score = "#"+playerScore+i;
        
        // Aquí arreglamos el fallo visual del Player 2
        let nombreJugador = (p.name && p.name !== "null") ? p.name : "Jugador " + i;

        // Mostrar puntos o interrogación dependiendo del estado global de la partida
        let puntosAMostrar = "?";
        if (estado === ESTADO_JUEGO.FINALIZADO || i === playerIndex) {
            puntosAMostrar = p.score;
        }

        if(p.score > LIMITE){
            document.querySelector(display).innerHTML = `🃏 ` + nombreJugador + " " + playerOver;
            document.querySelector(slot).classList.remove("empty");
            document.querySelector(score).innerHTML = puntosAMostrar;
        }else if(p.standing){
            document.querySelector(display).innerHTML = `🃏 ` + nombreJugador + " " + playerPlantado;
            document.querySelector(slot).classList.remove("empty");
            document.querySelector(score).innerHTML = puntosAMostrar;
        }else if(p.name !== null){
            // Si tiene nombre, está en la sala (esperando o jugando)
            document.querySelector(display).innerHTML = `🃏 ` + nombreJugador + " " + playerActivo;
            document.querySelector(slot).classList.remove("empty");
            document.querySelector(score).innerHTML = puntosAMostrar;
        }else{
            document.querySelector(display).innerHTML = playerEsperando;
            document.querySelector(slot).classList.add("empty");
            document.querySelector(score).innerHTML = "-";
        }
        i++;
    });
}
function mensaje(texto, tipo = "info"){
    elemMensaje.innerHTML = texto;
    elemMensaje.classList.value = "estado-juego text-center mt-3 mx-auto show alert alert-"+tipo;
}
function mensajeHide(){
    elemMensaje.classList.remove("show");
}
function apostarPanelShow(){
    elemPanelApuesta.classList.add("show");
}
function apostarPanelHide(){
    elemPanelApuesta.classList.remove("show");
}
function actualizarPuntos(score, indexPlayer){
    if(indexPlayer == playerIndex || estado === ESTADO_JUEGO.FINALIZADO) {
        document.querySelector("#"+playerScore+indexPlayer).innerHTML = score;
    } else {
        document.querySelector("#"+playerScore+indexPlayer).innerHTML = "?";
    }
}

function renderCards(cards, indexPlayer){
    let target = document.querySelector("#"+playerCards + indexPlayer);
    target.innerHTML = '';
    
    // IMPORTANTE: Revelar las cartas si somos nosotros, O si el juego está finalizado.
    if(indexPlayer == playerIndex || estado === ESTADO_JUEGO.FINALIZADO) {
        cards.forEach(c => target.appendChild(createCardImg(c)));
    } else {
        cards.forEach(() => target.appendChild(createCardReverse()));
    }
}
/* ------------ Pintar Estado ------------ */
function actualizarTablero(estado){
    // Función que pintara la información del tablero
}

function entrarPartida(){
    const urlParams = new URLSearchParams(window.location.search);
    const idTablero = urlParams.get("id");

    let headers = { 'Content-Type': 'application/json' }
    if (typeof config !== 'undefined' && config.csrf && config.csrf.name)
        headers[config.csrf.name === '_csrf' ? 'X-CSRF-TOKEN' : config.csrf.name] = config.csrf.value;

    fetch(`/juego/${idTablero}/entrar`, {
        method: 'POST',
        headers: headers
    })
    .catch( error => console.error("Error al entrar en partida", error));
}

document.addEventListener("DOMContentLoaded", e => entrarPartida());

ws.receive = (mensajeStr) => {
    let payload = typeof mensajeStr === 'string' ? JSON.parse(mensajeStr) : 
                  (mensajeStr.body ? JSON.parse(mensajeStr.body) : mensajeStr);

    console.log(payload);
};

window.addEventListener('beforeunload', function () {
    /* const urlParams = new URLSearchParams(window.location.search);
    const juegoId = urlParams.get('id');

    if (juegoId && miJugadorId) {
        let headers = { 'Content-Type': 'application/json' };
        if (typeof config !== 'undefined' && config.csrf && config.csrf.name) {
            headers[config.csrf.name === '_csrf' ? 'X-CSRF-TOKEN' : config.csrf.name] = config.csrf.value;
        }
        fetch(`/juego/${juegoId}/salir`, { 
            method: 'POST', 
            headers: headers, 
            keepalive: true 
        });
    } */
});