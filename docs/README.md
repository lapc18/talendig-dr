# Documentación de Talendig Classes Record

Esta carpeta explica **cómo funciona el proyecto y por qué está hecho así**.
Está escrita para alguien que se acaba de sumar al equipo y nunca ha tocado
este código. No asume que sepas Firebase.

El [`README.md`](../README.md) de la raíz es la ficha del proyecto: qué es, cómo
se levanta, cómo se despliega. Esta carpeta es la explicación larga.

## Por dónde empezar

Léelos en este orden. Cada uno se apoya en el anterior.

| # | Documento | Qué responde |
|---|---|---|
| 1 | [Guía de inicio](./01-guia-de-inicio.md) | Cómo levanto esto en mi máquina y qué acabo de levantar |
| 2 | [Arquitectura](./02-arquitectura.md) | Por qué las carpetas están así y dónde va cada cosa |
| 3 | [Modelo de datos](./03-modelo-de-datos.md) | Cómo se guardan y se buscan las clases |
| 4 | [Autenticación](./04-autenticacion.md) | Cómo entra un profesor y qué protege qué |
| 5 | [Interfaz](./05-interfaz.md) | Los tokens de diseño y las piezas de UI |
| 6 | [Errores](./06-errores.md) | Cómo se maneja todo lo que puede salir mal |
| 7 | [Pruebas](./07-pruebas.md) | Cómo se prueba y cómo escribo una prueba nueva |
| 8 | [Despliegue](./08-despliegue.md) | Cómo llega el código a producción |
| 9 | [Recetas](./09-recetas.md) | «Quiero agregar X, ¿qué toco?» |
| — | [Glosario](./glosario.md) | Qué significa cada término que verás |

## Las reglas

[`CLAUDE.md`](../CLAUDE.md) en la raíz son las reglas de trabajo del
repositorio: lenguaje, patrones, SOLID, manejo de errores, pruebas y la
definición de «hecho». **No son sugerencias.** Si tu cambio las rompe, no está
terminado.

Esta documentación explica el *cómo* y el *por qué*; `CLAUDE.md` dice el *qué
tienes que cumplir*.

## El diseño

- [`design/talendig-classes-record.dc.html`](./design/talendig-classes-record.dc.html)
  — el canvas original con los 10 artboards. Ábrelo en el navegador.
- [`design-prompt.md`](./design-prompt.md) — el prompt que lo generó.

Si vas a tocar la interfaz, abre el canvas primero.

## En una frase

Una app de React que lista clases guardadas en Firestore. Cualquiera puede
buscarlas; solo un profesor con sesión puede crearlas, editarlas o borrarlas.
