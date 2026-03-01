package es.ucm.fdi.iw.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;

@Entity
@Data
@NoArgsConstructor
public class Tablero {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gen")
    @SequenceGenerator(name = "gen", sequenceName = "gen")
    private long id;

    // Foreign keys a los jugadores, como tienes en tu diseño (4 posiciones)
    @ManyToOne
    @JoinColumn(name = "jugador_1")
    private Jugador jugador1;

    @ManyToOne
    @JoinColumn(name = "jugador_2")
    private Jugador jugador2;

    @ManyToOne
    @JoinColumn(name = "jugador_3")
    private Jugador jugador3;

    @ManyToOne
    @JoinColumn(name = "jugador_4")
    private Jugador jugador4;

    // Los JSON se guardan en BD como TEXT, en Java son String
    @Column(columnDefinition = "TEXT")
    private String crupier; 

    @Column(columnDefinition = "TEXT")
    private String baraja; 

    @Column(name = "min_bet")
    private int minBet;
}