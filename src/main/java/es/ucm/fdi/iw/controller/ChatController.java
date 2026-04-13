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
import jakarta.servlet.http.HttpSession;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("chat")
public class ChatController {

    // Para poder sacar mensajes por consola
    private static final Logger log = LogManager.getLogger(ChatController.class);

    // Variable para WS
    @Autowired
    private SimpMessagingTemplate messagingTemplate;


    // Para la ruta /chat/global una peticion POST desde http
    @PostMapping("/global")
    @ResponseBody   // Para que no devuelva una vista http
    @Transactional  // Para que sea de una tacada y no se raye la BD
    public Map<String, String> enviarMensajeGlobal(HttpSession session, @RequestBody JsonNode data) {
        User u = (User) session.getAttribute("u");
        if (u == null) {
            return Map.of("error", "Usuario no autenticado");
        }

        String text = data.get("text").asText();
        
        // Construimos el mensaje
        Map<String, String> msg = new HashMap<>();
        msg.put("type", "CHAT");    // Para que el fronted sepa que es un msg y no una carta
        msg.put("from", u.getUsername());
        msg.put("text", text);
        msg.put("sent", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        
        // Sale por consola en plan OK
        log.info("Mensaje de chat global de {}: {}", u.getUsername(), text);

        // Retransmitimos por WebSockets a todos los clientes suscritos a /topic/chat
        messagingTemplate.convertAndSend("/topic/chat", msg);
        
        return Map.of("result", "ok");
    }
}