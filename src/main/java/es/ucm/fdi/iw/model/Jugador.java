package es.ucm.fdi.iw.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Entity
@Data
@NoArgsConstructor
@NamedQueries({
// Por si en el futuro necesitas buscar, por ejemplo, todos los jugadores de una
// partida
// @NamedQuery(name="Jugador.byJuego", query="SELECT j FROM Jugador j WHERE
// j.juego.id = :juegoId")
})
public class Jugador implements Transferable<Jugador.Transfer> {

    // Siguiendo vuestro estilo de nomenclatura de enums en minúscula como en Juego
    // (state, dificulty)
    public enum estadoJugador {
        ESPERANDO, ACTIVO, LISTO, PLANTADO, SOBREPUNTOS
    }

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gen")
    @SequenceGenerator(name = "gen", sequenceName = "gen")
    private long id;

    /*
     * ---------------
     * Atributos
     * ---------------
     */
    private int apuesta;
    private int ganancias;

    // Guardaremos el JSON como texto plano en la BBDD.
    @Column(columnDefinition = "TEXT")
    private String cartas;
    private int numCartas;

    // --- Atributos dinámicos que leerá juego.js ---
    private double puntuacion;

    @Enumerated(EnumType.STRING)
    private estadoJugador estado;

    private int posicionMesa; // Sabremos si es slot-1, slot-2, slot-3 o slot-4

    /*
     * ---------------
     * Relaciones
     * ---------------
     */
    @ManyToOne
    @JoinColumn(name = "id_usuario")
    private User user;

    // Este atributo "juego" enlaza con el mappedBy="juego" de tu clase Juego
    @ManyToOne
    @JoinColumn(name = "id_juego")
    private Juego juego;

    /*
     * ---------------
     * DTO
     * ---------------
     */
    @Getter
    @AllArgsConstructor
    public static class Transfer {
        private long id;
        private String username;
        private int apuesta;
        private double puntuacion;
        private String estado;
        private int posicionMesa;
        private String cartas;
        private int numCartas;
    }

    @Override
    public Transfer toTransfer() {
        return new Transfer(
                id,
                user != null ? user.getUsername() : "Desconocido",
                apuesta,
                puntuacion,
                estado != null ? estado.name() : null,
                posicionMesa,
                cartas,
                numCartas);
    }
}