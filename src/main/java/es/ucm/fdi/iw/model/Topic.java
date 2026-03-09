package es.ucm.fdi.iw.model;

import java.util.ArrayList;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.SequenceGenerator;
import lombok.Data;

/**
 * A group of users, with an associated chat.
 * Es un chat
 */
@Data
@Entity
@NamedQueries({
    @NamedQuery(name = "Topic.byKey", query = "SELECT t FROM Topic t "
        + "WHERE t.key = :key")
})
public class Topic {

  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gen")
  @SequenceGenerator(name = "gen", sequenceName = "gen")
  private long id;

  /*
  * ---------------
  *    Atributos
  * ---------------
  */
  private String name;
  @Column(nullable = false, unique = true, name = "topic_key") // key is reserved
  private String key;

  /*
  !   Relaciones
  */
  @OneToOne(mappedBy="chat")
  @JoinColumn(name="id_juego")
  private Juego juego;

  @ManyToMany
  private List<User> members = new ArrayList<>();

  @OneToMany
  @JoinColumn(name = "topic_id")
  private List<Message> messages = new ArrayList<>();

  //# Otros metodos
  @Override
  public String toString() {
    return name + " (" + key + ")";
  }
}
