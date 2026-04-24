document.addEventListener("DOMContentLoaded", () => {
    // Sobrescribimos el comportamiento de recibir un mensaje por WebSocket
    if (typeof ws !== 'undefined' && ws) {
        ws.receive = (mensaje) => {
            console.log("Se ha recibido una actualización del ranking desde WS:", mensaje);
            actualizarRankingVisual(mensaje);
        };
    }
});

function actualizarRankingVisual(nuevoRanking) {
    // 1. Actualizar el Podium (Top 3)
    const podiumContainer = document.getElementById("podium-container");
    if(podiumContainer) {
        podiumContainer.innerHTML = ''; // Vaciar

        // Segundo Puesto
        if (nuevoRanking.length > 1) {
            let u2 = nuevoRanking[1];
            podiumContainer.innerHTML += `
                <div class="col-md-3 mb-3">
                    <div class="card border-0 shadow-sm pt-4" style="border-radius: 15px;">
                        <img src="/user/${u2.id}/pic" onerror="this.src='/img/user.png'" class="rounded-circle mx-auto border border-secondary" width="70" alt="2nd">
                        <div class="card-body">
                            <h4 class="card-title h5 text-uppercase">${u2.username}</h4>
                            <span class="titulo-cervecero bg-light text-secondary">[Catador 🍻]</span>
                            <p class="badge bg-secondary d-block mt-2">2ª Posición</p>
                            <p class="text-primary fw-bold mt-2">${u2.cervezas} Cervezas 🍺</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // Primer Puesto
        if (nuevoRanking.length > 0) {
            let u1 = nuevoRanking[0];
            podiumContainer.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card border-primary shadow-lg pt-4" style="border-radius: 20px; border-width: 3px;">
                        <div class="position-absolute top-0 start-50 translate-middle">
                            <span class="fs-1">👑</span>
                        </div>
                        <img src="/user/${u1.id}/pic" onerror="this.src='/img/user.png'" class="rounded-circle mx-auto border border-warning" width="100" alt="1st">
                        <div class="card-body">
                            <h4 class="card-title h4 text-uppercase">${u1.username}</h4>
                            <span class="titulo-cervecero bg-warning text-dark">[Maestro 🏆]</span>
                            <p class="badge bg-warning text-dark d-block mt-2">1ª Posición</p>
                            <p class="display-6 fw-bold text-primary mt-2">${u1.cervezas} Cervezas 🍺</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // Tercer Puesto
        if (nuevoRanking.length > 2) {
            let u3 = nuevoRanking[2];
            podiumContainer.innerHTML += `
                <div class="col-md-3 mb-3">
                    <div class="card border-0 shadow-sm pt-4" style="border-radius: 15px;">
                        <img src="/user/${u3.id}/pic" onerror="this.src='/img/user.png'" class="rounded-circle mx-auto border border-danger" width="70" alt="3rd">
                        <div class="card-body">
                            <h4 class="card-title h5 text-uppercase">${u3.username}</h4>
                            <span class="titulo-cervecero bg-light text-danger">[Catador 🍻]</span>
                            <p class="badge bg-danger d-block mt-2">3ª Posición</p>
                            <p class="text-primary fw-bold mt-2">${u3.cervezas} Cervezas 🍺</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // 2. Actualizar la tabla (resto de jugadores)
    const tbody = document.getElementById("ranking-tbody");
    if(tbody) {
        tbody.innerHTML = '';
        if (nuevoRanking.length <= 3) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">No hay más maestros cerveceros.</td></tr>`;
        } else {
            for (let i = 3; i < nuevoRanking.length; i++) {
                let usuario = nuevoRanking[i];
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="ps-4 fw-bold">${i + 1}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="/user/${usuario.id}/pic" class="rounded-circle me-3" width="35" onerror="this.src='/img/user.png'">
                            <div>
                                <span class="fw-bold text-uppercase">${usuario.username}</span>
                                <span class="titulo-cervecero text-info bg-light">[Aprendiz 🍺]</span>
                            </div>
                        </div>
                    </td>
                    <td class="text-end pe-4 fw-bold">${usuario.cervezas} 🍺</td>
                `;
                tbody.appendChild(tr);
            }
        }
    }
}
