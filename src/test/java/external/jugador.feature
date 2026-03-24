# Primero se llama salas.feature

Feature: funcionalidad de jugador básica

    Scenario: apostar, pedir una sola carta y plantarse
    Given call read('salas.feature@crear_sala')
    # first-child pilla el primero de la lista de las salas dinámicas -> su elemento 'a'
    Then click("#salas-cards > div:first-child a") 
    And delay(3000)
    Then click("#btnApostar")
    And delay(1000)
    Then click("#btnApuesta5")
    And delay(1000)
    Then click("#btnConfirmApuesta")
    And delay(1000)
    Then click("#btnNueva")
    And delay(1000)
    Then click("#btnPedir")
    And delay(1000)
    Then click("#btnPlantarse")
    And delay(1000)
    # En esta primera ronda de arriba el jugador ha ganado
    # En esta segunda no va a ganar, jeje
    Then click("#btnNueva")
    And delay(1000)
    Then click("#btnApostar")
    And delay(1000)
    Then click("#btnApuesta25")
    And delay(1000)
    Then click("#btnConfirmApuesta")
    And delay(1000)
    Then click("#btnNueva")
    And delay(1000)

    # No para hasta que sobrepasa el 7.5
    * script("while(parseFloat(document.querySelector('#score-1').innerText) <= 7.5) { document.querySelector('#btnPedir').click(); }")


    And delay(3000)


    
