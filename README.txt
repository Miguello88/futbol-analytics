FÚTBOL ANALYTICS — PWA INICIAL

QUÉ ES
Prototipo web instalable para móvil Android. Incluye listado de partidos, filtros de competición y una primera versión de análisis de córners/tarjetas con API-Football.

IMPORTANTE
- No está compilada ni probada con una clave API real.
- El plan gratuito de API-Football se anuncia con 100 consultas al día; las consultas de análisis consumen cuota.
- La cobertura de estadísticas varía por liga y partido.
- La consulta de datos se hace directamente desde el navegador. No publiques esta web con una clave personal guardada y no compartas la clave.
- Para instalar como PWA, debe servirse desde HTTPS (por ejemplo, GitHub Pages). Abrir index.html directamente no habilita el service worker.
- Este prototipo no incluye todavía proxy seguro de API. La clave se guarda en localStorage del navegador de ese dispositivo.
- El histórico usa temporada indicada por el partido; una versión posterior debería manejar cambio de temporada y caché de forma más robusta.

CÓMO EMPEZAR DESDE ANDROID
1. Descarga y descomprime el ZIP en tu móvil.
2. Crea una cuenta gratuita en https://www.api-football.com/ y copia la API key desde tu panel.
3. Para publicarla como PWA en HTTPS, puedes crear un repositorio privado/público en GitHub desde el navegador y subir los archivos. GitHub Pages suele publicar desde repositorios; revisa las opciones de visibilidad y condiciones actuales.
4. Abre la URL publicada en Chrome Android, menú ⋮ > Añadir a pantalla de inicio / Instalar aplicación.
5. Abre Fútbol Analytics, pulsa el engranaje, pega la clave y guarda. Pulsa Cargar.

NOTA DE SEGURIDAD
Si el repositorio o la URL son públicos, cualquier visitante podría cargar su propia clave, pero la clave que tú introduces se guarda en el almacenamiento del navegador. Aun así, no es un almacenamiento cifrado y no debe tratarse como un gestor de secretos. Para una versión más segura, el siguiente paso es añadir un proxy/backend gratuito que mantenga la clave en variables de entorno.
