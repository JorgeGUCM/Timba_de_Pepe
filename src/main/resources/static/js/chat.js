
// Protegemos para que no se declare dos veces si incluyes ambos widgets
// hay que ponerlo pq si incluyes los dos se crea 2 veces y puede haber msgs duplicados y vainas
if (typeof window.ChatSystem === 'undefined') {
    window.ChatSystem = true;

    // LÓGICA DEL CHAT GLOBAL (DERECHA)
    window.ChatGlobal = {

        // entra y sale deslizando el panel lateral
        alternar: () => {
            // document.getElementById('menuChatGlobal') busca el elemento con ese ID
            // .classList.toggle('abierto'); si tiene el CSS 'abierto' se lo quita, si no lo tiene se lo pone
            document.getElementById('menuChatGlobal').classList.toggle('abierto');
            document.getElementById('capaFondoChatGlobal').classList.toggle('mostrar');
        },
        cerrar: () => {
            document.getElementById('menuChatGlobal').classList.remove('abierto');
            document.getElementById('capaFondoChatGlobal').classList.remove('mostrar');
        },
        enviar: (e) => {
            e.preventDefault();     // para que no se recarge la página entera
            let input = document.getElementById("chat-input-texto-global");
            let texto = input.value.trim();
            if (texto) {    // lo envia con AJAX a "global"
                // go ( destinoURL, metodo, datos)
                go(config.rootUrl + "/chat/enviar", "POST", { text: texto, room: "global" })
                    .catch(err => console.error("Error global:", err));
                input.value = "";   // limpia lo que acabas de enviar
            }
        },
        renderizar: (m) => {    // Se llama cuando hay un nuevo mensaje o desde recuperar() que es al principio para ver los mensajes anteriores
            const zona = document.getElementById("chat-zona-mensajes-global");
            const div = document.createElement("div");
            div.className = "card mensaje-chat mb-2 p-2 shadow-sm";     // le pega el formato CSS de los msgs
            // innerHTML es el estilo a los globos de los msgs, al recuadro
            div.innerHTML = `
                <strong style="color: #667eea;">${m.from}</strong>
                <span>${m.text}</span>
                <small class="text-white-50 mt-1" style="font-size: 0.75rem; text-align: right;">${m.sent} </small>
            `;
            zona.appendChild(div);  // coge el mensaje ya hecho y lo pone al final de la lista
            zona.scrollTop = zona.scrollHeight; // scrolleo hasta abajo
        },
        initConexion: () => {
            if (typeof ws !== 'undefined' && ws.stompClient && ws.connected) {  // vemos si WS están activos
                // Se subscribe al chat global. SI llega algo parsea y renderiza
                ws.stompClient.subscribe("/topic/chat/global", (m) => ChatGlobal.renderizar(JSON.parse(m.body)));
                console.log("Suscrito al Chat Global");
            } else {
                // Bucle que reintenta el WS cada X secs esperando a que se active correctamente
                setTimeout(ChatGlobal.initConexion, 500);
            }
        },
        // se llama tras initConexion() para ver los mensajes previamente mandados
        recuperar: () => {
            // Tu idea: usamos POST y mandamos la sala como tercer parámetro
            go("/chat/recuperar", "POST", { room: "global" })
                .then(mensajes => {
                    mensajes.forEach(m => ChatGlobal.renderizar(m));
                })
                .catch(err => console.error("Error al recuperar historial global:", err));
        }

    };

    // LÓGICA DEL CHAT DE SALA (IZQUIERDA)
    window.ChatSala = {

        // te devuelve el valor de 'id' del URL
        getSalaId: () => new URLSearchParams(window.location.search).get('id'),

        alternar: () => {
            document.getElementById('menuChatSala').classList.toggle('abierto');
            document.getElementById('capaFondoChatSala').classList.toggle('mostrar');
        },
        cerrar: () => {
            document.getElementById('menuChatSala').classList.remove('abierto');
            document.getElementById('capaFondoChatSala').classList.remove('mostrar');
        },
        enviar: (e) => {
            e.preventDefault();
            let input = document.getElementById("chat-input-texto-sala");
            let texto = input.value.trim();
            let id = ChatSala.getSalaId();  // saca el ID de la sala
            if (texto && id) {
                go(config.rootUrl + "/chat/enviar", "POST", { text: texto, room: "sala_" + id })
                    .catch(err => console.error("Error sala:", err));
                input.value = "";
            }
        },
        renderizar: (m) => {
            const zona = document.getElementById("chat-zona-mensajes-sala");
            const div = document.createElement("div");
            div.className = "card mensaje-chat mb-2 p-2 shadow-sm";
            div.innerHTML = `
                <strong style="color: #38ef7d;">${m.from}</strong> 
                <span>${m.text}</span> 
                <small class="text-white-50 mt-1" style="font-size: 0.75rem; text-align: right;">${m.sent}</small>
            `;
            zona.appendChild(div);
            zona.scrollTop = zona.scrollHeight;
        },
        initConexion: () => {
            let id = ChatSala.getSalaId();
            if(!id) return; // Si no hay ID en la URL, no podemos conectar a una sala privada

            if (typeof ws !== 'undefined' && ws.stompClient && ws.connected) {
                ws.stompClient.subscribe("/topic/chat/sala_" + id, (m) => ChatSala.renderizar(JSON.parse(m.body)));
                console.log("Suscrito al Chat de Sala " + id);
            } else {
                setTimeout(ChatSala.initConexion, 500);
            }
        },
        recuperar: () => {
            let id = ChatSala.getSalaId();
            if(!id) return; 

            // Tu idea: usamos POST y mandamos la sala como tercer parámetro
            go("/chat/recuperar", "POST", { room: "sala_" + id })
                .then(mensajes => {
                    mensajes.forEach(m => ChatSala.renderizar(m));
                })
                .catch(err => console.error("Error al recuperar historial de sala:", err));
        }
    };

    // Inicializador general
    // Empieza cuando se haya cargado todo el .html
    document.addEventListener("DOMContentLoaded", () => {
        if (document.getElementById('menuChatGlobal')) {
            window.ChatGlobal.initConexion();
            window.ChatGlobal.recuperar();  // Para que se recuperen los datos, losq ya habia en ese chat
        }
        if (document.getElementById('menuChatSala') && window.ChatSala.getSalaId()) {
            window.ChatSala.initConexion();
            window.ChatSala.recuperar();
        }
    });
}