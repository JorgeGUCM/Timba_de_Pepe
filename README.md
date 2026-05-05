# Aplicación de Timba de Pepe: Siete y Medio

Juega al clasico juego español SIETE Y MEDIO, donde hasta 4 jugadores podeis apostar y ganar. En la aplicación se podran crear salas para jugar al siete y medio con otras 3 personas. Por cada partida ganada, no solo ganreis fichas (moneda de la aplicación), si no tambien ganareis cervezas que se podrán gastar en efectos para la sala y otros eventos que mantendrán el entretenimiento. Además, hay un ranking de los mejores jugadores que se evalua en base a la cantidad total ganada de cervezas.

## Estructura de la BD

<img width="1809" height="1218" alt="image" src="https://github.com/user-attachments/assets/252ce9d1-b7e4-43db-bc8e-b4b2f2bed554" />

## Progreso de aplicación

### Vistas Completadas
- **Welcome**: La vista "_home_" de la aplicación esta completada. Es una página de bienvenida con acceso a diferentes partes de la aplicación.
- **Reglas**: Completado, no es más que una página estática con las normas del juego.
- **Autores**: Completado, muestra los integrantes del equipo que han realizado el proyecto, es estática.
- **Perfil de usuario**: Completado, pagina donde puedes insegresar y sacar dinero, además de mostrar información sobre el perfil (como fichas, cervezas y posición en el ranking).
- **Ajustes del perfil**: Completado, permite cambiar la información del usuario (como nombre de usuario, nombre real, contraseña...)
- **Ranking**: Muestra los posiciones de los mejores jugadores. Se actualiza mediante webshockets, una vez una partida finaliza se envia un mensaje para actualizar el ranking.
- **Administrar**: Se puden ver todos los usuario regstrados y puedes banearlos. Te permite ver y buscar los mensajes de todas las salas (o del chat global) para poder moderar.
- **Chats**: Se pude chatear en 2 chats, uno global y otro por sala. Todos los chats funciona con webshockets, para mantener la estabilidad de la aplicación no se recuperan
todos los mensajes solamente unos 50.
- **Login**: Se puede loguear un usuario ya registrado, en caso de no haberse registrado podrá hacerlo en la ventanda de registro.
- **Juego**: El juego funciona, ya se puede poner en listo el juego, apostar, pedir cartas, plantarse...

### Vistas parcialmente completas
- **Salas de Juego**: En las salas ya se puede meter correctamente los jugadores y reconoce cuantos jugadores hay dentro de la sala, falta que se actualice mediante webshockets.

### Vistas incompletas
Ninguna, todas las vistas están completas o en proceso.

### Resumen
Falta por terminar la lógica de la aplicación en el juego para completar el ~50% establecido. El resto de cosas como el chat o ranking se pueden dejar como segunda parte del proyecto.

## Contenido de los archivos de la aplicación

- en [src/main/java/es/ucm/fdi/iw](https://github.com/JorgeGUCM/Timba_de_Pepe/tree/main/src/main/java/es/ucm/fdi/iw) están los ficheros de configuración de Java de la aplicación. Por otra parte esta el fichero de configuración de propiedades en [application.properties](https://github.com/JorgeGUCM/Timba_de_Pepe/blob/main/src/main/resources/application.properties). En Java tenemos:

    * **AppConfig.java** - configura LocalData (usado para gestionar subida y bajada de ficheros de usuario) y fichero de internacionalización (que debería llamarse `Messages_XX.properties`, donde `XX` es un código como `es` para español ó `en` para inglés; y vivir en el directorio [resources](https://github.com/manuel-freire/iw/tree/main/plantilla/src/main/resources).
    * **IwApplication.java** - punto de entrada de Spring Boot
    * **IwUserDetailsService.java** - autenticación mediante base de datos. Referenciado desde SecurityConfig.java. La base de datos se inicializa tras cada arranque desde el [import.sql](https://github.com/JorgeGUCM/Timba_de_Pepe/blob/main/src/main/resources/import.sql), aunque tocando [application.properties](https://github.com/JorgeGUCM/Timba_de_Pepe/blob/main/src/main/resources/application.properties) puedes hacer que se guarde y cargue de disco, ignorando el _import_.
    * **LocalData.java** - facilita guardar y devolver ficheros de usuario (es decir, que no forman parte de los fuentes de tu aplicación). Para ello colabora con AppConfig y usa el directorio especificado en [application.properties](https://github.com/JorgeGUCM/Timba_de_Pepe/blob/main/src/main/resources/application.properties)
    * **LoginSuccessHandler.java** - añade una variable de sesión llamada `u` nada más entrar un usuario, con la información de ese usuario. Esta variable es accesible desde Thymeleaf con `${session.user}`, y desde cualquier _Mapping_ de controllador usando el argumento `HttpSession session`, y leyendo su valor vía `(User)session.getAttribute("u")`. También añade a la sesión algo de configuración para websockets (variables `ws` y `url`), que se escriben como JS en las cabeceras de las páginas en el fragmento [head.html](https://github.com/JorgeGUCM/Timba_de_Pepe/blob/main/src/main/resources/templates/fragments/head.html).
    * **SecurityConfig.java** - establece la configuración de seguridad. Modifica su método `configure` para decir quién puede hacer qué, mediante `hasRole` y `permitAll`. 
    * **StartupConfig.java** - se ejecuta nada más lanzarse la aplicación. En la plantilla sólo se usa para inicializar la `debug` a partir del [application.properties](https://github.com/JorgeGUCM/Timba_de_Pepe/blob/main/src/main/resources/application.properties), accesible desde Thymeleaf mediante `${application.debug}`
    * **WebSocketConfig.java** - configura uso de websockets
    * **WebSocketSecurityConfig.java** - seguridad para websockets

- en [src/main/java/es/ucm/fdi/iw/controller](https://github.com/manuel-freire/iw/tree/main/plantilla/src/main/java/es/ucm/fdi/iw/controller) hay 3 controladores:

  * **RootController.java** - para usuarios que acaban de llegar al sitio, gestiona `/` y `/login`
  * **AdminController.java** - para administradores, gestionando todo lo que hay bajo `/admin`. No hace casi nada, pero sólo pueden llegar allí los que tengan rol administrador (porque así lo dice en SecurityConfig.config)
  * **UserControlller.java** - para usuarios registrados, gestionando todo lo que hay bajo `/user`. Tiene funcionalidad útil para construir páginas:
  
    + Un ejemplo de método para gestionar un formulario de cambiar información del usuario (bajo `@PostMapping("/{id}")`)
    + Puede devolver imágenes de avatar, y permite también subirlas. Ver métodos `getPic` (bajo `@GetMapping("{id}/pic")`) y `postPic` (bajo `@PostMapping("{id}/pic")`)
    + Puede gestionar también peticiones AJAX (= que no devuelven vistas) para consultar mensajes recibidos, consultar cuántos mensajes no-leídos tiene ese usuario, y enviar un mensaje a ese usuario (`retrieveMessages`, `checkUnread` y `postMsg`, respectivamente). Esta última función también envía el mensaje via websocket al usuario, si es que está conectado en ese momento.
    
- en [src/main/resources](https://github.com/JorgeGUCM/Timba_de_Pepe/blob/main/src/main/resources) están las vistas, los recursos web estáticos, el contenido inicial de la BBDD, y las propiedades generales de la aplicación.

  * **static/**  - contiene recursos estáticos web, como ficheros .js, .css, ó imágenes que no cambian
  
    - **js/stomp.js** - necesario para usar STOMP sobre websockets (que es lo que usaremos para enviar y recibir mensajes)
    - **js/iw.js** - configura websockets, y contiene funciones de utilidad para gestionar AJAX y previsualización de imágenes
    - **js/ajax-demo.js** - ejemplos de AJAX, envío y recepción de mensajes por websockets, y previsualización de imágenes

  * **templates/** - contiene vistas, y fragmentos de vista (en `templates/fragments`)
  
    - **fragments/head.html** - para incluir en el `<head>` de tus páginas. Incluída desde  
    - **fragments/nav.html** - para incluir al comienzo del `<body>`, contiene una navbar. *Cambia los contenidos* para que tengan sentido para tu aplicación.    
    - **fragments/footer.html** - para incluir al final del `<body>`, con un footer. *Cambia su contenido visual*, pero ten en cuenta que es donde se cargan los .js de bootstrap, además de `stomp.js` e `iw.js`.
    - **error.html** - usada cuando se producen errores. Tiene un comportamiento muy distinto cuando la aplicación está en modo `debug` y cuando no lo está. 
    - **user.html** - vista de usuario. Debería mostrar información sobre un usuario, y posiblemente formularios para modificarle, pero en la plantilla se usa para demostrar funcionamiento de AJAX y websockets, en conjunción con `static/js/ajax-demo.js`. Deberías, lógicamente, *cambiar su contenido*.
  
  * **application.properties** - contiene la configuración general de la aplicación. Ojo porque ciertas configuraciones se hacen en los ficheros `XyzConfig.java` vistos anteriormente. Por ejemplo, qué roles pueden acceder a qué rutas se configura desde `SecurityConfig.java`.
  * **import.sql** - contiene código SQL para inicializar la BBDD. La configuración inicial hace que la BBDD se borre y reinicialice a cada arranque, lo cual es útil para pruebas. Es posible cambiarla para que la BBDD persista entre arraques de la aplicación, y se ignore el `import.sql`.
    
