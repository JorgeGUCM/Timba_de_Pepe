package es.ucm.fdi.iw.model;

import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.SequenceGenerator;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@NamedQueries({

})
public class Juego {

    public enum state {
        ESPERANDO, COMPLETO, JUGANDO, FINALIZADO
    }

    public enum dificulty {
        FACIL, MEDIO, DIFICIL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gen")
    @SequenceGenerator(name = "gen", sequenceName = "gen")
    private long id;

    /*
   * ---------------
   *    Atributos
   * ---------------
   */
    // Guardaremos el JSON como texto plano en la BBDD.
    // Luego en Java lo leeremos/escribiremos usando librerías como Jackson.
    @Column(columnDefinition = "TEXT")
    private String baraja;

    private int min_bet;
    @Column(nullable = false)
    private String nombre;
    private state estado;
    private dificulty dificultad;
    private int num_jugadores;

    /*
    !   Relaciones
    */
    @OneToMany(mappedBy="juego")
    private List<Jugador> jugadores;

    @OneToOne
    @JoinColumn(name="topic_id")
    private Topic chat;
}
