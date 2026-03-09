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
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import es.ucm.fdi.iw.model.*;
import java.util.List;
import java.util.UUID;

/**
 * Non-authenticated requests only.
 */
@Controller
public class RootController {

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
    public String juego(HttpSession session) {
        if (session.getAttribute("u") == null) {
            return "redirect:/login";
        }
        return "juego";
    }

    @GetMapping("/reglas")
    public String reglas(Model model) {
        return "reglas";
    }
}
