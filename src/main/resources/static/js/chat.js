

// Se crea un objeto para que no halla funciones que se llamen igual en chat.js y juego.js
// Porque como chat.js esta implementado con otras cosas en las vistas ps se evitan fallos
// Se envia como AJAX se recoge como WS 
const ChatGlobal = {
    // En plan interruptor
    alternar: () => {
        document.getElementById('menuChatGlobal').classList.toggle('abierto');
        document.getElementById('capaFondoChat').classList.toggle('mostrar');
    },
    
    cerrar: () => {
        document.getElementById('menuChatGlobal').classList.remove('abierto');
        document.getElementById('capaFondoChat').classList.remove('mostrar');
    },
    
    enviar: (e) => {
        e.preventDefault(); // haces que el navegador no recarge la web entera
        let input = document.getElementById("chat-input-texto");
        let texto = input.value.trim();
        
        if (texto) {
            // Usamos la función go() de iw.js
            // Se envia como AJAX
            go(config.rootUrl + "/chat/global", "POST", { text: texto })
                .catch(err => console.error("Error enviando mensaje:", err));
            input.value = "";
        }
    },
    
    // Cuando se nos avisa de que hay un msg nuevo se ejecuta esto
    // renderizado dinamico
    renderizar: (m) => {
        const zona = document.getElementById("chat-zona-mensajes");
        const div = document.createElement("div");
        div.className = "card mensaje-chat mb-2 p-2 shadow-sm";
        div.innerHTML = `
            <strong style="color: #667eea;">${m.from}</strong>
            <span>${m.text}</span>
            <small class="text-white-50 mt-1" style="font-size: 0.75rem; text-align: right;">${m.sent}</small>
        `;
        zona.appendChild(div);
        zona.scrollTop = zona.scrollHeight; // Auto-scroll al fondo
    },
    
    initConexion: () => {
        // Como iw.js conecta asíncronamente, nos aseguramos de que stompClient exista
        if (typeof ws !== 'undefined' && ws.stompClient && ws.connected) {
            ws.stompClient.subscribe("/topic/chat", (m) => {
                ChatGlobal.renderizar(JSON.parse(m.body));
            });
            console.log("Chat Global suscrito a /topic/chat");
        } else {
            // Reintentamos en 500ms si el socket de iw.js aún no ha conectado
            setTimeout(ChatGlobal.initConexion, 500);
        }
    }
};

// Inicializar cuando el DOM cargue
// DOMContentLoaded salta cuando el navegador termina de leer el .html
document.addEventListener("DOMContentLoaded", () => {
    // Comprobamos si el fragmento del chat está en la página actual
    if (document.getElementById('menuChatGlobal')) {
        ChatGlobal.initConexion();
    }
});