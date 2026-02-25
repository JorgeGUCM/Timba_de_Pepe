
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

let fichas_act = 0;
let cervezas_act = 0;

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

/* 
---------------------------
    Elementos del DOM
---------------------------
*/
let elemFichas = document.querySelector("#fichas");
let elemCervezas = document.querySelector("#cervezas");

let playerDisplay = "activo-";
let playerEsperando = `Esperando...`;
let playerActivo = `<span class="badge bg-success">Activo</span>`;
let playerCards = "card-";
let playerScore = "score-";

let elemMensaje = document.querySelector("#mensaje");
let elemApuesta = document.querySelector("#apuesta");

let btnPedir = document.querySelector("#btnPedir");
let btnPlantarse = document.querySelector("#btnPlantarse");
let btnApostar = document.querySelector("#btnApostar");
let targetBtn = document.querySelector("#target-btnNueva");
let elemBtnNueva = `<button class="btn btn-success px-4 mt-2" id="btnNueva">🔄 Nueva Partida</button>`;

let elemPanelApuesta = document.querySelector("#panelApuesta");
let elemCantApuesta = document.querySelector("#cantApuesta");

let btnConfirmAposta = document.querySelector("#btnConfirmAposta"); 
let btnCancleAposta = document.querySelector("#btnCanelApuesta");

let btnSonido = document.querySelector("#ponerSonido");

document.addEventListener('DOMContentLoaded', () => console.log("Se inicia controlador")); 