if (typeof window.SalasSystem === 'undefined') {
    window.SalasSystem = true;
    
    window.Salas = {
    
        init: () => {
            Salas.initConexion();
        },
    
        initConexion: () => {
            if (typeof ws !== 'undefined' && ws.stompClient && ws.connected) {
                ws.stompClient.subscribe("/topic/salas", (m) => {
                    try {
                        const data = JSON.parse(m.body);
                        Salas.procesarEvento(data);
                    } catch (e) {
                        console.error("Error parseando mensaje de salas:", e);
                    }
                });
                console.log("Suscrito a /topic/salas");
            } else {
                // Reintenta hasta que la conexión WS global esté lista
                setTimeout(Salas.initConexion, 500);
            }
        },
    
        procesarEvento: (data) => {
            if (!data) return;
        
            if (data.event === "SALA_CREADA") {
                Salas.agregarSala(data);
            }
        },
    
        agregarSala: (sala) => {
            const contenedorSalas = document.getElementById('salas-cards');
            if (!contenedorSalas) return;
    
            // Evitar duplicados por si acaso
            if (document.getElementById("sala-" + sala.id)) return;
    
            // Construir el HTML idéntico a tus tarjetas Thymeleaf
            const nuevaTarjetaHTML = `
                <div class="col-md-6 col-lg-4" id="sala-${sala.id}">
                    <div class="card tarjeta-sala shadow-sm h-100">
                        <div class="cabecera-sala d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${sala.nombre}</h5>
                            <span class="badge bg-success">${sala.estado}</span>
                        </div>
                        <div class="card-body border-0">
                            <p class="mb-1"><strong>Jugadores:</strong> 
                                <span class="badge bg-primary">${sala.num_jugadores} / 4</span>
                            </p>
                            <p class="mb-3"><strong>Nivel:</strong> 
                                <span class="badge bg-danger px-3 py-2">${sala.dificultad}</span>
                            </p>
                            <a href="${config.rootUrl}/juego?id=${sala.id}" class="btn btn-success w-100">Entrar a Jugar</a>
                        </div>
                    </div>
                </div>
            `;
    
            // Insertamos la nueva tarjeta justo antes de la tarjeta "Crear Nueva Sala"
            const botonCrearSala = document.getElementById('crearSala').parentElement;
            botonCrearSala.insertAdjacentHTML('beforebegin', nuevaTarjetaHTML);
        }
    };
    
    // Arranca todo cuando el DOM esté listo
    document.addEventListener("DOMContentLoaded", () => {
        Salas.init();
    });
}