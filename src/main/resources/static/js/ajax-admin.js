import { DataTable } from "./simple-datatables-10.js";

let dt = null;

function refreshMessages() {
    go('/admin/all-messages', 'GET')
        .then(d => {
            console.log("Datos brutos recibidos por AJAX:", d);

            // Mapeamos los datos para adaptarlos a la tabla
            const datosFormateados = d.map(msg => [
                msg.from || 'Sistema',                               
                msg.topic || 'Privado',                              
                msg.text || '',                                      
                msg.sent ? msg.sent.replace('T', ' ').substring(0, 16) : '' 
            ]);

            if (dt) {
                dt.destroy();
                document.querySelector("#messages").innerHTML = '';
            }

            dt = new DataTable('#messages', {
                data: {
                    headings: ['Remitente', 'Chat / Topic', 'Texto', 'Fecha'],
                    data: datosFormateados
                },
                searchable: true,
                paging: false, // Quitamos la paginación para verlos todos de golpe
                perPage: 10    // se mostrrarán 10 mensajes
            });

            dt.on('datatable.init', () => {
                document.querySelector('.dataTable-wrapper').classList.add('text-white');
                const inputs = document.querySelectorAll('.dataTable-selector, .dataTable-input');
                inputs.forEach(input => {
                    input.classList.add('bg-dark', 'text-white', 'border-secondary');
                });
            });

        })
        .catch(e => {
            console.error("Error al cargar los mensajes vía AJAX:", e);
        });
}

// Lógica del botón "Actualizar vía AJAX"
document.querySelector('#refresh').onclick = e => {
    e.preventDefault();
    const btn = e.target;
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '🔄 Cargando...';
    refreshMessages();
    setTimeout(() => btn.innerHTML = textoOriginal, 500);
};


refreshMessages();