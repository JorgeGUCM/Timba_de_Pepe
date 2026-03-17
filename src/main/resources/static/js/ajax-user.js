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

/* Para el formulario de perfil */
document.querySelector("#postPerfil").onclick = e => {
    e.preventDefault();
    const username = document.querySelector("input[name=username]").value;
    const title = document.querySelector("input[name=title]").value;
    const description = document.querySelector("textarea[name=description]").value;

    go(document.querySelector("#perfil-form").action, 'POST', {username, title, description})
        .then(d => console.log("Se ha actualizado el perfil", d))
        .catch(e => console.log("Error: no se ha podido actualizar el perfil", e))
};