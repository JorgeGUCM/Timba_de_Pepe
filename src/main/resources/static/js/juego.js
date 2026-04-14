/* Cartas */
const PALOS = ['B', 'C', 'E', 'O'];
const PALO_NOMBRES = { B: 'Bastos', C: 'Copas', E: 'Espadas', O: 'Oros' };
const NUMS = ['1', '2', '3', '4', '5', '6', '7', 'S', 'C', 'R'];
const FIGURAS = ['S', 'C', 'R'];
const IMG_BASE = '/img/baraja/';
const REVERSO = IMG_BASE + 'reverso1.png';

// Toda loa info
/*
    result
    idTablero
    nombreTablero
    estadoJuego
    minBet:
    posJugador
    cartasJugador
    numJugadores
    jugadores: [{
        idJugador
        nombre
        posTablero
        apuesta
        ganancias
        estado
        numCartas
    }]
*/
let info;
let puntos = 0;

// Limites para apostar
const LIMITE = 7.5;

// Enums
const ESTADO_JUEGO = {ESPERANDO: "ESPERANDO", COMPLETO: "COMPLETO", JUGANDO: "JUGANDO", FINALIZADO: "FINALIZADO"};
const ESTADO_JUGADOR = {ESPERANDO: "ESPERANDO", ACTIVO: "ACTIVO", PLANTADO: "PLANTADO", SOBREPUNTOS: "SOBREPUNTOS"}

// Elmentos
let elemFichas = document.querySelector("#fichas");
let elemCervezas = document.querySelector("#cervezas");
let elemMensaje = document.querySelector("#mensaje");

// Para los jugadores
let playerSlot = "slot-";
let playerEsperando = `<span class="badge bg-secondary">Esperando...</span>`;
let playerActivo = `<span class="badge bg-success">Activo</span>`;
let playerPlantado = `<span class="badge bg-warning">Plantado</span>`;
let playerOver = `<span class="badge bg-danger">Sobrepuntos</span>`;

// Botones
let btnPedir = document.querySelector("#btnPedir");
let btnPlantarse = document.querySelector("#btnPlantarse");
let btnApostar = document.querySelector("#btnApostar");
let targetBtn = document.querySelector("#target-btnNueva");

// Para las apuestas
let elemPanelApuesta = document.querySelector("#panelApuesta");
let elemCantApuesta = document.querySelector("#cantApuesta");
let btnConfirmApuesta = document.querySelector("#btnConfirmApuesta"); 
let btnCancelApuesta = document.querySelector("#btnCancelApuesta");

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
function puntosDeCartas(cartas){
    let p = 0;
    cartas.forEach((c) => {
        p += valorCarta(c);
    })
    return p;
}
function mostrarCartera(fichas, cervezas){
    elemFichas.innerHTML = fichas;
    document.querySelector("#display-fichas").innerHTML = fichas;
    elemCervezas.innerHTML = cervezas;
}
function mostrarMensaje(mensaje, tipo = "info"){
    elemMensaje.innerHTML = `
        <p class="fs-5 badge bg-`+tipo+` text-black">`+ mensaje +`</p>
    `;

    if(!elemMensaje.classList.contains("show")){
        elemMensaje.classList.add("show");
        setTimeout(() => {
            elemMensaje.classList.remove("show");
        }, 5000);
    }
}

/* ------------ Funciones de apoyo a pintar ------------ */
function mostrarJugador(slot, nombre, puntosJugador, apuesta, estadoJugador){
    let jugadorDisplay = document.querySelector(slot);

    if(estadoJugador == ESTADO_JUGADOR.ACTIVO)
        nombre += ` ` + playerActivo;
    else if(estadoJugador == ESTADO_JUGADOR.PLANTADO)
        nombre += ` ` + playerPlantado;
    else if(estadoJugador == ESTADO_JUGADOR.SOBREPUNTOS)
        nombre += ` ` + playerOver;
    else
        nombre = playerEsperando;
    
    jugadorDisplay.innerHTML = `
    <div class="jugador-nombre">
    🃏 `+ nombre + `
    </div>
    <div class="zona-cartas" id="cards-1"></div>
    <div class="jugador-puntuacion d-flex gap-3">
        <p class="fw-bold">Puntos: <strong>`+ puntosJugador +`</strong> </p>
        <p class="fw-bold">Apuesta: <strong>`+ apuesta +`</strong>
            <svg style="transform: translate(-3px, -3px); filter:invert(1); width: 1.2em;"
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path
                    d="M471.9 324.8L320 417.6L168 324.8L320 64L471.9 324.8zM320 447.4L168 354.6L320 576L472 354.6L320 447.4z" />
            </svg> 
        </p>
    </div>
    `;
    
    // Jugador de la vista
    if(puntosJugador != "?"){
        jugadorDisplay.classList.add("border-warning");
        jugadorDisplay.querySelectorAll("strong")[1].classList.add("apuesta");
    }
    else
        jugadorDisplay.classList.remove("border-warning");

    if(estadoJugador == ESTADO_JUGADOR.ESPERANDO)
        jugadorDisplay.classList.add("empty");
    else
        jugadorDisplay.classList.remove("empty");

}
function mostrarJugadores(){
    let i = 0;
    info.jugadores.forEach((j) => {
        let slot = "#"+playerSlot+(i+1);
        
        // Aquí arreglamos el fallo visual del Player 2
        let nombreJugador = (j.nombre && j.nombre !== "null") ? j.nombre : "Jugador " + (i+1);

        // Mostrar puntos o interrogación dependiendo del estado global de la partida
        let puntosAMostrar = "?";
        if (info.estadoJuego == ESTADO_JUEGO.FINALIZADO || i == info.posJugador) {
            puntosAMostrar = puntos;
            mostrarApuestaActual(j.apuesta);
        }

        mostrarJugador(slot, nombreJugador, puntosAMostrar, j.apuesta, j.estado, );

        i++;
    });
}


/* ------------ Pintar Estado ------------ */
function actualizarJuego(){
    // Tablero
    MIN_BET = info.minBet;
    puntos = (info.jugadores[info.posJugador].numCartas <= 0)? 0 : puntosDeCartas(info.cartasJugador);

    // Jugadores
    mostrarJugadores();
}

/* ------------ Apostar ------------ */
function ajustarApuesta(n){
    let cant = parseInt(elemCantApuesta.value, 10) || 0;
    if(cant + n > 0 && cant + n <= 1000)
        elemCantApuesta.value = cant + n;
    else if(cant + n > 1000)
        elemCantApuesta.value = 1000;
    else
        elemCantApuesta.value = 1;
}
function mostrarApostar(){
    elemPanelApuesta.classList.add("show");
}
function ocultarApostar(){
    elemPanelApuesta.classList.remove("show");
}
function mostrarApuestaActual(n){
    document.querySelectorAll(".apuesta").forEach((elem) => elem.innerHTML = n);
}
function confirmApuesta(e){
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const idTablero = urlParams.get("id");
    const idJugador = info.jugadores[info.posJugador].idJugador;
    const cant = elemCantApuesta.value;

    if(cant <= 0){
        mostrarMensaje("La cantidad de fichas debe ser positiva");
        return;
    }
    else if(cant > parseInt(elemFichas.innerHTML, 10)){
        mostrarMensaje("No tienes suficientes fichas", "warning");
        return;
    }

    go(`/juego/${idTablero}/apostar`, 'POST', {idJugador, cant})
    .then( res => {
        mostrarApuestaActual(res.cant);
        mostrarCartera(res.fichas , parseInt(elemCervezas.innerHTML,10));
    })
    .catch( error => console.log("No se ha podido actualizar la apuesta: ", error));

    elemPanelApuesta.classList.remove("show");
}
btnApostar.onclick = e => mostrarApostar();
btnCancelApuesta.onclick = e => ocultarApostar();
btnConfirmApuesta.onclick = e => confirmApuesta(e);

/* ------------ Entrar en partida ------------ */
function entrarPartida(){
    const urlParams = new URLSearchParams(window.location.search);
    const idTablero = urlParams.get("id");

    let headers = { 'Content-Type': 'application/json' }
    if (typeof config !== 'undefined' && config.csrf && config.csrf.name)
        headers[config.csrf.name === '_csrf' ? 'X-CSRF-TOKEN' : config.csrf.name] = config.csrf.value;

    go(`/juego/${idTablero}/entrar`, 'POST', {}, headers)
    .then( res => {
        info = res;
        actualizarJuego();
    })
    .catch( error => console.log("No se pudo entrar a la sal de juego: ", error));
}
document.addEventListener("DOMContentLoaded", e => entrarPartida());

ws.receive = (respuesta) => {

    info = (info == undefined)? {} : info;

    if(respuesta.result == "ENTRADO"){
        info.jugadores = respuesta.jugadores;
        info.numJugadores = respuesta.numJugadores;
        console.log(info);
        if(info.numJugadores > 1)
            actualizarJuego();
    }   
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