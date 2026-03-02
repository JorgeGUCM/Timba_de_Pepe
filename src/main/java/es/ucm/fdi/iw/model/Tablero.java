package es.ucm.fdi.iw.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.SequenceGenerator;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class Tablero {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gen")
    @SequenceGenerator(name = "gen", sequenceName = "gen")
    private long id;

    // Foreign keys a los jugadores, como tienes en tu diseño (4 posiciones)
    @OneToOne
    private Jugador jugador_1;

    @OneToOne
    private Jugador jugador_2;

    @OneToOne
    private Jugador jugador_3;

    @OneToOne
    private Jugador jugador_4;

    @OneToOne(mappedBy="tablero")
    private Sala sala;

    // Los JSON se guardan en BD como TEXT, en Java son String
    @Column(columnDefinition = "TEXT")
    private String crupier; 

    @Column(columnDefinition = "TEXT")
    private String baraja; 

    @Column(name = "min_bet")
    private int minBet;
}