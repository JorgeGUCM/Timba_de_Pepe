-- 1. Insertamos usuarios (añadiendo los nuevos campos: fichas y cervezas)
-- Usuario 'a' (Admin) - Contraseña: aa
INSERT INTO IWUser (id, username, password, first_name, last_name, titulo,  descripcion, roles, fichas, cervezas_actuales, cervezas_totales, enabled)
VALUES (1, 'a', '{bcrypt}$2a$10$2BpNTbrsarbHjNsUWgzfNubJqBRf.0Vz9924nRSHBqlbPKerkgX.W',
        'Pepe', 'Gonzalez', 'Dios cervecero', NULL, 'ADMIN,USER', 300, 100, 10000, TRUE);

-- Usuario 'b' (User normal) - Contraseña: aa
INSERT INTO IWUser (id, username, password, first_name, last_name, titulo,  descripcion, roles, fichas, cervezas_actuales, cervezas_totales, enabled)
VALUES (2, 'b', '{bcrypt}$2a$10$2BpNTbrsarbHjNsUWgzfNubJqBRf.0Vz9924nRSHBqlbPKerkgX.W', 
    'Juan', 'Lorenzo', 'Aprendiz de barra', 'Aprendiendo del maestro Pepe', 'USER', 500, 2, 5, TRUE);

-- 2. Insertamos Jugadores de prueba (Asociamos el jugador 1 al usuario 1 y el jugador 2 al usuario 2)
--INSERT INTO Jugador (id, id_usuario, apuesta, ganancias, cartas) 
--VALUES (1, 1, 50, 0, '{"cartas": []}');

--INSERT INTO Jugador (id, id_usuario, apuesta, ganancias, cartas) 
--VALUES (2, 2, 50, 0, '{"cartas": []}');

-- 3. Insertamos un Tablero (Con los dos jugadores que acabamos de crear)
--INSERT INTO Tablero (id, jugador_1, jugador_2, crupier, baraja, min_bet) 
--VALUES (1, 1, 2, '{"cartas": []}', '{"cartas": []}', 10);

-- 4. Insertamos una Sala (Asociada al tablero que acabamos de crear)
--INSERT INTO Sala (id, id_tablero, nombre, cantidad, dificultad, estado) 
--VALUES (1, 1, 'Timba de Pepe Principal', 2, 'Normal', 'Esperando');

-- 5. Actualizamos la secuencia para que Hibernate sepa por qué ID continuar cuando creemos nuevos datos desde Java
ALTER SEQUENCE "PUBLIC"."GEN" RESTART WITH 1024;