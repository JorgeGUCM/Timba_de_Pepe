package es.ucm.fdi.iw.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class DrinkServiceTest {

    @Autowired
    private DrinkService drinkService;

    @Test
    public void testGetRandomDrink() {
        DrinkService.Drink drink = drinkService.getRandomDrink();
        // Nota: Esto requiere conexión a internet
        assertNotNull(drink, "El servicio debería devolver un cóctel (o al menos no fallar)");
        if (drink != null) {
            System.out.println("Cóctel obtenido: " + drink.getStrDrink());
            assertNotNull(drink.getStrDrink(), "El nombre del cóctel no debe ser nulo");
            assertNotNull(drink.getStrDrinkThumb(), "La imagen del cóctel no debe ser nula");
        }
    }
}
