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
    btn_ingresar.onclick = e => ingresar(e);
    campo_importe.value = 10;
    title.innerHTML = "Ingresar dinero";
    cambio.innerHTML = `
    Cambio a: <strong id="cambio-target">`+ campo_importe.value +`</strong>
    <svg
        style="filter: invert(1); width: 1.2em; transform: translateY(-0.15em);" xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 640">
        <path
            d="M471.9 324.8L320 417.6L168 324.8L320 64L471.9 324.8zM320 447.4L168 354.6L320 576L472 354.6L320 447.4z" />
    </svg>`;
    btn_ingresar.innerHTML = "Ingresar";
    pop_up.classList.add("show");
}

function openSacar(){
    btn_ingresar.onclick = e => sacar(e);
    campo_importe.value = 10;
    title.innerHTML = "Sacar dinero";
    cambio.innerHTML = `Cambio a: <strong id="cambio-target">`+ campo_importe.value +`</strong>€`;
    btn_ingresar.innerHTML = "Sacar";
    pop_up.classList.add("show");
}

function updateFichas(d){
    let fichas = "Error: Fichas negativas";
    if(d.result !== undefined){
        fichas = d.result;
        document.querySelector("#display-fichas").innerHTML = fichas;
    }
    document.querySelector("#fichas-perfil").innerHTML = fichas;     
}

function ingresar(e){
    /* Se ingresa el dinero */
    e.preventDefault();
    let cant = document.querySelector("#importe").value;
    if(cant > 0 && cant <= 1000){
        go(document.querySelector("#fichas-form").action, 'POST', {cant})
            .then((d) => updateFichas(d))
            .catch((e) => console.log("sad", e));
    
        pop_up.classList.remove('show');
    }
}

function sacar(e){
    /* Se saca dinero */
    e.preventDefault();
    let cant = 0 - document.querySelector("#importe").value;
    if(cant < 0 && cant >= 0 - 1000){
        go(document.querySelector("#fichas-form").action, 'POST', {cant})
            .then((d) => updateFichas(d))
            .catch((e) => console.log("sad", e));
        
        pop_up.classList.remove('show');
    }
}
function cancelar_ingreso(){
    pop_up.classList.remove("show");
}