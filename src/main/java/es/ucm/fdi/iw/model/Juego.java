package es.ucm.fdi.iw.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.NamedQueries;
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

    @Column(columnDefinition = "TEXT")
    private String baraja;
    private int min_bet;
    @Column(nullable = true)
    private String nombre;
    private state estado;
    private dificulty dificultad;
    private int num_jugadores;

}
