
/* Cartas */
const PALOS = ['B', 'C', 'E', 'O'];
const PALO_NOMBRES = { B: 'Bastos', C: 'Copas', E: 'Espadas', O: 'Oros' };
const NUMS = ['1', '2', '3', '4', '5', '6', '7', 'S', 'C', 'R'];
const FIGURAS = ['S', 'C', 'R'];
const IMG_BASE = '/img/baraja/';
const REVERSO = IMG_BASE + 'reverso1.png';

// Limite de puntos
const LIMITE = 7.5;
// apuesta minima
const MIN_BET = 10; 

// Estado del juego
const ESTADO_JUEGO = {ESPERA: 0, COMPLETA: 1, JUGANDO: 2, FINALIZADO: 3};
let estado = ESTADO_JUEGO.ESPERA;
let miJugadorId = null;

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

// se hace que se actualice algo, y cada vez que se inicie el juego
// notificacion de web sockets -> cargarPartida()
// regenera toda la vista
// - Referencia al archivo juego.js original proporcionado
function cargarPartida(){
    // 1. Leer los datos reales que el servidor (Thymeleaf) ha puesto en el HTML
    fichas = parseInt(document.querySelector("#fichas").innerText) || 0;
    cervezas = parseInt(document.querySelector("#cervezas").innerText) || 0;
    
    let inputNombre = document.querySelector("#miNombreUsuario");
    let miNombre = inputNombre ? inputNombre.value : "Jugador Local";

    let inputId = document.querySelector("#miJugadorId");
    miJugadorId = inputId ? parseInt(inputId.value) : null;
    // 2. Configurar la sesión básica del jugador
    // Asignamos que este usuario ocupa el Slot 1 (temporalmente, para que tu frontend funcione)
    playerIndex = 1;    
    num_players = 1;
    estado = ESTADO_JUEGO.ESPERA;
    
    // 3. Registrar al jugador en la lógica del juego
    players[playerIndex - 1] = {
        name: miNombre,
        cards: [],
        score: 0,
        bet: 0,
        standing: false,
        active: true
    };

    // 4. Pintar su nombre real en el tablero (sustituyendo el "Player 1" genérico)
    document.querySelector("#active-" + playerIndex).innerHTML = 
        `🃏 ${miNombre} <span class="badge bg-success">Activo</span>`;
        
    console.log(`Partida cargada. Usuario: ${miNombre} | Fichas: ${fichas}`);
}
// Para jugadores
function loadPlayers(){
    // Recibira info de BD o algo y cargara datos

/*     for (let i = 0; i < 2; i++) {
        players[i].name = "Player " + i;
        players[i].bet = 0;
        players[i].score = 0;
        players[i].active = true;
        players[i].standing = true;
        players[i].cards = [];
        num_players++;
    }

    players[1].cards[0] = {"code": "RB","num": "R","palo": "B"};

    players[0].standing = false;
    // Se recibira el numero de jugador de este usuario
    playerIndex = 1; */
}
function mostarJugadores(){
    let i = 1;
    players.forEach((p) => {
        let display = "#"+playerDisplay+i;
        let slot = "#"+playerSlot+i;
        let score = "#"+playerScore+i;
        
        // Comprobamos si el jugador tiene un nombre asignado, si no, le ponemos Player X
        let nombreJugador = p.name ? p.name : "Player " + i;

        if(p.score >= LIMITE){
            document.querySelector(display).innerHTML = `🃏 ` + nombreJugador + " " + playerOver;
            document.querySelector(slot).classList.remove("empty");
            document.querySelector(score).innerHTML = p.score;
        }else if(p.standing){
            document.querySelector(display).innerHTML = `🃏 ` + nombreJugador + " " + playerPlantado;
            document.querySelector(slot).classList.remove("empty");
            document.querySelector(score).innerHTML = p.score;
        }else if(p.active){
            document.querySelector(display).innerHTML = `🃏 ` + nombreJugador + " " + playerActivo;
            document.querySelector(slot).classList.remove("empty");
            document.querySelector(score).innerHTML = p.score;
        }else{
            document.querySelector(display).innerHTML = playerEsperando;
            document.querySelector(slot).classList.add("empty");
            document.querySelector(score).innerHTML = "-";
        }
        i++;
    });
}
// Comprobar si e juega a acabado
function gameEnded(){
    let ended = true;
    players.forEach((p) => {
        if(!p.standing && p.score <= LIMITE && p.active){
            ended = false;
        }
    });

    if(ended){
        estado = ESTADO_JUEGO.FINALIZADO;
        resultado();
    }
}

// Botones
function crearBtnNueva(texto){
    targetBtn.innerHTML =
    `<button class="btn btn-success px-4" id="btnNueva">`+ texto +`</button>`;;
    return document.querySelector("#btnNueva");
}

function eliminarBtnNueva(){
    targetBtn.innerHTML = null;
}

// Para UI de mensajes
function mensaje(texto, tipo = "info"){
    elemMensaje.innerHTML = texto;
    elemMensaje.classList.value = "estado-juego mt-3 mx-auto show alert alert-"+tipo;
}
function mensajeHide(){
    elemMensaje.classList.remove("show");
}
function playerEstado(index, texto){
    document.querySelector("#"+playerDisplay+index).innerHTML = texto;
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
    let total_bet = players[playerIndex-1].bet + bet;
    if(total_bet > 0 && fichas >= total_bet){
        fichas -= bet;
        mostrarMonedas(fichas, cervezas);

        players[playerIndex-1].bet = total_bet;
        elemApuesta.innerHTML = total_bet;

        mensajeHide();
        guardarEstadoEnBD();
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

    players[playerIndex-1].bet = bet;
    elemApuesta.innerHTML = bet;

    mensajeHide();
    document.querySelector("#btnNueva").disabled = false;
    btnConfirmApuesta.onclick = () => apuestaComfirm();

    apostarPanelHide();
    guardarEstadoEnBD();
}

// Plantarse y fin del juego// Plantarse y fin del juego
function resultado(){
    let p = players[playerIndex-1];

    // 1. Calculamos premios
    if(p.score <= LIMITE) {
        // GANA: Multiplicamos la apuesta x2. 
        let premio = p.bet * 2;
        fichas += premio;
        p.ganancias = premio;
        mostrarMonedas(fichas, cervezas);
        mensaje("¡Has ganado la ronda! Recibes " + premio + " fichas.", "success");
    } else {
        // PIERDE: No sumamos nada porque ya se descontó.
        p.ganancias = -p.bet;
        mensaje("Te has pasado de 7.5. Has perdido tus fichas apostadas.", "danger");
    }

    // 2. Guardamos su dinero final en la base de datos
    guardarEstadoEnBD();

    // 3. Modificamos el botón para que pida una nueva fila (de forma segura con CSRF)
    // Creamos el botón visualmente
    crearBtnNueva("🔄 Reiniciar Tablero");
    
   // Lo buscamos en el DOM explícitamente y le añadimos el evento
    let btnReiniciarDOM = document.querySelector("#btnNueva");
    if (btnReiniciarDOM) {
        btnReiniciarDOM.onclick = function() {
            console.log("Pidiendo nueva ronda al servidor...");
            
            // --- NUEVO: CSRF con el objeto global config ---
            let headers = { 'Content-Type': 'application/json' };
            if (typeof config !== 'undefined' && config.csrf && config.csrf.name) {
                let csrfHeaderName = config.csrf.name === '_csrf' ? 'X-CSRF-TOKEN' : config.csrf.name;
                headers[csrfHeaderName] = config.csrf.value;
            }
            // -----------------------------------------------

            fetch(`/jugador/${miJugadorId}/nueva-ronda`, { 
                method: 'POST',
                headers: headers // <-- Pasamos la cabecera de seguridad correcta
            })
            .then(response => response.json())
            .then(data => {
                if(data.nuevoId) {
                    console.log("Nueva ronda creada con ID: " + data.nuevoId);
                    document.querySelector("#miJugadorId").value = data.nuevoId;
                    miJugadorId = data.nuevoId; 
                    gameController(); 
                } else {
                    console.error("El servidor no devolvió un nuevoId", data);
                }
            })
            .catch(error => console.error("Error al pedir nueva ronda", error));
        };
    }
}

function plantarse(){
    players[playerIndex-1].standing = true;

    btnPedir.disabled = true;
    btnPlantarse.disabled = true;

    mensaje("Te has plantado con: " + players[playerIndex-1].score + ". Esperando al resto de jugadores...", "info");

    playerEstado(playerIndex, "Player " + playerIndex + " " + playerPlantado)

    // Comprobamos si todos los jugadores se han plantado o perdido
    gameEnded();
}

// Sistema de cartas
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

function renderCards(cards, indexPlayer){
    let target = document.querySelector("#"+playerCards + indexPlayer);
    target.innerHTML = '';
    // Si es un contrincante cartas del reves
    if(indexPlayer == playerIndex)
        cards.forEach(c => target.appendChild(createCardImg(c)));
    else
        cards.forEach(() => target.appendChild(createCardReverse()));
}

function actualizarPuntos(score, indexPlayer){
    document.querySelector("#"+playerScore+indexPlayer).innerHTML = score;
}
function guardarEstadoEnBD() {
    if (!miJugadorId) return; 
    
    let p = players[playerIndex - 1];
    
    let estadoActual = "ACTIVO";
    if (p.score > LIMITE) estadoActual = "SOBREPUNTOS";
    else if (p.standing) estadoActual = "PLANTADO";
    
    let datos = {
        cartas: p.cards, 
        puntuacion: p.score,
        estado: estadoActual,
        apuesta: p.bet,
        fichas: fichas,
        // Las ganancias solamente se ven al final de la ronda/tablero, cuando ganas o pierdes al final
        ganancias: p.ganancias !== undefined ? p.ganancias : 0
    };

    // --- NUEVO: Usamos el objeto global 'config' de tu plantilla ---
    let headers = {
        'Content-Type': 'application/json'
    };
    
    // Añadimos el token CSRF si está disponible en la configuración
    if (typeof config !== 'undefined' && config.csrf && config.csrf.name) {
        let csrfHeaderName = config.csrf.name === '_csrf' ? 'X-CSRF-TOKEN' : config.csrf.name;
        headers[csrfHeaderName] = config.csrf.value;
    }
    // -------------------------------------------------------------

    fetch(`/jugador/${miJugadorId}/actualizar`, {
        method: 'POST',
        headers: headers, 
        body: JSON.stringify(datos)
    })
    .then(response => {
        if (!response.ok) console.error("Error al guardar en BD:", response.status);
        else console.log("Apuesta y estado guardados en BD correctamente");
    })
    .catch(error => console.error("Error de conexión:", error));
}
function pedir(baraja){
    let p = players[playerIndex-1];
    if(!p.standing && p.score <= LIMITE){
        baraja = barajar(baraja);
        let carta = baraja.pop();
        p.cards.push(carta);
        p.score += valorCarta(carta);
        p.score = Math.round(p.score * 10) / 10;

        actualizarPuntos(p.score, playerIndex);
        renderCards(p.cards, playerIndex);
        
        if(p.score <= LIMITE){
        guardarEstadoEnBD();
        }
    }

    if(p.score > LIMITE){
        btnPedir.disabled = true;
        btnPlantarse.disabled = true;
        
        playerEstado(playerIndex, "🃏 " + p.name + " " + playerOver);
        gameEnded(); // ¡Esto llamará a resultado() automáticamente!
    }
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

    // Cargamos jugadores
    cargarPartida();
    // Se cargan las fichas y cervezas del jugador
    // Las fichas y cervezas ya se han cargado desde el HTML en cargarPartida()
    // Solo necesitamos refrescar la vista visualmente
    mostrarMonedas(fichas, cervezas);

    // Se reinicia la apuesta
    elemApuesta.innerHTML = 0;

  

    mostarJugadores();
    let index = 1;
    players.forEach((p) => {renderCards(p.cards, index); index++;});

    // Estado inicial del juego
    estado = (num_players < 4)? ESTADO_JUEGO.ESPERA : ESTADO_JUEGO.COMPLETA;

    // boton apostar como primera apuesta
    btnConfirmApuesta.onclick = () => apuestaInicial();

    // Creamos boton de iniciar partida (solo activo cuando hay apuesta minima)
    let nueva = crearBtnNueva("🔄 Iniciar Partida");
    nueva.disabled = true;
    nueva.onclick = () => inicioPartida();

    btnPlantarse.disabled = true;
    btnPedir.disabled = true;
}

btnApostar.onclick = () => apostarPanelShow();
btnCancelApuesta.onclick = () => apostarPanelHide();
//btnSonido.onclick = () => sonido();


// Vainas de WS
// Sobreescribimos el comportamiento por defecto al recibir un mensaje
ws.receive = (mensaje) => {
    console.log("¡Actualización de la partida recibida por WS!", mensaje);

    // 1. Si el mensaje es de MI propio jugador, lo ignoramos 
    // (porque mi pantalla ya se actualizó al pulsar el botón localmente)
    if (mensaje.jugadorId === miJugadorId) {
        return;
    }

    // 2. Buscamos qué jugador de nuestro array local es el que ha enviado el mensaje.
    // OJO: Para que esto sea exacto en el futuro, tendrás que asegurarte de que al 
    // inicializar el juego, guardas los IDs reales de la BBDD en el array 'players'.
    // Por ahora, para probar, vamos a suponer que el mensaje es del Player 2.
    let indexRival = 2; 
    let p = players[indexRival - 1]; 

    if (p) {
        // 3. Actualizamos los datos del rival con la información del servidor
        p.cards = mensaje.cartas || [];
        p.score = mensaje.puntuacion || 0.0;
        p.standing = (mensaje.estado === "PLANTADO");
        p.active = true; // Si hace un movimiento, está activo

        // 4. Refrescamos la interfaz visual solo para ese jugador
        actualizarPuntos(p.score, indexRival);
        renderCards(p.cards, indexRival);
        
        // Actualizamos las etiquetas de "Plantado", "Sobrepuntos", etc.
        mostarJugadores();

        // 5. Comprobamos si con este nuevo estado la partida entera ha terminado
        gameEnded();
    }
};