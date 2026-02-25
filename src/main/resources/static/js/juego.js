
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
let playerIndex;
let num_players = 0;

/* 
---------------------------
    Elementos del DOM
---------------------------
*/
let elemFichas = document.querySelector("#fichas");
let elemCervezas = document.querySelector("#cervezas");

let playerDisplay = "active-";
let playerSlot = "slot-";
let playerEsperando = `<span class="badge bg-secondary">Esperando...</span>`;
let playerActivo = `<span class="badge bg-success">Activo</span>`;
let playerPlantado = `<span class="badge bg-warning">Plantado</span>`;
let playerOver = `<span class="badge bg-danger">Sobrepuntos</span>`;
let playerCards = "card-";
let playerScore = "score-";

let elemMensaje = document.querySelector("#mensaje");
let elemApuesta = document.querySelector("#apuesta");

let btnPedir = document.querySelector("#btnPedir");
let btnPlantarse = document.querySelector("#btnPlantarse");
let btnApostar = document.querySelector("#btnApostar");
let targetBtn = document.querySelector("#target-btnNueva");
let elemBtnNueva = `<button class="btn btn-success px-4 mt-2" id="btnNueva">🔄 Iniciar Partida</button>`;

let elemPanelApuesta = document.querySelector("#panelApuesta");
let elemCantApuesta = document.querySelector("#cantApuesta");

let btnConfirmApuesta = document.querySelector("#btnConfirmApuesta"); 
let btnCancelApuesta = document.querySelector("#btnCancelApuesta");

let btnSonido = document.querySelector("#ponerSonido");

// Fichas y cervezas del jugador
let fichas = 0;
let cervezas = 0;

/*
------------------
    Miscelaneo
------------------
*/
function mostrarMonedas(f, c){
    elemFichas.innerHTML = f;
    elemCervezas.innerHTML = c;
}

// Para jugadores
function loadPlayers(){
    // Recibira info de BD o algo y cargara datos
    for (let i = 0; i < 3; i++) {
        players[i].name = "Player " + i;
        players[i].bet = 0;
        players[i].score = 0;
        players[i].active = true;
        players[i].standing = false;
        players[i].cards = [];
        num_players++;
    }

    // Se recibira el numero de jugador de este usuario
    playerIndex = 1;
}

function mostarJugadores(){
    let i = 1;
    players.forEach((p) => {
        let display = "#"+playerDisplay+i;
        let slot = "#"+playerSlot+i;
        let score = "#"+playerScore+i;
        if(p.active){
            document.querySelector(display).innerHTML = `Player ` + i + " " + playerActivo;
            document.querySelector(slot).classList.remove("empty");
            document.querySelector(score).innerHTML = 0;
        }else{
            document.querySelector(display).innerHTML = playerEsperando;
            document.querySelector(slot).classList.add("empty");
            document.querySelector(score).innerHTML = "-";
        }
        i++;
    });
}

// Botones
function crearBtnNueva(){
    targetBtn.innerHTML = elemBtnNueva;
    return document.querySelector("#btnNueva");
}

function eliminarBtnNueva(){
    targetBtn.inner = null;
}

// Para UI de mensajes
function mensaje(texto, tipo = "info"){
    elemMensaje.innerHTML = texto;
    elemMensaje.classList.value = "estado-juego mt-3 mx-auto show alert alert-"+tipo;
}
function mensajeHide(){
    elemMensaje.classList.remove("show");
}

// Para la baraja
function construirBaraja(){
    let baraja = [];
    for (const p of PALOS) {
        for (const n of NUMS) {
            baraja.push({ code: n + p, num: n, palo: p });
        }
    }
    return baraja;
}
function barajar(baraja){
    for (let i = baraja.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
    }
    return baraja;
}

// Para apostar
function apostarPanelShow(){
    elemPanelApuesta.classList.add("show");
}
function apostarPanelHide(){
    elemPanelApuesta.classList.remove("show");
}
function ajustarApuesta(n){
    let cant =  parseInt(elemCantApuesta.value, 10) || 0;
    if(cant + n > 0 && cant + n < 1000)
        elemCantApuesta.value = cant + n;
    else if(cant + n > 1000)
        elemCantApuesta.value = 1000;
    else
        elemCantApuesta.value = 1;
}

function apuestaComfirm(){
    let bet = parseInt(elemCantApuesta.value, 10);
    let total_bet = players[playerIndex].bet + bet;
    if(total_bet > 0 && fichas >= total_bet){
        fichas -= bet;
        mostrarMonedas(fichas, cervezas);

        players[playerIndex].bet = total_bet;
        elemApuesta.innerHTML = total_bet;

        mensajeHide();
    } else if (total_bet < 0)
        mensaje("Debe ser positiva la apuesta!");
    else
        mensaje("No tienes suficientes fichas!", "danger");

    apostarPanelHide();
}
function apuestaInicial(){
    let bet = parseInt(elemCantApuesta.value, 10);
    if(bet < MIN_BET){
        mensaje("La apuesta minima es de 10", "info");
        return;
    }

    if(fichas < bet){
        mensaje("No tienes suficientes fichas!", "danger");
        return;
    }
    
    fichas -= bet;
    mostrarMonedas(fichas, cervezas);

    players[playerIndex].bet = bet;
    elemApuesta.innerHTML = bet;

    mensajeHide();
    document.querySelector("#btnNueva").disabled = false;
    btnConfirmApuesta.onclick = () => apuestaComfirm();

    apostarPanelHide();
}

// Plantarse y fin del juego
function resultado(){
    mensaje("Has ganado / perdido, esto es estatico no lo sabemos!", "success");
}

function plantarse(){
    players[playerIndex].standing = true;

    btnPedir.disabled = true;
    btnPlantarse.disabled = true;

    mensaje("Te has plantado con: " + players[playerIndex].score + ". Esperando al resto de jugadores...", "info");

    document.querySelector("#"+playerDisplay+playerIndex).innerHTML = "Player " + playerIndex + " " + playerPlantado;

    // Comprobamos si todos los jugadores se han plantado o perdido
    let ended = true;
    players.forEach((p) => {
        if(!p.standing || p.score <= LIMITE){
            ended = false;
        }
    });

    if(ended){
        estado = ESTADO_JUEGO.FINALIZADO;
        resultado();
    }
}

// Sistema de cartas
function pedir(baraja){
    console.log("Pediste una carta");
}

/*
-------------------------
    Logica del Juego
-------------------------
*/
function inicioPartida(){
    estado = ESTADO_JUEGO.JUGANDO;

    btnPedir.disabled = false;
    btnPlantarse.disabled = false;

    eliminarBtnNueva();

    let baraja = construirBaraja();
    baraja = barajar(baraja);
    console.log(baraja);

    btnPlantarse.onclick = () => plantarse();
    btnPedir.onclick = () => pedir(baraja);

    mensaje("¡¡¡Inicio del Siete y Medio!!!", "success");
}

document.addEventListener('DOMContentLoaded', () => gameController());
function gameController(){
    console.log("Iniciado controlador del juego");

    // Se cargan las fichas y cervezas del jugador
    fichas = FICHAS_ESTATICAS;
    cervezas = CERVEZAS_ESTATICAS;
    mostrarMonedas(fichas, cervezas);

    // Cargamos jugadores
    loadPlayers();
    mostarJugadores();

    // Estado inicial del juego
    estado = (num_players < 4)? ESTADO_JUEGO.ESPERA : ESTADO_JUEGO.COMPLETA;

    // Creamos boton de iniciar partida (solo activo cuando hay apuesta minima)
    let nueva = crearBtnNueva();
    nueva.disabled = true;
    nueva.onclick = () => inicioPartida();

    btnPlantarse.disabled = true;
    btnPedir.disabled = true;
}

btnApostar.onclick = () => apostarPanelShow();
btnCancelApuesta.onclick = () => apostarPanelHide();
btnConfirmApuesta.onclick = () => apuestaInicial();
//btnSonido.onclick = () => sonido();