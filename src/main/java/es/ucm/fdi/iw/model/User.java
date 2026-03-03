package es.ucm.fdi.iw.model;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * An authorized user of the system.
 */

@Entity
@Data
@NoArgsConstructor
@NamedQueries({
    @NamedQuery(name = "User.byUsername", query = "SELECT u FROM User u "
        + "WHERE u.username = :username AND u.enabled = TRUE"),
    @NamedQuery(name = "User.hasUsername", query = "SELECT COUNT(u) "
        + "FROM User u "
        + "WHERE u.username = :username"),
    @NamedQuery(name = "User.topics", query = "SELECT t.key "
        + "FROM Topic t JOIN t.members u "
        + "WHERE u.id = :id")
})
@Table(name = "IWUser")
public class User implements Transferable<User.Transfer> {

  public enum Role {
    USER, // normal users
    ADMIN, // admin users
  }

  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gen")
  @SequenceGenerator(name = "gen", sequenceName = "gen")
  private long id;

  /*
   * ----------------
   * Atributos
   * ----------------
   */
  @Column(nullable = false, unique = true)
  private String username;
  @Column(nullable = false)
  private String password;

  @Column(nullable = false)
  private String firstName;
  private String lastName;
  @Column(nullable = false)
  private String titulo;
  private String descripcion;

  private String roles; // split by ',' to separate roles

  private int fichas;
  private int cervezas_actuales;
  private int cervezas_totales;

  private boolean enabled;

  // Relaciones
  @OneToMany(mappedBy = "user")
  private List<Jugador> jugador;

  @OneToMany
  @JoinColumn(name = "sender_id")
  private List<Message> sent = new ArrayList<>();
  @OneToMany
  @JoinColumn(name = "recipient_id")
  private List<Message> received = new ArrayList<>();
  @ManyToMany(mappedBy = "members")
  private List<Topic> groups = new ArrayList<>();

  /**
   * Checks whether this user has a given role.
   * 
   * @param role to check
   * @return true iff this user has that role.
   */
  public boolean hasRole(Role role) {
    String roleName = role.name();
    return Arrays.asList(roles.split(",")).contains(roleName);
  }

  @Getter
  @AllArgsConstructor
  public static class Transfer {
    private long id;
    private String username;
    private int totalReceived;
    private int totalSent;
    private String groups;
  }

  @Override
  public Transfer toTransfer() {
    StringBuilder gs = new StringBuilder();
    for (Topic g : groups) {
      gs.append(g.getName()).append(", ");
    }
    return new Transfer(id, username, received.size(), sent.size(), gs.toString());
  }

  @Override
  public String toString() {
    return toTransfer().toString();
  }
}
