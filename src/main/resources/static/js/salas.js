document.addEventListener("DOMContentLoaded", e => {

    document.querySelector("#crearSala").onclick = e => crearSala();

    function crearSala() {
        var myModal = new bootstrap.Modal(document.getElementById('modalCrearSala'));
        myModal.show();
    }

    document.querySelectorAll(".sala-body").forEach((sala) => {
        sala.querySelector(".btn-entrar").onclick = e => {
            const id_sala = sala.querySelector(".id-sala").value;
            const apuesta_sala = sala.querySelector(".apuesta-sala").value;
            if(apuesta_sala <= parseInt(document.querySelector("#display-fichas").innerHTML)){
                window.location.replace("juego?id="+id_sala);
            }else{
                let mensaje = document.querySelector("#mensaje");
                
                mensaje.innerHTML = `<p class="fs-4 badge bg-danger text-white">No tienes suficientes fichas necesitas: `+ apuesta_sala +`</p>`;

                if (!mensaje.classList.contains("show")) {
                    mensaje.classList.add("show");
                    setTimeout(() => {
                        mensaje.classList.remove("show");
                    }, 10000);
                }
            }
        }
    });
});
