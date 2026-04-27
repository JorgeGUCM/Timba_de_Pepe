package es.ucm.fdi.iw.controller;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.fasterxml.jackson.databind.JsonNode;
import es.ucm.fdi.iw.model.User;
import es.ucm.fdi.iw.model.Juego;
import es.ucm.fdi.iw.model.Jugador;
import es.ucm.fdi.iw.model.Message;
import es.ucm.fdi.iw.model.Topic;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.servlet.http.HttpSession;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("chat")
public class ChatController {

    // Para poder sacar mensajes por consola
    private static final Logger log = LogManager.getLogger(ChatController.class);

    // Variable para WS
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Variable para la BD
    @Autowired
    private EntityManager entityManager;

    @PostMapping("/enviar")
    @ResponseBody // Para que no devuelva una vista http
    @Transactional // Para que sea de una tacada y no se raye la BD
    public Map<String, String> enviarMensaje(HttpSession session, @RequestBody JsonNode data) {
        User u = (User) session.getAttribute("u");
        if (u == null) {
            return Map.of("error", "Usuario no autenticado");
        }

        String text = data.get("text").asText();
        // Si nos pasan una sala, la usamos. Si no, por defecto es global.
        String room = data.has("room") ? data.get("room").asText() : "global";

        if (text.length() > 100) {
            return Map.of("result", "bad");
        }

        // Construimos el mensaje
        Map<String, String> msg = new HashMap<>();
        msg.put("type", "CHAT"); // Para que el fronted sepa que es un msg y no una carta
        msg.put("from", u.getUsername());
        msg.put("text", text);
        msg.put("sent", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));

        // Retransmitimos a la "tubería" correcta
        // Se envía por el WS correspondiente
        messagingTemplate.convertAndSend("/topic/chat/" + room, msg);

        // Para la BD

        // Necesario ponerlo porque con "u" se ralla cuando pones algo en la tabla
        // TOPIC_MEMBERS
        User sender = entityManager.find(User.class, u.getId());

        // Para la tabla TOPIC
        Topic topic = null;
        try {
            topic = entityManager.createNamedQuery("Topic.byKey", Topic.class)
                    .setParameter("key", room)
                    .getSingleResult();
        } catch (NoResultException e) {
            log.info("El chat '{}' no existe. Creándolo de forma automática...", room);
            topic = new Topic();
            topic.setKey(room);
            // Le ponemos un nombre genérico basado en la key
            topic.setName(room);

            entityManager.persist(topic);

            // Para añadir TOPIC_ID en la tabla JUEGO
            if (room.startsWith("sala_")) {
                long idJuego = Long.parseLong(room.replace("sala_", ""));
                Juego juego = entityManager.find(Juego.class, idJuego);

                boolean estaJugando = false;
                for (Jugador j : juego.getJugadores()) {
                    if (j.getUser().getId() == sender.getId()) {
                        estaJugando = true;
                    }
                }

                if (estaJugando) {
                    juego.setChat(topic);
                    // Ya de paso le cambiamos el nombre para que no tenga name = room = Key
                    topic.setName("Partida: " + juego.getNombre());
                }

                else {
                    log.info("Se ha iniciado un chat privado que no esta en un juego.");
                    log.info("WS: ", room);
                }
            }
        }

        // Para la tabla TOPIC_MEMBERS (N a N)
        // Se usa sender en vez de "u" porque nos lo chapan las cosas de HTTPS ciertas
        // extensiones
        if (!topic.getMembers().contains(sender)) {
            topic.getMembers().add(sender);
            sender.getGroups().add(topic);
            log.info("Usuario añadido al chat");
        }

        // Para la tabla MESSAGE
        Message message = new Message();
        message.setText(text);
        message.setSender(u);
        message.setTopic(topic);
        message.setDateSent(LocalDateTime.now());

        entityManager.persist(message);

        return Map.of("result", "ok");
    }

    // Se llama cuando se cambia de vista o F5
    // Para que te salgan los mensajes que ya había en ese chat con anterioridad
    @PostMapping("/recuperar")
    @ResponseBody
    @Transactional
    public List<Map<String, String>> recuperarMensajes(HttpSession session, @RequestBody JsonNode data) { // <-- Leemos
                                                                                                          // el JSON
        User u = (User) session.getAttribute("u");
        if (u == null) {
            return List.of();
        }

        // Sacamos la sala del tercer parámetro que manda el JS
        String room = data.get("room").asText();

        // Buscamos los mensajes
        List<Message> mensajesBD = entityManager.createQuery(
                "SELECT m FROM Message m WHERE m.topic.key = :room ORDER BY m.dateSent ASC", Message.class)
                .setParameter("room", room)
                .setMaxResults(50)
                .getResultList();

        // Mapeamos los mensajes
        List<Map<String, String>> historial = new ArrayList<>();
        for (Message m : mensajesBD) {
            Map<String, String> msg = new HashMap<>();
            msg.put("from", m.getSender().getUsername());
            msg.put("text", m.getText());
            msg.put("sent", m.getDateSent().format(DateTimeFormatter.ofPattern("HH:mm")));
            historial.add(msg);
        }

        return historial;
    }

}