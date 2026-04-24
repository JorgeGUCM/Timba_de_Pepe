package es.ucm.fdi.iw.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import es.ucm.fdi.iw.model.User;
import jakarta.persistence.EntityManager;

@Service
public class RankingService { // Clase creada para separar la logica del ranking de la logica del controlador,
                              // no se donde meterlo ,en teoria funciona para no repetir codigo

    @Autowired
    private EntityManager entityManager;

    /**
     * Obtiene los mejores jugadores y los formatea para ser enviados por WebSocket.
     * 
     * @return Lista de mapas con los datos de los mejores jugadores.
     */
    public List<Map<String, Object>> getRankingActualizado() { // Esto obtiene los mejores jugadores ordenados por
                                                               // cervezas totales
        List<User> topUsuarios = entityManager.createQuery(
                "SELECT u FROM User u ORDER BY u.cervezas_totales DESC", User.class)
                .setMaxResults(10)
                .getResultList();

        List<Map<String, Object>> rankingParaMandar = new ArrayList<>();
        for (User u : topUsuarios) {
            rankingParaMandar.add(Map.of(
                    "id", u.getId(),
                    "username", u.getUsername(),
                    "rango", (u.getCervezas_totales() > 500) ? "Maestro" : "Aprendiz",
                    "cervezas", u.getCervezas_totales()));
        }
        return rankingParaMandar;
    }
}
