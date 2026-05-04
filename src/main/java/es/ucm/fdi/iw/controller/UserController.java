package es.ucm.fdi.iw.controller;

import es.ucm.fdi.iw.LocalData;
import es.ucm.fdi.iw.model.Message;
import es.ucm.fdi.iw.model.User;
import es.ucm.fdi.iw.model.User.Role;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.*;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Objects;

/**
 * User management.
 *
 * Access to this end-point is authenticated.
 */
@Controller()
@RequestMapping("user")
public class UserController {

  private static final Logger log = LogManager.getLogger(UserController.class);

  @Autowired
  private EntityManager entityManager;

  @Autowired
  private LocalData localData;

  @Autowired
  private SimpMessagingTemplate messagingTemplate;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @ModelAttribute
  public void populateModel(HttpSession session, Model model) {
    for (String name : new String[] { "u", "url", "ws", "topics" }) {
      model.addAttribute(name, session.getAttribute(name));
    }
  }

  /**
   * Exception to use when denying access to unauthorized users.
   * 
   * In general, admins are always authorized, but users cannot modify
   * each other's profiles.
   */
  @ResponseStatus(value = HttpStatus.FORBIDDEN, reason = "No eres administrador, y éste no es tu perfil") // 403
  public static class NoEsTuPerfilException extends RuntimeException {
  }

  /**
   * Encodes a password, so that it can be saved for future checking. Notice
   * that encoding the same password multiple times will yield different
   * encodings, since encodings contain a randomly-generated salt.
   * 
   * @param rawPassword to encode
   * @return the encoded password (typically a 60-character string)
   *         for example, a possible encoding of "test" is
   *         {bcrypt}$2y$12$XCKz0zjXAP6hsFyVc8MucOzx6ER6IsC1qo5zQbclxhddR1t6SfrHm
   */
  public String encodePassword(String rawPassword) {
    return passwordEncoder.encode(rawPassword);
  }

  /**
   * Generates random tokens. From https://stackoverflow.com/a/44227131/15472
   * 
   * @param byteLength
   * @return
   */
  public static String generateRandomBase64Token(int byteLength) {
    SecureRandom secureRandom = new SecureRandom();
    byte[] token = new byte[byteLength];
    secureRandom.nextBytes(token);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(token); // base64 encoding
  }

  /**
   * Landing page for a user profile
   */
  @GetMapping("{id}")
  public String index(@PathVariable long id, Model model, HttpSession session) {
    User target = entityManager.find(User.class, id);
    model.addAttribute("user", target);
    return "user";
  }

  /**
   * Alter or create a user
   */
  @PostMapping("/{id}")
  @Transactional
  public String postUser(
      HttpServletResponse response,
      @PathVariable long id,
      @ModelAttribute User edited,
      @RequestParam(required = false) String pass2,
      Model model, HttpSession session) throws IOException {

    User requester = (User) session.getAttribute("u");
    User target = null;
    if (id == -1 && requester.hasRole(Role.ADMIN)) {
      // create new user with random password
      target = new User();
      target.setPassword(encodePassword(generateRandomBase64Token(12)));
      target.setEnabled(true);
      entityManager.persist(target);
      entityManager.flush(); // forces DB to add user & assign valid id
      id = target.getId(); // retrieve assigned id from DB
    }

    // retrieve requested user
    target = entityManager.find(User.class, id);
    model.addAttribute("user", target);

    if (requester.getId() != target.getId() &&
        !requester.hasRole(Role.ADMIN)) {
      throw new NoEsTuPerfilException();
    }

    if (edited.getPassword() != null) {
      if (!edited.getPassword().equals(pass2)) {
        log.warn("Passwords do not match - returning to user form");
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        model.addAttribute("user", target);
        return "user";
      } else {
        // save encoded version of password
        target.setPassword(encodePassword(edited.getPassword()));
      }
    }
    target.setUsername(edited.getUsername());
    target.setFirstName(edited.getFirstName());
    target.setLastName(edited.getLastName());

    // update user session so that changes are persisted in the session, too
    if (requester.getId() == target.getId()) {
      session.setAttribute("u", target);
    }

    return "user";
  }

  /**
   * Returns the default profile pic
   * 
   * @return
   */
  private static InputStream defaultPic() {
    return new BufferedInputStream(Objects.requireNonNull(
        UserController.class.getClassLoader().getResourceAsStream(
            "static/img/default-pic.jpg")));
  }

  /**
   * Downloads a profile pic for a user id
   * 
   * @param id
   * @return
   * @throws IOException
   */
  @GetMapping("{id}/pic")
  public StreamingResponseBody getPic(@PathVariable long id) throws IOException {
    File f = localData.getFile("user", "" + id + ".jpg");
    InputStream in = new BufferedInputStream(f.exists() ? new FileInputStream(f) : UserController.defaultPic());
    return os -> FileCopyUtils.copy(in, os);
  }

  /**
   * Uploads a profile pic for a user id
   * 
   * @param id
   * @return
   * @throws IOException
   */
  @PostMapping("{id}/pic")
  @ResponseBody
  public String setPic(@RequestParam("photo") MultipartFile photo, @PathVariable long id,
      HttpServletResponse response, HttpSession session, Model model) throws IOException {

    User target = entityManager.find(User.class, id);
    model.addAttribute("user", target);

    // check permissions
    User requester = (User) session.getAttribute("u");
    if (requester.getId() != target.getId() &&
        !requester.hasRole(Role.ADMIN)) {
      throw new NoEsTuPerfilException();
    }

    log.info("Updating photo for user {}", id);
    File f = localData.getFile("user", "" + id + ".jpg");
    if (photo.isEmpty()) {
      log.info("failed to upload photo: emtpy file?");
    } else {
      try (BufferedOutputStream stream = new BufferedOutputStream(new FileOutputStream(f))) {
        byte[] bytes = photo.getBytes();
        stream.write(bytes);
        log.info("Uploaded photo for {} into {}!", id, f.getAbsolutePath());
      } catch (Exception e) {
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        log.warn("Error uploading " + id + " ", e);
      }
    }
    return "{\"status\":\"photo uploaded correctly\"}";
  }

  @GetMapping("error")
  public String error(Model model, HttpSession session, HttpServletRequest request) {
    model.addAttribute("sess", session);
    model.addAttribute("req", request);
    return "error";
  }

  /**
   * Posts a message to a user.
   * 
   * @param id of target user (source user is from ID)
   * @param o  JSON-ized message, similar to {"message": "text goes here"}
   * @throws JsonProcessingException
   */
  @PostMapping("/{id}/msg")
  @ResponseBody
  @Transactional
  public String postMsg(@PathVariable long id,
      @RequestBody JsonNode o, Model model, HttpSession session)
      throws JsonProcessingException {

    String text = o.get("message").asText();
    User u = entityManager.find(User.class, id);
    User sender = entityManager.find(
        User.class, ((User) session.getAttribute("u")).getId());
    model.addAttribute("user", u);

    // construye mensaje, lo guarda en BD
    Message m = new Message();
    m.setSender(sender);
    m.setDateSent(LocalDateTime.now());
    m.setText(text);
    entityManager.persist(m);
    entityManager.flush(); // to get Id before commit

    ObjectMapper mapper = new ObjectMapper();
    /*
     * // construye json: método manual
     * ObjectNode rootNode = mapper.createObjectNode();
     * rootNode.put("from", sender.getUsername());
     * rootNode.put("text", text);
     * rootNode.put("id", m.getId());
     * String json = mapper.writeValueAsString(rootNode);
     */
    // persiste objeto a json usando Jackson
    String json = mapper.writeValueAsString(m.toTransfer());

    log.info("Sending a message to {} with contents '{}'", id, json);

    messagingTemplate.convertAndSend("/user/" + u.getUsername() + "/queue/updates", json);
    return "{\"result\": \"message sent.\"}";
  }

  /**
   * Para actualizar el perfil que se muestra
   */
  @PostMapping("{id}/perfil")
  @ResponseBody
  @Transactional
  public String postPerfil(@PathVariable long id,
      @RequestBody JsonNode o, Model model, HttpSession session)
      throws JsonProcessingException {

    String username = o.get("username").asText();
    String title = o.get("title").asText();
    String description = o.get("description").asText();

    User u = entityManager.find(User.class, id);

    // Comprobamos si hay un usario con ese username, si lo hay mal
    Long duplicate = entityManager.createNamedQuery("User.hasUsername", Long.class)
        .setParameter("username", username)
        .getSingleResult();
    if (duplicate > 0 && !username.equals(u.getUsername()))
      return "{\"warning\": \"Nombre de Usuario duplicado\"}";

    u.setUsername(username);
    u.setTitulo(title);
    u.setDescripcion(description);
    entityManager.merge(u);

    // TODO creo que no esta bien solko meterlo a capon, funciona pero no se. No se
    // diferencia entre u y user
    session.setAttribute("user", u);
    session.setAttribute("u", u);

    log.info("Actualizado la información del perfil.");

    return "{\"result\": \"Perfil actualizado correctamente.\"}";
  }

  /**
   * Para actualizar los datos personales y la contraseña del usuario
   */
  @PostMapping("{id}/personal")
  @ResponseBody
  @Transactional
  public String postMethodName(@PathVariable Long id,
      @RequestBody JsonNode o, Model model, HttpSession session)
      throws JsonProcessingException {

    String nombre = o.get("nombre").asText();
    String apellido = o.get("apellido").asText();
    String contra = o.get("contra").asText();
    String repetir = o.get("repetir").asText();

    User u = entityManager.find(User.class, id);

    // Comprobamos si quiere cambiar la contrseña
    if (!contra.equals("")) {
      if (!contra.equals(repetir))
        return "{\"warning\": \"Las contraseñas no son iguales.\"}";
      contra = encodePassword(contra);
      repetir = contra;
      u.setPassword(contra);
    }

    u.setFirstName(nombre);
    u.setLastName(apellido);

    entityManager.merge(u);

    return "{\"result\": \"Información personal actualizada correctamente.\"}";
  }

  /*
   * Para actualizar las fichas
   */
  @PostMapping("{id}/fichas")
  @ResponseBody
  @Transactional
  public String updateFichas(@PathVariable Long id,
      @RequestBody JsonNode o, Model model, HttpSession session)
      throws JsonProcessingException {

    int cant = o.get("cant").asInt();
    log.info("La cantidada que se va asumar es: " + cant);

    User u = entityManager.find(User.class, id);

    int fichas = u.getFichas() + cant;
    if (fichas < 0)
      return "{\"error\": \"No tienes suficientes fichas.\"}";
    u.setFichas(fichas);
    entityManager.merge(u);

    session.setAttribute("u", u);

    log.info("Actualizado cantidad a: " + u.getFichas());

    return "{\"result\": \"" + fichas + "\", \"message\":\"Fichas actualizadas correctamente.\"}";
  }

  /*
   * Para crear un usario al registrarse
   */
  @PostMapping("/signup")
  @ResponseBody
  @Transactional
  public String userSignup(@RequestBody JsonNode o, Model model) {

    String username = o.get("username").asText();
    String password = o.get("password").asText();
    String repetir = o.get("repetir").asText();

    String firstName = o.get("firstName").asText();
    String lastName = o.get("lastName").asText();

    log.info("Username: " + username);
    log.info("FirstName: " + firstName);
    log.info("LastName: " + lastName);

    if (repetir.equalsIgnoreCase(password) && !repetir.equals("")) {
      password = encodePassword(password);
      repetir = password;
    } else if (password.isBlank())
      return "{\"error\": \"Debe poner una contraseña.\"}";
    else
      return "{\"error\": \"Las contraseñas tienen que ser iguales.\"}";

    Long dup = entityManager.createNamedQuery("User.hasUsername", Long.class)
        .setParameter("username", username)
        .getSingleResult();

    log.info("Duplicated: ", (dup > 0) ? true : false);

    if (dup > 0 || username.isBlank())
      return "{\"error\": \"Ya existe un usuario con ese nombre.\"}";

    User user = new User();
    user.setUsername(username);
    user.setPassword(password);

    user.setFirstName(firstName);
    user.setLastName(lastName);
    user.setTitulo("");
    user.setDescripcion("");

    user.setFichas(0);
    user.setCervezas_actuales(0);
    user.setCervezas_totales(0);

    user.setRoles("USER");
    user.setEnabled(true);

    entityManager.persist(user);

    return "{\"result\": \"Usuario creado correctamente. Inicie sesión.\"}";
  }
}