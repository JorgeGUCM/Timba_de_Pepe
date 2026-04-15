package es.ucm.fdi.iw.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import es.ucm.fdi.iw.model.Juego;
import es.ucm.fdi.iw.model.Jugador;
import es.ucm.fdi.iw.model.User;
import es.ucm.fdi.iw.model.Juego.state;
import es.ucm.fdi.iw.model.Jugador.estadoJugador;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpSession;

/*
* Controlador de juego
*/
@Controller
@RequestMapping("juego")
public class JuegoController {
    private static final Logger log = LogManager.getLogger(JuegoController.class);

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private ObjectMapper mapper = new ObjectMapper();

    @ModelAttribute
    public void populateModel(HttpSession session, Model model) {
        for (String name : new String[] { "u", "url", "ws", "topics" }) {
            model.addAttribute(name, session.getAttribute(name));
        }
    }

    private boolean comprobarJugador(HttpSession session, Jugador j) {
        return ((User) session.getAttribute("u")).getId() != j.getUser().getId();
    }

    private Map<String, Object> generarEstado(String resultado, Jugador j, Juego juego) {
        List<Map<String, Object>> jugadores = new ArrayList<>();
        juego.getJugadores().forEach((jugador) -> {
            jugadores.add(Map.of(
                    "nombre", jugador.getUser().getUsername(),
                    "posTablero", jugador.getPosicionMesa(),
                    "apuesta", jugador.getApuesta(),
                    "ganancias", jugador.getGanancias(),
                    "estado", jugador.getEstado(),
                    "numCartas", jugador.getNumCartas()));
        });

        Map<String, Object> estado = new HashMap<>();
        estado.putAll(Map.of(
                "result", resultado,
                "idTablero", juego.getId(),
                "nombreTablero", juego.getNombre(),
                "estadoJuego", juego.getEstado(),
                "minBet", juego.getMin_bet(),
                "idJugador", (j != null) ? j.getId() : -1,
                "posJugador", (j != null) ? j.getPosicionMesa() : -1,
                "cartasJugador", (j != null) ? j.getCartas() : "[]",
                "numJugadores", juego.getNum_jugadores(),
                "jugadores", jugadores));
        log.info(estado);

        return estado;
    }

    @GetMapping("")
    @Transactional
    public String juego(Model model, HttpSession session, @RequestParam("id") Long idTablero) {
        if (session.getAttribute("u") == null) {
            return "redirect:/login";
        }

        Juego juego = entityManager.find(Juego.class, idTablero);

        if (juego == null)
            return "redirect:/salas";

        Map<String, Object> estado = new HashMap<>();
        estado.putAll(Map.of(
                "result", "CARGADO",
                "idTablero", juego.getId(),
                "nombreTablero", juego.getNombre(),
                "estadoJuego", juego.getEstado(),
                "minBet", juego.getMin_bet(),
                "numJugadores", juego.getNum_jugadores(),
                "jugadores", "[]"));
        log.info(estado);
        model.addAttribute("estado", estado);

        return "juego";
    }

    @PostMapping("{idTablero}/entrar")
    @ResponseBody
    @Transactional
    public Map<String, Object> entrarPartida(Model model, HttpSession session, @PathVariable long idTablero) {

        User sessionUser = (User) session.getAttribute("u");
        User user = entityManager.find(User.class, sessionUser.getId());
        Juego juego = entityManager.find(Juego.class, idTablero);

        Jugador nuevo = new Jugador();
        boolean estaPartida = false;
        for (Jugador jugador : juego.getJugadores()) {
            if (jugador.getUser().getId() == user.getId()) {
                estaPartida = true;
                nuevo = jugador;
                break;
            }
        }

        if (!estaPartida && juego.getEstado() == state.COMPLETO)
            return Map.of("error", "Juego completo.");

        if (!estaPartida && juego.getEstado() == state.JUGANDO)
            return Map.of("error", "Juego ya comenzado.");

        log.info((estaPartida) ? "Ya esta en partida" : "Creando nuevo Jugador");

        if (!estaPartida) {
            nuevo.setUser(user);
            nuevo.setJuego(juego);
            nuevo.setEstado(estadoJugador.ACTIVO);
            nuevo.setApuesta(0);
            nuevo.setGanancias(0);
            nuevo.setPuntuacion(0);
            nuevo.setPosicionMesa(juego.getNum_jugadores());
            nuevo.setCartas("[]");

            log.info("Jugador nuevo");

            entityManager.persist(nuevo);
            juego.getJugadores().add(nuevo);
            juego.setNum_jugadores(juego.getNum_jugadores() + 1);
            if (juego.getNum_jugadores() >= 4)
                juego.setEstado(state.COMPLETO);
        }

        if (juego.getNum_jugadores() >= 4)
            juego.setEstado(state.COMPLETO);

        Map<String, Object> estado = generarEstado("ENTRADO", nuevo, juego);

        if (!estaPartida) {
            try {
                messagingTemplate.convertAndSend("/topic/juego/" + juego.getId(), mapper.writeValueAsString(estado));
            } catch (Exception e) {
                log.error("No se a podido enviar por webshocket del nuevo jugador: ", e.getMessage());
            }
        }

        return estado;
    }

    @PostMapping("{idTablero}/apostar")
    @ResponseBody
    @Transactional
    public String apostar(Model model, HttpSession session, @RequestBody JsonNode o, @PathVariable Long idTablero) {

        Long idJugador = o.get("idJugador").asLong();
        int cant = o.get("cant").asInt();

        Jugador j = entityManager.find(Jugador.class, idJugador);
        Juego juego = entityManager.find(Juego.class, idTablero);

        if (j == null)
            return "{\"error\": \"No se ha encontrado el jugador\"}";

        if (comprobarJugador(session, j))
            return "{\"error\": \"Se ha detectado la manipulación de datos.\"}";

        if (juego.getEstado() != state.JUGANDO)
            return "{\"warning\": \"¡El juego no a comenzado!\"}";

        if (cant <= 0)
            return "{\"error\": \"La cantidad a apostar debe ser al menos de : " + juego.getMin_bet() + "\"}";

        if (cant > j.getUser().getFichas())
            return "{\"error\": \"No tienes suficientes fichas\"}";

        j.setApuesta(j.getApuesta() + cant);
        j.getUser().setFichas(j.getUser().getFichas() - cant);

        session.setAttribute("u", j.getUser());

        return "{\"cant\": \"" + j.getApuesta() + "\", \"fichas\": \"" + j.getUser().getFichas() + "\"}";
    }

    @PostMapping("{idTablero}/listo")
    @ResponseBody
    @Transactional
    public String jugadorListo(Model model, HttpSession session, @RequestBody JsonNode o,
            @PathVariable Long idTablero) {

        Long idJugador = o.get("idJugador").asLong();

        Jugador j = entityManager.find(Jugador.class, idJugador);
        Juego juego = entityManager.find(Juego.class, idTablero);

        if (j == null)
            return "{\"error\": \"No se ha encontrado el jugador\"}";

        if (juego.getEstado() == state.JUGANDO)
            return "{\"warning\": \"¡El juego ya ha comenzado!\"}";

        if (comprobarJugador(session, j))
            return "{\"error\": \"Se ha detectado la manipulación de datos.\"}";

        j.setEstado(estadoJugador.LISTO);
        entityManager.merge(j);

        boolean todosListos = true;
        for (Jugador jugador : juego.getJugadores()) {
            if (jugador.getEstado() != estadoJugador.LISTO) {
                todosListos = false;
                break;
            }
        }

        log.info((todosListos) ? "El juego comienza" : "Falta gente por estar lista");

        if (todosListos)
            juego.setEstado(state.JUGANDO);

        Map<String, Object> estado = generarEstado("ESTADO_CAMBIADO", j, juego);

        try {
            messagingTemplate.convertAndSend("/topic/juego/" + juego.getId(), mapper.writeValueAsString(estado));
        } catch (Exception e) {
            log.error("No se a podido enviar por webshocket del cambio de estado: ", e.getMessage());
            return "{\"error\": \"Al mandar la información del juego.\"}";
        }

        return "{\"success\": \"Estado cambiado con exito\"}";
    }

}
