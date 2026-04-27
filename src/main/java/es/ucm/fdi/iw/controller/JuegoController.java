package es.ucm.fdi.iw.controller;

import java.util.ArrayList;
import java.util.Collections;
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

import com.fasterxml.jackson.core.type.TypeReference;
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

    private static final List<Character> PALOS = List.of('B', 'C', 'E', 'O');
    private static final List<String> NUMS = List.of("1", "2", "3", "4", "5", "6", "7", "S", "C", "R");
    private static final List<Character> FIGURAS = List.of('S', 'C', 'R');

    private static final int CERVEZAS_GANADAS = 2;

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
                    "puntos", (juego.getEstado() == state.FINALIZADO) ? jugador.getPuntuacion() : "?",
                    "estado",
                    (juego.getEstado() != state.JUGANDO || (j != null && j.getId() == jugador.getId()))
                            ? jugador.getEstado()
                            : estadoJugador.LISTO,
                    "cartas", (juego.getEstado() == state.FINALIZADO) ? jugador.getCartas() : "[]",
                    "numCartas", jugador.getNumCartas(),
                    "fichas", (juego.getEstado() == state.FINALIZADO) ? jugador.getUser().getFichas() : "?",
                    "cervezas",
                    (juego.getEstado() == state.FINALIZADO) ? jugador.getUser().getCervezas_actuales() : "?"));
        });

        Map<String, Object> estado = new HashMap<>();
        estado.putAll(Map.of(
                "result", resultado,
                "idTablero", juego.getId(),
                "nombreTablero", juego.getNombre(),
                "estadoJuego", juego.getEstado(),
                "minBet", juego.getMin_bet(),
                "jugadorAct", Map.of(
                        "idJugador", (j != null) ? j.getId() : -1,
                        "posJugador", (j != null) ? j.getPosicionMesa() : -1,
                        "cartas", (j != null) ? j.getCartas() : "[]",
                        "puntos", (j != null) ? j.getPuntuacion() : "?"),
                "numJugadores", juego.getNum_jugadores(),
                "jugadores", jugadores));
        log.info(estado);

        return estado;
    }

    private void barajarBaraja(List<String> baraja) {
        for (int i = baraja.size() - 1; i > 0; i--) {
            int j = (int) Math.floor(Math.random() * (i + 1));
            Collections.swap(baraja, i, j);
        }
    }

    private String crearBaraja() {
        List<String> baraja = new ArrayList<>();

        for (Character palo : PALOS) {
            for (String num : NUMS)
                baraja.add(num + palo);
        }
        log.info("Baraja creada: " + baraja.toString());

        barajarBaraja(baraja);
        log.info("Baraja barajada: " + baraja.toString());

        String res = "";
        try {
            res = mapper.writeValueAsString(baraja);
        } catch (Exception e) {
            log.error("No se a podido generar la baraja", e.getMessage());
        }

        return res;
    }

    private double puntosCarta(String carta) {
        if (FIGURAS.contains(carta.charAt(0)))
            return 0.5;
        else
            return Character.getNumericValue(carta.charAt(0));
    }

    private boolean finJuego(Juego juego) {
        for (Jugador jugador : juego.getJugadores()) {
            if (jugador.getEstado() == estadoJugador.LISTO)
                return false;
        }
        return true;
    }

    private void repartoDinero(Juego juego, HttpSession session, User user) {
        juego.setEstado(state.FINALIZADO);
        List<Jugador> jugadores = juego.getJugadores();

        // Reparto de fichas
        int fichasTotales = 0;
        for (Jugador j : jugadores) {
            fichasTotales += j.getApuesta();
        }

        List<Jugador> ganadores = new ArrayList<>();
        if (jugadores.size() == 1) {
            ganadores.add(jugadores.get(0));
        } else {
            int i = 0, j = 1;
            while (i < juego.getNum_jugadores() - 1 && j < juego.getNum_jugadores()) {
                if (jugadores.get(i).getPuntuacion() > jugadores.get(j).getPuntuacion()) {
                    ganadores.add(jugadores.get(i));
                    j++;
                } else if (jugadores.get(i).getPuntuacion() < jugadores.get(j).getPuntuacion()) {
                    ganadores.add(jugadores.get(j));
                    i = j;
                    j++;
                } else {
                    ganadores.add(jugadores.get(i));
                    ganadores.add(jugadores.get(j));
                    j++;
                }
            }
        }

        for (Jugador g : ganadores) {
            fichasTotales -= g.getApuesta();
        }
        ;

        for (Jugador g : ganadores) {
            User u = g.getUser();
            int fichas = u.getFichas() + fichasTotales / ganadores.size() + g.getApuesta();
            u.setFichas(fichas);
            int nuevas_cervezas = (CERVEZAS_GANADAS * (jugadores.size() - ganadores.size()));
            u.setCervezas_totales(u.getCervezas_totales() + nuevas_cervezas);
            u.setCervezas_actuales(u.getCervezas_actuales() + nuevas_cervezas);
        }

        // TODO hacer ws a ranking

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

        if (juego.getNum_jugadores() >= 4 && juego.getEstado() != state.JUGANDO)
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

        j.setCartas("[]");
        j.setNumCartas(0);
        j.setApuesta(0);
        j.setPuntuacion(0);
        j.setEstado(estadoJugador.LISTO);

        if (juego.getEstado() == state.FINALIZADO)
            juego.setEstado(state.ESPERANDO);

        boolean todosListos = true;
        for (Jugador jugador : juego.getJugadores()) {
            if (jugador.getEstado() != estadoJugador.LISTO) {
                todosListos = false;
                break;
            }
        }

        log.info((todosListos) ? "El juego comienza" : "Falta gente por estar lista");

        if (todosListos) {
            juego.setBaraja(crearBaraja());
            juego.setEstado(state.JUGANDO);
        }

        Map<String, Object> estado = generarEstado("ESTADO_CAMBIADO", j, juego);

        String result = "";
        try {
            result = mapper.writeValueAsString(estado);
            messagingTemplate.convertAndSend("/topic/juego/" + juego.getId(), result);
        } catch (Exception e) {
            log.error("No se a podido enviar por webshocket del cambio de estado: ", e.getMessage());
            return "{\"error\": \"Al mandar la información del juego.\"}";
        }

        return result;
    }

    @PostMapping("{idTablero}/pedirCarta")
    @ResponseBody
    @Transactional
    public String pedirCarta(Model model, HttpSession session, @RequestBody JsonNode o,
            @PathVariable Long idTablero) {

        Long idJugador = o.get("idJugador").asLong();

        Jugador j = entityManager.find(Jugador.class, idJugador);
        Juego juego = entityManager.find(Juego.class, idTablero);

        if (j == null)
            return "{\"error\": \"No se ha encontrado el jugador\"}";

        if (juego.getEstado() != state.JUGANDO)
            return "{\"warning\": \"¡El juego no ha comenzado!\"}";

        if (comprobarJugador(session, j))
            return "{\"error\": \"Se ha detectado la manipulación de datos.\"}";

        if (j.getEstado() != estadoJugador.LISTO)
            return "{\"error\": \"El jugador debe de estar jugando.\"}";

        List<String> cartas = new ArrayList<>();
        List<String> baraja = new ArrayList<>();
        try {
            baraja = mapper.readValue(juego.getBaraja(), new TypeReference<List<String>>() {
            });
            cartas = mapper.readValue(j.getCartas(), new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            log.error("Error parseando la baraja o cartas del jugador: " + e.getMessage());
            return "{\"error\": \"No se pudo parsear la baraja o cartas del jugador.\"}";
        }

        if (baraja.isEmpty()) {
            log.error("Baraja Vacia");
            return "{\"error\": \"Baraja vacia.\"}";
        }
        barajarBaraja(baraja);
        cartas.add(baraja.getLast());
        double puntos = puntosCarta(baraja.getLast());
        baraja.removeLast();

        try {
            juego.setBaraja(mapper.writeValueAsString(baraja));
            j.setCartas(mapper.writeValueAsString(cartas));
            j.setPuntuacion(j.getPuntuacion() + puntos);
            j.setNumCartas(j.getNumCartas() + 1);
            if (j.getPuntuacion() > 7.5) {
                j.setEstado(estadoJugador.SOBREPUNTOS);

                if (finJuego(juego))
                    repartoDinero(juego, session, j.getUser());
            }
        } catch (Exception e) {
            log.error("Error guardando la baraja o cartas del jugador: " + e.getMessage());
            return "{\"error\": \"No se pudo guardar la baraja o las cartas del jugador.\"}";
        }

        String estado = "";
        try {
            estado = mapper.writeValueAsString(generarEstado("PEDIDO", j, juego));
            messagingTemplate.convertAndSend("/topic/juego/" + juego.getId(),
                    mapper.writeValueAsString(generarEstado("PEDIDO", null, juego)));
        } catch (Exception e) {
            log.error("No se pudo parsear el estado: ", e.getMessage());
            return "{\"error\": \"Al enviar la información del estado.\"}";
        }

        return estado;
    }

    @PostMapping("{idTablero}/plantar")
    @ResponseBody
    @Transactional
    public String plantar(Model model, HttpSession session, @RequestBody JsonNode o,
            @PathVariable Long idTablero) {

        Long idJugador = o.get("idJugador").asLong();

        Jugador j = entityManager.find(Jugador.class, idJugador);
        Juego juego = entityManager.find(Juego.class, idTablero);

        if (j == null)
            return "{\"error\": \"No se ha encontrado el jugador\"}";

        if (juego.getEstado() != state.JUGANDO)
            return "{\"warning\": \"¡El juego no ha comenzado!\"}";

        if (comprobarJugador(session, j))
            return "{\"error\": \"Se ha detectado la manipulación de datos.\"}";

        if (j.getEstado() != estadoJugador.LISTO)
            return "{\"error\": \"El jugador debe de estar jugando.\"}";

        j.setEstado(estadoJugador.PLANTADO);

        if (finJuego(juego))
            repartoDinero(juego, session, j.getUser());

        String estado = "";
        try {
            estado = mapper.writeValueAsString(generarEstado("PLANTADO", j, juego));
            messagingTemplate.convertAndSend("/topic/juego/" + juego.getId(),
                    mapper.writeValueAsString(generarEstado("PLANTADO", null, juego)));
        } catch (Exception e) {
            log.error("No se pudo parsear el estado: ", e.getMessage());
            return "{\"error\": \"Al enviar la información del estado.\"}";
        }

        return estado;
    }

    @PostMapping("/{idTablero}/salir")
    @ResponseBody
    @Transactional
    public String salir(Model model, HttpSession session, @RequestBody JsonNode o,
            @PathVariable Long idTablero) {

        Long idJugador = o.get("idJugador").asLong();

        Jugador j = entityManager.find(Jugador.class, idJugador);
        Juego juego = entityManager.find(Juego.class, idTablero);

        if (j == null)
            return "{\"error\": \"No se ha encontrado el jugador\"}";

        if (juego.getEstado() == state.JUGANDO)
            return "{\"warning\": \"¡El juego no ha comenzado!\"}";

        if (comprobarJugador(session, j))
            return "{\"error\": \"Se ha detectado la manipulación de datos.\"}";

        if (juego.getNum_jugadores() <= 0)
            return "{\"error\": \"No hay ningún jugador en la sala.\"}";

        // INFO: ahora mismo se desvincula el jugador del juego haciendo que no sea
        // posible recuperar el juego en el que jugo
        juego.setNum_jugadores(juego.getNum_jugadores() - 1);
        j.setJuego(null);

        if (juego.getEstado() == state.COMPLETO)
            juego.setEstado(state.ESPERANDO);

        log.info("Se ha eliminado al jugador del juego correctamente");

        try {
            messagingTemplate.convertAndSend("/topic/juego/" + juego.getId(),
                    mapper.writeValueAsString(generarEstado("SALIDO", null, juego)));
        } catch (Exception e) {
            log.error("No se pudo parsear el estado: ", e.getMessage());
            return "{\"error\": \"Al enviar la información del estado.\"}";
        }

        return "{\"success\": \"true\"}";
    }

    @PostMapping("/sessions")
    @ResponseBody
    @Transactional
    public String actualizarSesiones(HttpSession session, @RequestBody JsonNode o) {

        Long idJugador = o.get("idJugador").asLong();

        Jugador j = entityManager.find(Jugador.class, idJugador);

        if (comprobarJugador(session, j))
            return "{\"error\": \"¡Has manipulado datos!\"}";

        session.setAttribute("u", j.getUser());

        return "{\"success\": \"true\"}";
    }

}
