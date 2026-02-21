let btn_open_ing = document.querySelector('#open-ing');
let btn_open_sac = document.querySelector('#open-sac');

let btn_ingresar = document.querySelector('#ingresar');
let btn_cancelar_ing = document.querySelector('#cancelar-ing');

let title = document.querySelector('#pop-title');
let cambio = document.querySelector('#cambio');
let campo_importe = document.querySelector('#importe');
let pop_up = document.querySelector('#pop-up');

/* Acciones de los botones */
btn_open_ing.onclick = e => openIngresar();
btn_open_sac.onclick = e => openSacar();
btn_cancelar_ing.onclick = e => cancelar_ingreso();

/* Acción para calcular el dinero y las fichas */
campo_importe.oninput = e => actualizarCambio();

function actualizarCambio(){
    document.querySelector('#cambio-target').innerHTML = campo_importe.value;
}

/* Funciones de para el pop-Up */
function openIngresar(){
    btn_ingresar.onclick = e => ingresar();
    title.innerHTML = "Ingresar dinero";
    cambio.innerHTML = `
    Cambio a: <strong id="cambio-target">100</strong>
    <svg
        style="width: 1.2em; transform: translateY(-0.15em);" xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 640">
        <path
            d="M471.9 324.8L320 417.6L168 324.8L320 64L471.9 324.8zM320 447.4L168 354.6L320 576L472 354.6L320 447.4z" />
    </svg>`;
    btn_ingresar.innerHTML = "Ingresar";
    pop_up.classList.add("show");
}

function openSacar(){
    btn_ingresar.onclick = e => sacar();
    title.innerHTML = "Sacar dinero";
    cambio.innerHTML = `Cambio a: <strong id="cambio-target">100</strong>€`;
    btn_ingresar.innerHTML = "Sacar";
    pop_up.classList.add("show");
}

function ingresar(){
    /* Se ingresa el dinero */
    console.log("Se ha ingresado dinero");
    pop_up.classList.remove('show');
}

function sacar(){
    /* Se saca dinero */
    console.log("Se ha extraido dinero");
    pop_up.classList.remove('show');
}
function cancelar_ingreso(){
    pop_up.classList.remove("show");
}