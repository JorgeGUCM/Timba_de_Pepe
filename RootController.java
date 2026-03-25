package es.ucm.fdi.iw.controller;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import es.ucm.fdi.iw.model.*;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;

/**
 * Non-authenticated requests only.
 */
@Controller
public class RootController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private EntityManager entityManager;

    private static final Logger log = LogManager.getLogger(RootController.class);

    @ModelAttribute
    public void populateModel(HttpSession session, Model model) {
        for (String name : new String[] { "u", "url", "ws", "topics" }) {
            model.addAttribute(name, session.getAttribute(name));
        }
    }

    @GetMapping("/login")
    public String login(Model model, HttpServletRequest request) {
        boolean error = request.getQueryString() != null && request.getQueryString().indexOf("error") != -1;
        model.addAttribute("loginError", error);
        return "login";
    }

    @GetMapping("/")
    public String index(Model model) {
        return "index";
    }

    @GetMapping("/autores")
    public String autores(Model model) {
        return "autores";
    }

    @GetMapping("/ranking")
    public String ranking(Model model) {
        return "ranking";
    }

    @GetMapping("/perfil-usuario")
    public String perfil(Model model) {
        return "perfil";
    }

    @GetMapping("/salas")
    public String salas(Model model, HttpSession session) {
        if (session.getAttribute("u") == null) {
            return "redirect:/login";
        }

        List<Juego> salasArr = entityManager
                .createQuery("SELECT j FROM Juego j", Juego.class)
                .getResultList();

        model.addAttribute("salas", salasArr);
        return "salas";
    }

    @PostMapping("/salas/crear")
    @Transactional
    public String crearSala(
            @RequestParam String nombre,
            @RequestParam Juego.dificulty dificultad,
            @RequestParam int min_bet,
            HttpSession session) {
        User creador = (User) session.getAttribute("u");
        if (creador == null)
            return "redirect:/login";

        Juego nuevoJuego = new Juego();
        nuevoJuego.setNombre(nombre);
        nuevoJuego.setDificultad(dificultad);
        nuevoJuego.setMin_bet(min_bet);
        nuevoJuego.setEstado(Juego.state.ESPERANDO);
        nuevoJuego.setNum_jugadores(0);

        entityManager.persist(nuevoJuego);

        Topic chat = new Topic();
        chat.setName("Chat de " + nombre);
        chat.setKey(UUID.randomUUID().toString());
        chat.setJuego(nuevoJuego);
        entityManager.persist(chat);
        nuevoJuego.setChat(chat);

        return "redirect:/salas";
    }

    @GetMapping("/juego")
    @Transactional
    public String juego(Model model, HttpSession session, @RequestParam("id") long juegoId) {
        if (session.getAttribute("u") == null) {
            return "redirect:/login";
        }

        User sessionUser = (User) session.getAttribute("u");
        User user = entityManager.find(User.class, sessionUser.getId());
        Juego juego = entityManager.find(Juego.class, juegoId);

        Jugador jugadorActual = null;
        int maxAsiento = 0;
        long usuariosUnicos = 0;

        if (juego.getJugadores() != null) {
            usuariosUnicos = juego.getJugadores().stream()
                    .map(j -> j.getUser().getId())
                    .distinct()
                    .count();

            for (Jugador j : juego.getJugadores()) {
                if (j.getPosicionMesa() > maxAsiento) {
                    maxAsiento = j.getPosicionMesa();
                }
                if (j.getUser().getId() == user.getId()) {
                    if (jugadorActual == null || j.getId() > jugadorActual.getId()) {
                        jugadorActual = j;
                    }
                }
            }
        }

        if (jugadorActual == null) {
            if (usuariosUnicos < 4) {
                jugadorActual = new Jugador();
                jugadorActual.setUser(user);
                jugadorActual.setJuego(juego);
                jugadorActual.setEstado(Jugador.estadoJugador.ESPERANDO);
                jugadorActual.setApuesta(0);
                jugadorActual.setPuntuacion(0.0);
                jugadorActual.setPosicionMesa(maxAsiento + 1);

                entityManager.persist(jugadorActual);

                juego.setNum_jugadores((int) usuariosUnicos + 1);
                if (juego.getNum_jugadores() == 4) {
                    juego.setEstado(Juego.state.COMPLETO);
                }
            } else {
                return "redirect:/salas";
            }
        }

    
        List<Map<String, Object>> jugadoresList = new java.util.ArrayList<>();
        if (juego.getJugadores() != null) {
            for (Jugador j2 : juego.getJugadores()) {
                jugadoresList.add(Map.of(
                    "posicionMesa", j2.getPosicionMesa(),
                    "nombre", j2.getUser().getUsername(),
                    "puntuacion", j2.getPuntuacion(),
                    "estado", j2.getEstado() != null ? j2.getEstado().name() : "ESPERANDO",
                    "cartas", j2.getCartas() != null && !j2.getCartas().isEmpty() ? j2.getCartas() : "[]"
                ));
            }
        }
        
        // Si es nuestra primera vez, forzamos meternos en el JSON
        boolean actualEncontrado = false;
        for(Map<String, Object> map : jugadoresList) {
            if((Integer)map.get("posicionMesa") == jugadorActual.getPosicionMesa()) {
                actualEncontrado = true; break;
            }
        }
        if(!actualEncontrado) {
            jugadoresList.add(Map.of(
                "posicionMesa", jugadorActual.getPosicionMesa(),
                "nombre", user.getUsername(),
                "puntuacion", 0.0,
                "estado", "ESPERANDO",
                "cartas", "[]"
            ));
        }

        try {
            model.addAttribute("jugadoresJson", new ObjectMapper().writeValueAsString(jugadoresList));
        } catch(Exception e){
            model.addAttribute("jugadoresJson", "[]");
        }
     

        model.addAttribute("jugadorActual", jugadorActual);
        model.addAttribute("juego", juego);
        return "juego";
    }

    @PostMapping("/jugador/{id}/actualizar")
    @ResponseBody
    @Transactional
    public Map<String, String> actualizarJugador(
            @PathVariable long id, 
            @RequestBody JsonNode datos, 
            HttpServletResponse response) {
            
        Jugador j = entityManager.find(Jugador.class, id);
        
        if (j != null) {
            String cartasJson = datos.has("cartas") ? datos.get("cartas").toString() : "[]"; 
            double puntuacion = datos.has("puntuacion") ? datos.get("puntuacion").asDouble() : 0.0;
            String estadoStr = datos.has("estado") ? datos.get("estado").asText() : null;
            
            // INTENTAR LEER EL NOMBRE ENVIADO DESDE EL CLIENTE, SINO USAR EL DE LA BD
            String nombreJugador = datos.has("nombre") && !datos.get("nombre").asText().equals("null") 
                                   ? datos.get("nombre").asText() 
                                   : j.getUser().getUsername();
            
            if(datos.has("apuesta")) {
                j.setApuesta(datos.get("apuesta").asInt());
            }
            
            if(datos.has("fichas")) {
                User u = j.getUser();
                if(u != null) {
                    u.setFichas(datos.get("fichas").asInt());
                    entityManager.merge(u); 
                }
            }

            if(datos.has("ganancias")) {
                j.setGanancias(datos.get("ganancias").asInt());
            }
            
            j.setCartas(cartasJson);
            j.setPuntuacion(puntuacion);
            
            if (estadoStr != null && !estadoStr.isEmpty()) {
                j.setEstado(Jugador.estadoJugador.valueOf(estadoStr));
            }
            
            entityManager.merge(j);

            ObjectMapper mapper = new ObjectMapper();
            
            // Enviamos el nombreJugador explícitamente para que la vista del jugador 1 se entere
            Map<String, Object> estadoParaEnviar = Map.of(
                "tipo", "ACTUALIZAR_JUGADOR",
                "jugadorId", j.getId(),
                "nombre", nombreJugador, 
                "posicionMesa", j.getPosicionMesa(), 
                "cartas", datos.get("cartas"), 
                "puntuacion", j.getPuntuacion(),
                "estado", j.getEstado().toString()
            );

            try{
                String json = mapper.writeValueAsString(estadoParaEnviar); 
                messagingTemplate.convertAndSend("/topic/juego/" + j.getJuego().getId(), json);
            } catch(Exception e){
                System.out.println("Error enviando WebSockets: " + e.getMessage());
            }
            
            return Map.of("status", "ok", "message", "Estado y apuesta guardados");
        }
        
        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        return Map.of("error", "Jugador no encontrado");
    }

    @PostMapping("/juego/{id}/iniciar")
    @ResponseBody
    @Transactional
    public Map<String, Object> iniciarPartidaGlobal(@PathVariable long id) {
        Juego juego = entityManager.find(Juego.class, id);
        if (juego != null) {
            juego.setEstado(Juego.state.JUGANDO);
            entityManager.merge(juego);
            
            try {
                ObjectMapper mapper = new ObjectMapper();
                // Enviamos el evento de inicio a todos en la sala
                String json = mapper.writeValueAsString(Map.of("tipo", "INICIO_PARTIDA"));
                messagingTemplate.convertAndSend("/topic/juego/" + juego.getId(), json);
            } catch (Exception e) {
                log.error("Error enviando WS", e);
            }
            return Map.of("status", "ok");
        }
        return Map.of("error", "Juego no encontrado");
    }

    @PostMapping("/jugador/{id}/nueva-ronda")
    @ResponseBody
    @Transactional
    public Map<String, Object> nuevaRonda(@PathVariable long id) {
        // Buscamos la fila de la ronda que acaba de terminar
        Jugador jugadorViejo = entityManager.find(Jugador.class, id);
        
        if (jugadorViejo != null) {
            // Creamos una copia en blanco para la nueva ronda
            Jugador jugadorNuevo = new Jugador();
            jugadorNuevo.setUser(jugadorViejo.getUser());
            jugadorNuevo.setJuego(jugadorViejo.getJuego());
            jugadorNuevo.setEstado(Jugador.estadoJugador.ESPERANDO);
            jugadorNuevo.setApuesta(0);
            jugadorNuevo.setPuntuacion(0.0);
            jugadorNuevo.setPosicionMesa(jugadorViejo.getPosicionMesa()); // Se sienta en la misma silla
            
            entityManager.persist(jugadorNuevo);
            
            // Devolvemos el ID de esta nueva fila a JavaScript
            return Map.of("status", "ok", "nuevoId", jugadorNuevo.getId());
        }
        return Map.of("error", "Jugador no encontrado");
    }
        // AÑADE ESTO DEBAJO DEL RESTO DE POSTMAPPINGS
    @PostMapping("/juego/{id}/salir")
    @ResponseBody
    @Transactional
    public Map<String, Object> salirSala(@PathVariable long id, HttpSession session) {
        User sessionUser = (User) session.getAttribute("u");
        if (sessionUser == null) return Map.of("error", "No autorizado");

        Juego juego = entityManager.find(Juego.class, id);
        if (juego != null && juego.getJugadores() != null) {
            // Buscamos al jugador de este usuario en esta sala
            Jugador jugadorAborrar = null;
            for (Jugador j : juego.getJugadores()) {
                if (j.getUser().getId() == sessionUser.getId()) {
                    jugadorAborrar = j;
                    break;
                }
            }

            if (jugadorAborrar != null) {
                // Notificamos por WS que el jugador se ha ido
                try {
                    Map<String, Object> estadoParaEnviar = Map.of(
                        "tipo", "JUGADOR_SALE",
                        "posicionMesa", jugadorAborrar.getPosicionMesa()
                    );
                    String json = new ObjectMapper().writeValueAsString(estadoParaEnviar); 
                    messagingTemplate.convertAndSend("/topic/juego/" + juego.getId(), json);
                } catch(Exception e) {}

                entityManager.remove(jugadorAborrar);
                juego.setNum_jugadores(Math.max(0, juego.getNum_jugadores() - 1));
                if (juego.getNum_jugadores() == 0) {
                    juego.setEstado(Juego.state.ESPERANDO);
                }
                entityManager.merge(juego);
                return Map.of("status", "ok");
            }
        }
        return Map.of("error", "Jugador no encontrado");
    }

    @GetMapping("/reglas")
    public String reglas(Model model) {
        return "reglas";
    }
}