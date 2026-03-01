package es.ucm.fdi.iw.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;

@Entity
@Data
@NoArgsConstructor
public class Sala {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gen")
    @SequenceGenerator(name = "gen", sequenceName = "gen")
    private long id;

    // Una sala tiene un tablero asociado
    @OneToOne
    @JoinColumn(name = "id_tablero")
    private Tablero tablero;

    private String nombre;
    private int cantidad;
    private String dificultad;
    private String estado;
}