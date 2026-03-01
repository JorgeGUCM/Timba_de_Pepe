package es.ucm.fdi.iw.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;

@Entity
@Data
@NoArgsConstructor
public class Jugador {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gen")
    @SequenceGenerator(name = "gen", sequenceName = "gen")
    private long id;

    // Relación Foreign Key hacia la tabla de Usuarios
    @ManyToOne
    @JoinColumn(name = "id_usuario")
    private User usuario;

    private int apuesta;
    private int ganancias;

    // Guardaremos el JSON como texto plano en la BBDD. 
    // Luego en Java lo leeremos/escribiremos usando librerías como Jackson.
    @Column(columnDefinition = "TEXT")
    private String cartas; 
}