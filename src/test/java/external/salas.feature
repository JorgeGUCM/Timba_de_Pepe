Feature: Crear sala para jugar
# Inicia sesion como usuario o admin e irse a las salas de juego
# crear una sala de juego poniendo el nombre y todo. Y entrar en la sala de juego

Scenario: crear sala como usuario
    # inciamos sesion correctamente como usario
    # coge google y una url y lo inicia
    Given driver baseUrl + '/login'
    And input('#username', 'b')
    And input('#password', 'aa')
    When submit().click(".form-signin button")
    # se espera a que carge la pagina del usuario
    Then waitForUrl(baseUrl + '/user/2')
    Then click("#salas")
    Then click("#crear-sala")
    And value("#nombre-sala", 'Pepe') 
    And input("#dificultad", 'Intermedio')
    And value("#min-bet",'15')
    And delay(3000)
    And click("#submit-sala")
    Then delay(5000)