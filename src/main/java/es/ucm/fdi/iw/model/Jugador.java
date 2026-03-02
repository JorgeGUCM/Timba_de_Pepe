package es.ucm.fdi.iw.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.SequenceGenerator;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@NamedQueries ({
    
})
public class Jugador {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gen")
    @SequenceGenerator(name = "gen", sequenceName = "gen")
    private long id;

    // Relación Foreign Key hacia la tabla de Usuarios
    @ManyToOne
    @JoinColumn(name="id_usuario")
    private User user;

    private int apuesta;
    private int ganancias;

    // Guardaremos el JSON como texto plano en la BBDD. 
    // Luego en Java lo leeremos/escribiremos usando librerías como Jackson.
    @Column(columnDefinition = "TEXT")
    private String cartas; 
}