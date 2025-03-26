# Archivos para pruebas con REST Client

Estos archivos permiten probar la API de Optimización de Rutas usando la extensión REST Client para Visual Studio Code.

## Requisitos

1. Instalar la extensión **REST Client** en VS Code
   - ID: humao.rest-client
   - [Enlace en Marketplace](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

2. El servidor debe estar en ejecución para realizar las pruebas

## Archivos disponibles

- **auth.http**: Autenticación de usuarios
- **rutas.http**: Endpoints para optimización y replanificación de rutas
- **eventos.http**: Endpoints para gestión de eventos inesperados
- **apis-externas.http**: Ejemplos simulados de las APIs externas (no son endpoints reales)

## ¿Cómo usar?

1. Abrir cualquiera de los archivos .http
2. Ejecutar primero la autenticación en **auth.http** para obtener un token
3. Copiar el token JWT generado
4. Pegar el token en la variable `@authToken` de los demás archivos
5. Hacer clic en "Send Request" sobre cualquiera de las peticiones

## Notas

- Cada archivo agrupa endpoints relacionados para facilitar las pruebas
- Las peticiones incluyen ejemplos de datos para probar cada funcionalidad
- Los endpoints simulados de APIs externas en **apis-externas.http** están comentados ya que no son endpoints reales, solo están para documentación 