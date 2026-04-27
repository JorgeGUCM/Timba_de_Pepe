// refresca previsualizacion cuando cambias imagen
document.querySelector("#f_avatar").onchange = e => {
    let img = document.querySelector("#avatar");
    let fileInput = document.querySelector("#f_avatar");
    console.log(img, fileInput);
    readImageFileData(fileInput.files[0], img);
};
// click en boton de enviar avatar
document.querySelector("#postAvatar").onclick = e => {
    e.preventDefault();
    let url = document.querySelector("#img-form").action;
    let img = document.querySelector("#avatar");
    let file = document.querySelector("#f_avatar");
    postImage(img, url, "photo").then(() => {
        let cacheBuster = "?" + new Date().getTime();
        document.querySelector("a.nav-link>img.iwthumb").src = url + cacheBuster;
    });
};

function resultDraw(d, targetId){
    console.log(d);
    if(d.result !== undefined){
        document.querySelector("#"+ targetId +"").innerHTML =
        `<p class="badge text-bg-success fs-6">` + d.result + `</p>`;
        document.querySelector("#username-nav").innerHTML = document.querySelector("#username").value;
    }else
         document.querySelector("#"+ targetId +"").innerHTML =
        `<p class="badge text-bg-warning fs-6">` + d.warning + `</p>`;
}

function errorDraw(targetId){
    document.querySelector("#"+ targetId +"").innerHTML = 
    `<p class="badge text-bg-danger fs-6">Error: No se pudo actualizar la información.</p>`;
}

/* Para el formulario de perfil */
document.querySelector("#postPerfil").onclick = e => {
    e.preventDefault();
    const username = document.querySelector("#username").value;
    const title = document.querySelector("#title").value;
    const description = document.querySelector("#description").value;

    go(document.querySelector("#perfil-form").action, 'POST', {username, title, description})
        .then(d => resultDraw(d, "res-perfil"))
        .catch(e => errorDraw("res-perfil"))
};

document.querySelector("#postPersonal").onclick = e => {
    e.preventDefault();
    const nombre = document.querySelector("#nombre").value;
    const apellido = document.querySelector("#apellido").value;
    const contra = document.querySelector("#contra").value;
    const repetir = document.querySelector("#repetir").value;

    go(document.querySelector("#personal-form").action, 'POST', {nombre, apellido, contra, repetir})
        .then(d => resultDraw(d, "res-personal"))
        .catch(e => errorDraw("res-personal"))
};