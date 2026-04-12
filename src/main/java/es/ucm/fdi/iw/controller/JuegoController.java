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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.fasterxml.jackson.core.JsonProcessingException;
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

    @ModelAttribute
    public void populateModel(HttpSession session, Model model) {
        for (String name : new String[] { "u", "url", "ws", "topics" }) {
            model.addAttribute(name, session.getAttribute(name));
        }
    }

    @GetMapping("")
    @Transactional
    public String juego(Model model, HttpSession session, @RequestParam("id") Long idTablero) {
        if (session.getAttribute("u") == null) {
            return "redirect:/login";
        }

        Juego juego = entityManager.find(Juego.class, idTablero);

        Map<String, Object> estado = new HashMap<>();
        estado.putAll(Map.of(
            "result", "CARGADO",
            "idTablero", juego.getId(),
            "nombreTablero", juego.getNombre(),
            "estadoJuego", juego.getEstado(),
            "minBet", juego.getMin_bet(),
            "numJugadores", juego.getNum_jugadores(),
            "jugadores", "[]"
        ));
        log.info(estado);
        model.addAttribute("estado", estado);
        
        return "juego";
    }

    @PostMapping("{idTablero}/entrar")
    @ResponseBody
    @Transactional
    public Map<String, Object> getMethodName(Model model, HttpSession session, @PathVariable long idTablero) {
        
        User sessionUser = (User) session.getAttribute("u");
        User user = entityManager.find(User.class, sessionUser.getId());
        Juego juego = entityManager.find(Juego.class, idTablero);

        if(juego.getNum_jugadores() >= 4)
            return Map.of("error", "Sala completa");

        Jugador nuevo;
        boolean estaPartida = false;
        for(Jugador jugador : juego.getJugadores()) {
            if(jugador.getUser().getId() == user.getId()){
                estaPartida = true;
                nuevo  = jugador;
                break;
            }
        }

        log.info((estaPartida)? "Ya esta en partida" : "Creando nuevo Jugador");

        if(!estaPartida){
            nuevo = new Jugador();
            nuevo.setUser(user);
            nuevo.setJuego(juego);
            nuevo.setEstado(estadoJugador.ESPERANDO);
            nuevo.setApuesta(0);
            nuevo.setGanancias(0);
            nuevo.setPuntuacion(0);
            nuevo.setPosicionMesa(juego.getNum_jugadores());
            nuevo.setCartas("{}");
    
            log.info("Jugador nuevo: \n" + nuevo.toString());
    
            entityManager.persist(nuevo);
            juego.getJugadores().add(nuevo);
            juego.setNum_jugadores(juego.getNum_jugadores() + 1);
            if(juego.getNum_jugadores() >= 4)
                juego.setEstado(state.COMPLETO);
        }

        List<Map<String, Object>> jugadores = new ArrayList<>();
        juego.getJugadores().forEach((jugador) -> {
            jugadores.add(Map.of(
                "idUsuario", jugador.getUser().getId(),
                "posTablero", jugador.getPosicionMesa(),
                "apuesta", jugador.getApuesta(),
                "ganancias", jugador.getGanancias(),
                "estado", jugador.getEstado(),
                "cartas", jugador.getCartas()
            ));
        });

        Map<String, Object> estado = new HashMap<>();
        estado.putAll(Map.of(
            "result", "ENTRADO",
            "idTablero", juego.getId(),
            "nombreTablero", juego.getNombre(),
            "estadoJuego", juego.getEstado(),
            "minBet", juego.getMin_bet(),
            "numJugadores", juego.getNum_jugadores(),
            "jugadores", jugadores
        ));
        log.info(estado);
        model.addAttribute("estado", estado);

        return estado;
    }
    
}
