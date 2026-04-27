document.querySelector("#postUser").onclick = e => {
    e.preventDefault();
    const username = document.querySelector("#username").value;
    const password = document.querySelector("#password").value;
    const repetir = document.querySelector("#repetir").value;

    const firstName = document.querySelector("#firstName").value;
    const lastName = document.querySelector("#lastName").value;

    function muestraError(error){
        let target = document.querySelector("#target");
        target.innerHTML = `<p class="badge text-bg-danger fs-6">Error: No se ha podido crear el Usuario. Vuelva a intentarlo.</p>`;
    }

    go(document.querySelector("#registrar-form").action, 'POST', {username, password, repetir, firstName, lastName})
        .then(d => window.location.replace("newlogin"))
        .catch(e => muestraError(e))
};