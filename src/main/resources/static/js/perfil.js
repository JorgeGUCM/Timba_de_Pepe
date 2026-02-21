let btn_ingresar = document.querySelector('#ingresar');
let btn_cancelar_ing = document.querySelector('#cancelar-ing');
let campo_importe = document.querySelector('#importe');
let pop_ing = document.querySelector('#pop-ing');
let btn_open_ing = document.querySelector('#open-ing');

btn_open_ing.onclick = e => openIngresar();
btn_ingresar.onclick = e => ingresar();
btn_cancelar_ing.onclick = e => cancelar_ingreso();

function openIngresar(){
    pop_ing.classList.add("show");
}

function ingresar(){
    /* Se ingresa el dinero */
    pop_ing.classList.remove('show');
}

function cancelar_ingreso(){
    pop_ing.classList.remove("show");
}