package es.ucm.fdi.iw.service;

import java.util.Map;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@Service
public class DrinkService {

    private static final Logger log = LogManager.getLogger(DrinkService.class);
    private static final String RANDOM_DRINK_URL = "https://www.thecocktaildb.com/api/json/v1/1/random.php";

    @Autowired
    private RestTemplate restTemplate;

    @Data
    @NoArgsConstructor
    public static class Drink {
        private String strDrink;
        private String strDrinkThumb;
        private String idDrink;
    }

    @Data
    @NoArgsConstructor
    public static class DrinkResponse {
        private List<Drink> drinks;
    }

    public Drink getRandomDrink() {
        try {
            DrinkResponse response = restTemplate.getForObject(RANDOM_DRINK_URL, DrinkResponse.class);
            if (response != null && response.getDrinks() != null && !response.getDrinks().isEmpty()) {
                return response.getDrinks().get(0);
            }
        } catch (Exception e) {
            log.error("Error fetching random drink from API", e);
        }
        return null; // Fallback
    }
}
