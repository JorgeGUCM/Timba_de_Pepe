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
    minBet
    jugadorAct: {
        idJugador
        posJugador
        cartas
        puntos
    }
    numJugadores
    jugadores: [{
        nombre
        posTablero
        apuesta
        puntos
        estado
        cartas
        numCartas
        fichas
        cervezas
    }]
*/
let info;
let index;

// Limites para apostar
const LIMITE = 7.5;

// Enums
const ESTADO_JUEGO = { ESPERANDO: "ESPERANDO", COMPLETO: "COMPLETO", JUGANDO: "JUGANDO", FINALIZADO: "FINALIZADO" };
const ESTADO_JUGADOR = { ESPERANDO: "ESPERANDO", ACTIVO: "ACTIVO", LISTO: "LISTO", PLANTADO: "PLANTADO", SOBREPUNTOS: "SOBREPUNTOS" }

// Elmentos
let elemFichas = document.querySelector("#fichas");
let elemCervezas = document.querySelector("#cervezas");
let elemMensaje = document.querySelector("#mensaje");

// Para los jugadores
let playerEsperando = `<span class="badge bg-secondary">Esperando...</span>`;
let playerActivo = `<span class="badge bg-success">Activo</span>`;
let playerPlantado = `<span class="badge bg-warning">Plantado</span>`;
let playerOver = `<span class="badge bg-danger">Sobrepuntos</span>`;
let playerListo = `<span class="badge bg-info">Listo</span>`;
let playerJugando = `<span class="badge bg-success">Jugando</span>`;

// Botones
let elemOpciones = document.querySelector("#gameActions");
const btnListo = `
    <button class="btn btn-success px-4 fw-bold" id="btnListo">
        🆗 Listo
    </button>`;

// Para las apuestas
let elemPanelApuesta = document.querySelector("#panelApuesta");
let elemCantApuesta = document.querySelector("#cantApuesta");
let btnConfirmApuesta = document.querySelector("#btnConfirmApuesta");
let btnCancelApuesta = document.querySelector("#btnCancelApuesta");

/* ------------ Otras funciones ------------ */
function nombreCarta(carta) {
    let numNombre = { '1': 'As', 'S': 'Sota', 'C': 'Caballo', 'R': 'Rey' };
    return (numNombre[carta[0]] || carta[0]) + ' de ' + PALO_NOMBRES[carta[1]];
}
function createCardImg(carta) {
    let img = document.createElement('img');
    img.src = IMG_BASE + carta + '.png';
    img.className = 'carta-jugador';
    img.alt = nombreCarta(carta);
    img.draggable = false;
    return img;
}
function createCardReverse() {
    let img = document.createElement('img');
    img.src = REVERSO;
    img.className = 'carta-jugador';
    img.alt = "Reverso de carta";
    img.draggable = false;
    return img;
}
function mostrarCartera(fichas, cervezas) {
    elemFichas.innerHTML = fichas;
    document.querySelector("#display-fichas").innerHTML = fichas;
    elemCervezas.innerHTML = cervezas;
}
function mostrarMensaje(mensaje, tipo = "info") {
    elemMensaje.innerHTML = `
        <p class="fs-5 badge bg-`+ tipo + ` text-black">` + mensaje + `</p>
    `;

    if (tipo == "danger")
        elemMensaje.querySelector("p").classList.replace("text-black", "text-white");

    if (!elemMensaje.classList.contains("show")) {
        elemMensaje.classList.add("show");
        setTimeout(() => {
            elemMensaje.classList.remove("show");
        }, 5000);
    }
}

/* Para actualizar las sesiones de todos los jugadores necesario para que cuando se actualicen las fichas de varios jugadores a la vez se actualicen sus sesiones */
function actualizarSesiones() {
    const idJugador = info.jugadorAct.idJugador;

    go(`/juego/sessions`, 'POST', { idJugador })
        .then(res => {
            if (res.error)
                mostrarMensaje(res.error, "danger");
            else if (res.warning)
                mostrarMensaje(res.warning, "warning");
        })
        .catch(error => console.log("No se pudo obtener la carta: ", error));
}

/* ------------ Funciones de apoyo a pintar ------------ */
function mostrarJugador(i, nombre, puntosJugador, apuesta, estadoJugador) {
    let jugadorDisplay = document.querySelector("#slot-" + i);

    if (estadoJugador == ESTADO_JUGADOR.ACTIVO)
        nombre += ` ` + playerActivo;
    else if (estadoJugador == ESTADO_JUGADOR.PLANTADO)
        nombre += ` ` + playerPlantado;
    else if (estadoJugador == ESTADO_JUGADOR.SOBREPUNTOS)
        nombre += ` ` + playerOver;
    else if (estadoJugador == ESTADO_JUGADOR.LISTO && info.estadoJuego == ESTADO_JUEGO.JUGANDO)
        nombre += ` ` + playerJugando;
    else if (estadoJugador == ESTADO_JUGADOR.LISTO)
        nombre += ` ` + playerListo;
    else
        nombre += ` ` + playerEsperando;

    jugadorDisplay.innerHTML = `
    <div class="jugador-nombre">
    🃏 `+ nombre + `
    </div>
    <div class="zona-cartas" id="cards-`+ i + `"></div>
    <div class="jugador-puntuacion d-flex gap-3">
        <p class="fw-bold">Puntos: <strong>`+ puntosJugador + `</strong> </p>
        <p class="fw-bold">Apuesta: <strong>`+ apuesta + `</strong>
            <svg style="transform: translate(-3px, -3px); filter:invert(1); width: 1.2em;"
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path
                    d="M471.9 324.8L320 417.6L168 324.8L320 64L471.9 324.8zM320 447.4L168 354.6L320 576L472 354.6L320 447.4z" />
            </svg> 
        </p>
    </div>
    `;

    // Jugador de la vista
    if (i == index && puntosJugador != "?" && puntosJugador != "-") {
        jugadorDisplay.classList.add("border-warning");
        jugadorDisplay.querySelectorAll("strong")[1].classList.add("apuesta");
    }
    else
        jugadorDisplay.classList.remove("border-warning");

    if (estadoJugador == ESTADO_JUGADOR.ESPERANDO)
        jugadorDisplay.classList.add("empty");
    else
        jugadorDisplay.classList.remove("empty");

}
function mostrarJugadores() {
    let i = 0;
    info.jugadores.forEach((j) => {
        // Aquí arreglamos el fallo visual del Player 2
        let nombreJugador = (j.nombre && j.nombre !== "null") ? j.nombre : "Jugador " + (i + 1);

        let puntosAMostrar = info.jugadores[i].puntos;
        if (i == index) {
            puntosAMostrar = info.jugadorAct.puntos;
            mostrarApuestaActual(j.apuesta);
        }

        mostrarJugador(i, nombreJugador, puntosAMostrar, j.apuesta, j.estado);

        i++;
    });

    while (i < 4) {
        mostrarJugador(i, "Jugador " + (i + 1), "-", "-", ESTADO_JUGADOR.ESPERANDO);
        i++;
    }
}
function mostrarCartas() {
    for (let i = 0; i < info.numJugadores; i++) {
        let elemCards = document.querySelector("#cards-" + i);
        if (i == info.jugadorAct.posJugador) {
            JSON.parse(info.jugadorAct.cartas).forEach((c) => {
                elemCards.appendChild(createCardImg(c));
            });
        } else if (info.estadoJuego == ESTADO_JUEGO.FINALIZADO) {
            JSON.parse(info.jugadores[i].cartas).forEach((c) => {
                elemCards.appendChild(createCardImg(c));
            });
        } else {
            for (let j = 0; j < info.jugadores[i].numCartas; j++)
                elemCards.appendChild(createCardReverse());
        }
    }
}

function mostrarBtnListo() {
    if (elemOpciones.querySelector("#btnListo") == undefined)
        elemOpciones.innerHTML += btnListo;
    /* ------------ Listo ------------ */
    document.querySelector("#btnListo").onclick = e => {
        const urlParams = new URLSearchParams(window.location.search);
        const idTablero = urlParams.get("id");
        const idJugador = info.jugadorAct.idJugador;

        go(`/juego/${idTablero}/listo`, 'POST', { idJugador })
            .then(res => {
                if (res.error)
                    mostrarMensaje(res.error, "danger");
                else if (res.warning)
                    mostrarMensaje(res.warning, "warning");
                else {
                    info = res;
                    actualizarJuego();
                }
            })
            .catch(error => console.log("No se pudo poner en listo al jugador: ", error));

        document.querySelector("#btnListo").remove();
    }
}
function deshabilitarAcciones(deshabilitar = true, apostar = deshabilitar) {
    document.querySelector("#btnApostar").onclick = e => { (!apostar) ? mostrarApostar() : console.log("Deshabilitado") };
    btnCancelApuesta.onclick = e => { (!apostar) ? ocultarApostar() : console.log("Deshabilitado") };
    btnConfirmApuesta.onclick = e => { (!apostar) ? confirmApuesta() : console.log("Deshabilitado") };
    document.querySelector("#btnApostar").disabled = apostar;

    document.querySelector("#btnPlantarse").onclick = e => { (!deshabilitar) ? plantarse() : console.log("Deshabilitado") };
    document.querySelector("#btnPlantarse").disabled = deshabilitar;

    document.querySelector("#btnPedir").onclick = e => { (!deshabilitar) ? pedirCarta() : console.log("Deshabilitado") };
    document.querySelector("#btnPedir").disabled = deshabilitar;
}
function actualizarEstadoJuego() {
    let titleDisplayElem = document.querySelectorAll("#title-display p");

    let bgEstado = "bg-secondary";
    if (info.estadoJuego == ESTADO_JUEGO.COMPLETO)
        bgEstado = "bg-danger";
    else if (info.estadoJuego == ESTADO_JUEGO.JUGANDO)
        bgEstado = "bg-success";
    else if (info.estadoJuego == ESTADO_JUEGO.FINALIZADO)
        bgEstado = "bg-primary";
    titleDisplayElem[0].classList.value = "m-0 badge fs-5 " + bgEstado;
    titleDisplayElem[0].innerHTML = info.estadoJuego;

    titleDisplayElem[1].innerHTML = info.numJugadores + " / 4";
}


/* ------------ Pintar Estado ------------ */
function actualizarJuego() {
    // Tablero
    MIN_BET = info.minBet;
    actualizarEstadoJuego();

    // Jugadores
    mostrarJugadores();
    mostrarCartas();

    // Acciones
    if (info.jugadores[index].estado == ESTADO_JUGADOR.ACTIVO)
        mostrarBtnListo();

    if (info.estadoJuego == ESTADO_JUEGO.JUGANDO && info.jugadores[info.jugadorAct.posJugador].estado == ESTADO_JUGADOR.PLANTADO)
        deshabilitarAcciones(true, false);
    else if (info.estadoJuego == ESTADO_JUEGO.JUGANDO && info.jugadores[info.jugadorAct.posJugador].estado != ESTADO_JUGADOR.SOBREPUNTOS)
        deshabilitarAcciones(false);
    else
        deshabilitarAcciones();

    if (info.estadoJuego == ESTADO_JUEGO.FINALIZADO) {
        mostrarBtnListo();
        mostrarCartera(info.jugadores[info.jugadorAct.posJugador].fichas, info.jugadores[info.jugadorAct.posJugador].cervezas);
        actualizarSesiones();

        if (info.ganadores) {
            mostrarMensaje(info.ganadores, info.ganadores.includes("Nadie") ? "danger" : "success");
        }
    }

    let elemSalir = document.querySelector("#salir");
    if (info.estadoJuego == ESTADO_JUEGO.JUGANDO) {
        elemSalir.onclick = e => {
            mostrarMensaje("¡Debes acabar la partida para poder salir!", "warning");
        }
        elemSalir.disabled = true;
    } else {
        elemSalir.onclick = e => salir();
        elemSalir.disabled = false;
    }
}

/* ------------ Pedir Carta ------------ */
function pedirCarta() {
    const urlParams = new URLSearchParams(window.location.search);
    const idTablero = urlParams.get("id");
    const idJugador = info.jugadorAct.idJugador;

    go(`/juego/${idTablero}/pedirCarta`, 'POST', { idJugador })
        .then(res => {
            if (res.error)
                mostrarMensaje(res.error, "danger");
            else if (res.warning)
                mostrarMensaje(res.warning, "warning");
            else {
                info = res;
                actualizarJuego();
            }
        })
        .catch(error => console.log("No se pudo obtener la carta: ", error));
}

/* ------------ Plantarse ------------ */
function plantarse() {
    const urlParams = new URLSearchParams(window.location.search);
    const idTablero = urlParams.get("id");
    const idJugador = info.jugadorAct.idJugador;

    go(`/juego/${idTablero}/plantar`, 'POST', { idJugador })
        .then(res => {
            if (res.error)
                mostrarMensaje(res.error, "danger");
            else if (res.warning)
                mostrarMensaje(res.warning, "warning");
            else {
                info = res;
                actualizarJuego();
            }
        })
        .catch(error => console.log("No se pudo plantar al jugador: ", error));
}

/* ------------ Apostar ------------ */
function ajustarApuesta(n) {
    let cant = parseInt(elemCantApuesta.value, 10) || 0;
    if (cant + n > 0 && cant + n <= 1000)
        elemCantApuesta.value = cant + n;
    else if (cant + n > 1000)
        elemCantApuesta.value = 1000;
    else
        elemCantApuesta.value = 1;
}
function mostrarApostar() {
    elemPanelApuesta.classList.add("show");
}
function ocultarApostar() {
    elemPanelApuesta.classList.remove("show");
}
function mostrarApuestaActual(n) {
    document.querySelectorAll(".apuesta").forEach((elem) => elem.innerHTML = n);
}
function confirmApuesta() {
    const urlParams = new URLSearchParams(window.location.search);
    const idTablero = urlParams.get("id");
    const idJugador = info.jugadorAct.idJugador;
    const cant = elemCantApuesta.value;

    if (info.estadoJuego != ESTADO_JUEGO.JUGANDO) {
        mostrarMensaje("No se ha iniciado la juego", "danger");
        return;
    }

    if (cant <= 0) {
        mostrarMensaje("La cantidad de fichas debe ser positiva");
        return;
    }
    else if (cant > parseInt(elemFichas.innerHTML, 10)) {
        mostrarMensaje("No tienes suficientes fichas", "warning");
        return;
    }

    go(`/juego/${idTablero}/apostar`, 'POST', { idJugador, cant })
        .then(res => {
            if (res.error != undefined) {
                mostrarMensaje("Servidor respondio con: " + res.error, "danger");
            } else if (res.warning != undefined) {
                mostrarMensaje("Servidor respondio con: " + res.warning, "warning");
            }
            else {
                mostrarApuestaActual(res.cant);
                mostrarCartera(res.fichas, parseInt(elemCervezas.innerHTML, 10));
            }
        })
        .catch(error => console.log("No se ha podido actualizar la apuesta: ", error));

    elemPanelApuesta.classList.remove("show");
}

/* ------------ Entrar en partida ------------ */
function entrarPartida() {
    const urlParams = new URLSearchParams(window.location.search);
    const idTablero = urlParams.get("id");

    go(`/juego/${idTablero}/entrar`, 'POST')
        .then(res => {
            if (res.error != undefined)
                window.location.replace("/salas"); // Si quieres enviar un mensaje a salas haz lo de registrar
            else {
                info = res;
                index = res.jugadorAct.posJugador;
                actualizarJuego();
            }
        })
        .catch(error => console.log("No se pudo entrar a la sal de juego: ", error));
}

/* ------------ Salir de la Sala ------------ */
function salir() {
    const urlParams = new URLSearchParams(window.location.search);
    const idTablero = urlParams.get("id");
    const idJugador = info.jugadorAct.idJugador;

    go(`/juego/${idTablero}/salir`, 'POST', { idJugador })
        .then(res => {
            if (res.success != undefined)
                window.location.replace("/salas");
            else if (res.warning != undefined)
                mostrarMensaje("No se pudo salir de la Sala: " + res.warning, "warning");
            else
                mostrarMensaje("No se pudo salir de la Sala: " + res.error, "danger");
        })
        .catch(error => console.log("No se pudo salir de la sala: ", error));
}

document.addEventListener("DOMContentLoaded", e => {
    document.querySelector("#btnApostar").disabled = true;
    document.querySelector("#btnPlantarse").disabled = true;
    document.querySelector("#btnPedir").disabled = true;
    document.querySelector("#salir").onclick = e => salir();
    entrarPartida();
});

ws.receive = (respuesta) => {

    info = (info == undefined) ? {} : info;
    info.ganadores = respuesta.ganadores;

    if (respuesta.result == "ENTRADO") {
        info.jugadores = respuesta.jugadores;
        info.numJugadores = respuesta.numJugadores;
        if (info.numJugadores > 1)
            actualizarJuego();
    }

    if (respuesta.result == "ESTADO_CAMBIADO") {
        info.estadoJuego = respuesta.estadoJuego;
        info.jugadores = respuesta.jugadores;
        actualizarJuego();
    }

    if (respuesta.result == "PEDIDO") {
        info.jugadores = respuesta.jugadores;
        info.estadoJuego = respuesta.estadoJuego;
        actualizarJuego();
    }

    if (respuesta.result == "PLANTADO") {
        info.jugadores = respuesta.jugadores;
        info.estadoJuego = respuesta.estadoJuego;
        actualizarJuego();
    }

    if (respuesta.result == "SALIDO") {
        info.jugadores = respuesta.jugadores;
        info.estadoJuego = respuesta.estadoJuego;
        actualizarJuego();
    }

    console.log(info);
};