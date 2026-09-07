# Glosario

Términos que verás en el código y en esta documentación.

## Del proyecto

**Adaptador** — La implementación concreta de una interfaz.
`FirestoreClassRepository` es el adaptador de `ClassRepository`.

**Consulta pública** — La pantalla en `/`, sin sesión.

**Cursor** — Marcador que dice a Firestore desde dónde seguir paginando. Opaco:
se guarda y se devuelve sin mirarlo por dentro.

**Doble (test double)** — Implementación alternativa que se usa en pruebas.
`InMemoryClassRepository` es un doble.

**Facets** — Las opciones de los desplegables de filtro: profesores y códigos
que existen.

**Keywords** — El arreglo de prefijos que hace posible buscar en Firestore.

**Puerto (port)** — La interfaz. `ClassRepository` es un puerto; el de Firestore
es su adaptador.

**Result** — El tipo que representa «esto salió bien» o «esto falló», como valor
en vez de excepción.

## De React

**Boundary** — Componente que atrapa errores de render de sus hijos.

**Chunk** — Trozo del bundle que se descarga aparte. Cada página es uno.

**Contexto** — Forma de pasar valores por el árbol sin encadenar props.

**Debounce** — Esperar a que algo deje de cambiar antes de reaccionar. La
búsqueda espera 300 ms.

**Hook** — Función `use*` que engancha estado o efectos.

**Lazy / carga diferida** — Cargar un componente solo cuando hace falta.

**Suspense** — Muestra un contenido temporal mientras algo carga.

## De Firebase

**Firestore** — La base de datos NoSQL. Guarda documentos en colecciones.

**Índice compuesto** — Índice sobre varios campos. Firestore **rechaza** las
consultas que necesitan uno y no lo tienen.

**Reglas de seguridad** — El código en `firestore.rules` que el servidor evalúa
en cada lectura y escritura. **El límite de seguridad real.**

**`Timestamp`** — El tipo de fecha de Firestore. No sale del mapper.

**Cuenta de servicio** — Identidad para máquinas. La usa el deploy.

## De la arquitectura

**SOLID** — Cinco principios; ver [`CLAUDE.md`](../CLAUDE.md) §5.

**Inversión de dependencias** — Que el código de alto nivel dependa de
interfaces y no de implementaciones. La idea que sostiene todo el proyecto.

**KISS** — *Keep It Simple.* Resolver el problema que tienes delante.
