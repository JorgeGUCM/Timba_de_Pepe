package es.ucm.fdi.iw.controller;

import java.util.List;

import java.util.UUID;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;


import es.ucm.fdi.iw.model.Juego;
import es.ucm.fdi.iw.model.User;


import es.ucm.fdi.iw.model.Topic;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpSession;

/*
* Controlador de juego
*/
@Controller
@RequestMapping("salas")
public class SalasController {
    private static final Logger log = LogManager.getLogger(JuegoController.class);

    @Autowired
    private EntityManager entityManager;   

    @ModelAttribute
    public void populateModel(HttpSession session, Model model) {
        for (String name : new String[] { "u", "url", "ws", "topics" }) {
            model.addAttribute(name, session.getAttribute(name));
        }
    }

 @GetMapping("")
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


    @PostMapping("/crear")
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

        return "redirect:/salas";
    }
}
