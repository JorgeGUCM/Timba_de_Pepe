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

function mostrarMonedas(f, c){
    elemFichas.innerHTML = f;
    elemCervezas.innerHTML = c;
}

function cargarPartida(){
    fichas = parseInt(document.querySelector("#fichas").innerText) || 0;
    cervezas = parseInt(document.querySelector("#cervezas").innerText) || 0;
    
    let inputNombre = document.querySelector("#miNombreUsuario");
    let miNombre = inputNombre ? inputNombre.value : "Jugador Local";

    let inputId = document.querySelector("#miJugadorId");
    miJugadorId = inputId ? parseInt(inputId.value) : null;
    
    let inputPosicion = document.querySelector("#miPosicionMesa");
    playerIndex = inputPosicion ? parseInt(inputPosicion.value) : 1;    
    
    players[playerIndex - 1].name = miNombre;
    players[playerIndex - 1].active = true;

    let rawJugadores = document.querySelector("#jugadoresIniciales");
    if(rawJugadores && rawJugadores.value) {
        let jugadoresGuardados = JSON.parse(rawJugadores.value);
        jugadoresGuardados.forEach(jDB => {
            let idx = jDB.posicionMesa - 1;
            if(players[idx]) {
                // Asignamos el nombre de BBDD asegurándonos de que no sea null
                if (jDB.nombre && jDB.nombre !== "null") {
                    players[idx].name = jDB.nombre;
                }
                players[idx].score = jDB.puntuacion || 0;
                players[idx].standing = (jDB.estado === "PLANTADO" || jDB.estado === "SOBREPUNTOS");
                
                // Solo activamos a los que no sean "ESPERANDO" o, al menos, los registramos
                if (jDB.estado !== "ESPERANDO" || idx === (playerIndex - 1)) {
                     players[idx].active = true;
                }
                
                try {
                    players[idx].cards = typeof jDB.cartas === 'string' ? JSON.parse(jDB.cartas) : jDB.cartas;
                } catch(e) {
                    players[idx].cards = [];
                }
                num_players++;
            }
        });
    }

    document.querySelector("#active-" + playerIndex).innerHTML = 
        `🃏 ${miNombre} <span class="badge bg-success">Activo</span>`;
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

function gameEnded(){
    let algunJugadorSigueJugando = false;
    
    players.forEach((p) => {
        // Alguien sigue jugando si tiene nombre (está en la mesa), no está plantado y sus puntos <= 7.5
        if(p.name !== null && !p.standing && p.score <= LIMITE){
            algunJugadorSigueJugando = true;
        }
    });

    // Solo entramos aquí si estábamos jugando y ya nadie puede seguir
    if(!algunJugadorSigueJugando && estado === ESTADO_JUEGO.JUGANDO){
        estado = ESTADO_JUEGO.FINALIZADO;
        
        // Revelamos cartas forzadamente ANTES de cualquier rebote de servidor
        for(let i = 1; i <= 4; i++) {
            let p = players[i-1];
            if (p.name !== null) {
                renderCards(p.cards, i);
            }
        }
        mostarJugadores();
        
        resultado();
    }
}

function crearBtnNueva(texto){
    targetBtn.innerHTML = `<button class="btn btn-success px-4" id="btnNueva">`+ texto +`</button>`;
    return document.querySelector("#btnNueva");
}

function eliminarBtnNueva(){
    targetBtn.innerHTML = null;
}

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

function apostarPanelShow(){
    elemPanelApuesta.classList.add("show");
}
function apostarPanelHide(){
    elemPanelApuesta.classList.remove("show");
}
function ajustarApuesta(n){
    let cant = parseInt(elemCantApuesta.value, 10) || 0;
    if(cant + n > 0 && cant + n <= 1000)
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
    } else if (total_bet <= 0)
        mensaje("Debe ser positiva la apuesta!");
    else
        mensaje("No tienes suficientes fichas!", "danger");

    apostarPanelHide();
}

function apuestaInicial(){
    let bet = parseInt(elemCantApuesta.value, 10);
    if(bet < MIN_BET){
        mensaje("La apuesta minima es de " + MIN_BET, "info");
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
    
    let btnNueva = document.querySelector("#btnNueva");
    if(btnNueva) btnNueva.disabled = false;
    
    btnConfirmApuesta.onclick = () => apuestaComfirm();

    apostarPanelHide();
    guardarEstadoEnBD();
}

function resultado(){
    let p = players[playerIndex-1];
    
    if(p.score <= LIMITE) {
        let premio = p.bet * 2;
        fichas += premio;
        p.ganancias = premio;
        mostrarMonedas(fichas, cervezas);
        mensaje("¡Ronda finalizada! Recibes " + premio + " fichas si el rival se pasó, o perdiste. Revisa puntuaciones.", "success");
    } else {
        p.ganancias = -p.bet;
        mensaje("Te has pasado de 7.5. Has perdido tus fichas apostadas.", "danger");
    }
    
    // Aquí el estado ya es FINALIZADO, y aunque el servidor reenvíe un WS, la función mostarJugadores() 
    // revelará los números de forma segura.
    guardarEstadoEnBD();

    crearBtnNueva("🔄 Reiniciar Tablero");
    let btnReiniciarDOM = document.querySelector("#btnNueva");
    if (btnReiniciarDOM) {
        btnReiniciarDOM.onclick = function() {
            let headers = { 'Content-Type': 'application/json' };
            if (typeof config !== 'undefined' && config.csrf && config.csrf.name) {
                headers[config.csrf.name === '_csrf' ? 'X-CSRF-TOKEN' : config.csrf.name] = config.csrf.value;
            }
            fetch(`/jugador/${miJugadorId}/nueva-ronda`, { 
                method: 'POST',
                headers: headers 
            })
            .then(response => response.json())
            .then(data => {
                if(data.nuevoId) {
                    document.querySelector("#miJugadorId").value = data.nuevoId;
                    miJugadorId = data.nuevoId; 
                    window.location.reload(); 
                }
            });
        };
    }
}

function plantarse(){
    players[playerIndex-1].standing = true;

    btnPedir.disabled = true;
    btnPlantarse.disabled = true;
    btnApostar.disabled = true;

    let nom = players[playerIndex-1].name || "Yo";
    mensaje("Te has plantado con: " + players[playerIndex-1].score + ". Esperando al resto...", "info");
    playerEstado(playerIndex, "🃏 " + nom + " " + playerPlantado);
    
    guardarEstadoEnBD();
    gameEnded();
}

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
    
    // IMPORTANTE: Revelar las cartas si somos nosotros, O si el juego está finalizado.
    if(indexPlayer == playerIndex || estado === ESTADO_JUEGO.FINALIZADO) {
        cards.forEach(c => target.appendChild(createCardImg(c)));
    } else {
        cards.forEach(() => target.appendChild(createCardReverse()));
    }
}

function actualizarPuntos(score, indexPlayer){
    if(indexPlayer == playerIndex || estado === ESTADO_JUEGO.FINALIZADO) {
        document.querySelector("#"+playerScore+indexPlayer).innerHTML = score;
    } else {
        document.querySelector("#"+playerScore+indexPlayer).innerHTML = "?";
    }
}

function guardarEstadoEnBD() {
    if (!miJugadorId) return; 
    let p = players[playerIndex - 1];
    
    let estadoActual = "ACTIVO";
    if (p.score > LIMITE) estadoActual = "SOBREPUNTOS";
    else if (p.standing) estadoActual = "PLANTADO";
    else if (!p.active) estadoActual = "ESPERANDO";
    
    // Obtenemos el nombre del HTML, para garantizar que nunca sea "null" por culpa de un fallo de JS.
    let inputNombre = document.querySelector("#miNombreUsuario");
    let nombreSeguro = inputNombre ? inputNombre.value : "Jugador";
    p.name = nombreSeguro;

    let datos = {
        cartas: p.cards, 
        puntuacion: p.score,
        estado: estadoActual,
        apuesta: p.bet,
        fichas: fichas,
        ganancias: p.ganancias !== undefined ? p.ganancias : 0,
        nombre: nombreSeguro
    };

    let headers = { 'Content-Type': 'application/json' };
    if (typeof config !== 'undefined' && config.csrf && config.csrf.name) {
        headers[config.csrf.name === '_csrf' ? 'X-CSRF-TOKEN' : config.csrf.name] = config.csrf.value;
    }

    fetch(`/jugador/${miJugadorId}/actualizar`, {
        method: 'POST',
        headers: headers, 
        body: JSON.stringify(datos)
    }).catch(error => console.error("Error de conexión:", error));
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
        btnApostar.disabled = true;
        
        let nom = p.name || "Yo";
        playerEstado(playerIndex, "🃏 " + nom + " " + playerOver);
        p.standing = true; // Forzamos el "standing" lógico para que gameEnded funcione correctamente.
        guardarEstadoEnBD();
        gameEnded(); 
    }
}

function pedirInicioPartida() {
    const urlParams = new URLSearchParams(window.location.search);
    const juegoId = urlParams.get('id');

    let headers = { 'Content-Type': 'application/json' };
    if (typeof config !== 'undefined' && config.csrf && config.csrf.name) {
        headers[config.csrf.name === '_csrf' ? 'X-CSRF-TOKEN' : config.csrf.name] = config.csrf.value;
    }
    fetch(`/juego/${juegoId}/iniciar`, { method: 'POST', headers: headers })
        .catch(error => console.error("Error iniciando partida", error));
}

function inicioPartidaLocal(){
    estado = ESTADO_JUEGO.JUGANDO;
    btnPedir.disabled = false;
    btnPlantarse.disabled = false;
    btnApostar.disabled = true; 
    eliminarBtnNueva();

    window.barajaLocal = barajar(construirBaraja());

    btnPlantarse.onclick = () => plantarse();
    btnPedir.onclick = () => pedir(window.barajaLocal);

    mensaje("¡¡¡Inicio del Siete y Medio!!!", "success");
}

document.addEventListener('DOMContentLoaded', () => gameController());

function gameController(){
    cargarPartida();
    mostrarMonedas(fichas, cervezas);
    elemApuesta.innerHTML = 0;
    mostarJugadores();

    let index = 1;
    players.forEach((p) => {renderCards(p.cards, index); index++;});

    estado = (num_players < 4)? ESTADO_JUEGO.ESPERA : ESTADO_JUEGO.COMPLETA;
    
    btnConfirmApuesta.onclick = () => apuestaInicial();
    btnApostar.onclick = () => apostarPanelShow();
    btnCancelApuesta.onclick = () => apostarPanelHide();

    let nueva = crearBtnNueva("🔄 Iniciar Partida");
    nueva.disabled = true;
    
    if (playerIndex === 1) {
        nueva.disabled = false; 
        nueva.onclick = () => pedirInicioPartida();
    } else {
        nueva.style.display = 'none'; 
    }

    btnPlantarse.disabled = true;
    btnPedir.disabled = true;

    // AL ENTRAR, HACEMOS PING AL RESTO DE LA SALA PARA AVISAR QUE ESTAMOS.
    // AQUÍ ES DONDE ANTES SE PERDÍA EL NOMBRE AL CREAR LA SEGUNDA SALA. AHORA NO OCURRIRÁ.
    setTimeout(() => {
        if(miJugadorId) guardarEstadoEnBD();
    }, 500);
}

ws.receive = (mensajeStr) => {
    let payload = typeof mensajeStr === 'string' ? JSON.parse(mensajeStr) : 
                  (mensajeStr.body ? JSON.parse(mensajeStr.body) : mensajeStr);

    if (payload.tipo === "INICIO_PARTIDA") {
        inicioPartidaLocal();
        return;
    }

    if (payload.tipo === "JUGADOR_SALE") {
        let idx = payload.posicionMesa - 1;
        if(players[idx]) {
            players[idx].name = null;
            players[idx].active = false;
            players[idx].standing = false;
            players[idx].cards = [];
            players[idx].score = 0;
            mostarJugadores();
        }
        return;
    }

    // Ignoramos nuestros propios mensajes
    if (payload.jugadorId === miJugadorId) return;

    if (payload.tipo === "ACTUALIZAR_JUGADOR") {
        let indexRival = payload.posicionMesa; 
        let p = players[indexRival - 1]; 

        if (p) {
            // Guardamos el nombre que viene en el WebSocket (gracias al fix en RootController y guardarEstadoEnBD)
            if (payload.nombre && payload.nombre !== "null") {
                p.name = payload.nombre;
            }

            p.cards = payload.cartas || [];
            p.score = payload.puntuacion || 0.0;
            p.standing = (payload.estado === "PLANTADO" || payload.estado === "SOBREPUNTOS");
            p.active = true; 

            // Primero actualizamos las vistas y cartas del rival de forma normal
            actualizarPuntos(p.score, indexRival);
            renderCards(p.cards, indexRival);
            mostarJugadores();

            // Y finalmente comprobamos si este movimiento ha terminado la partida
            gameEnded(); 
        }
    }
};

window.addEventListener('beforeunload', function () {
    const urlParams = new URLSearchParams(window.location.search);
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
    }
});