-- 1. Insertamos usuarios (añadiendo los nuevos campos: fichas y cervezas)
-- Usuario 'a' (Admin) - Contraseña: aa
INSERT INTO IWUser (id, username, password, first_name, last_name, titulo,  descripcion, roles, fichas, cervezas_actuales, cervezas_totales, enabled)
VALUES (1, 'a', '{bcrypt}$2a$10$2BpNTbrsarbHjNsUWgzfNubJqBRf.0Vz9924nRSHBqlbPKerkgX.W',
        'Pepe', 'Gonzalez', 'Dios cervecero', NULL, 'ADMIN,USER', 300, 100, 10000, TRUE);



-- Usuario 'b' (User normal) - Contraseña: aa
INSERT INTO IWUser (id, username, password, first_name, last_name, titulo,  descripcion, roles, fichas, cervezas_actuales, cervezas_totales, enabled)
VALUES (2, 'b', '{bcrypt}$2a$10$2BpNTbrsarbHjNsUWgzfNubJqBRf.0Vz9924nRSHBqlbPKerkgX.W', 
    'Juan', 'Lorenzo', 'Aprendiz de barra', 'Aprendiendo del maestro Pepe', 'USER', 500, 2, 5, TRUE);


INSERT INTO IWUser (id, username, password, first_name, last_name, titulo,  descripcion, roles, fichas, cervezas_actuales, cervezas_totales, enabled)
VALUES (3, 'pablo', '{bcrypt}$2a$10$2BpNTbrsarbHjNsUWgzfNubJqBRf.0Vz9924nRSHBqlbPKerkgX.W',
        'CC', 'Gonzalez', 'Dios ', NULL, 'USER', 300, 100, 10100, TRUE);


-- 2. Insertamos Jugadores de prueba (Asociamos el jugador 1 al usuario 1 y el jugador 2 al usuario 2)


-- 3. Insertamos un Tablero (Con los dos jugadores que acabamos de crear)


-- 4. Insertamos una Sala (Asociada al tablero que acabamos de crear)


-- 5. Actualizamos la secuencia para que Hibernate sepa por qué ID continuar cuando creemos nuevos datos desde Java
ALTER SEQUENCE "PUBLIC"."GEN" RESTART WITH 1024;