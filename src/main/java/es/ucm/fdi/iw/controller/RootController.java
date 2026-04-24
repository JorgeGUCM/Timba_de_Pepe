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
    @Transactional
    public String ranking(Model model) {
        // Obtenemos los usuarios reales ordenados por cervezas totales
        List<User> topUsuarios = entityManager.createQuery(
                "SELECT u FROM User u ORDER BY u.cervezas_totales DESC", User.class)
                .setMaxResults(50) // Limitamos a 50 por ahora para no recargar
                .getResultList();

        model.addAttribute("topUsuarios", topUsuarios);
        return "ranking";
    }

    @GetMapping("/perfil-usuario")
    public String perfil(Model model) {
        return "perfil";
    }

    @GetMapping("/reglas")
    public String reglas(Model model) {
        return "reglas";
    }
}