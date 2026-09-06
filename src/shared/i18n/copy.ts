/**
 * Every Spanish string the interface renders.
 *
 * Centralising copy keeps Spanish out of identifiers, makes wording reviewable
 * in one place, and leaves a single seam if a second locale is ever added.
 * Text is transcribed from the design canvas artboards.
 */

export const COPY = {
  brand: {
    productName: "Classes Record",
    publicSubtitle: "Administración de clases",
  },

  actions: {
    search: "Buscar",
    clearFilters: "Limpiar filtros",
    clear: "Limpiar",
    applyFilters: "Aplicar filtros",
    filters: "Filtros",
    teacherAccess: "Acceso docente",
    signIn: "Iniciar sesión",
    signOut: "Cerrar sesión",
    backToPublic: "Volver a la consulta pública",
    newClass: "+ Nueva clase",
    edit: "Editar",
    delete: "Eliminar",
    deleteClass: "Eliminar clase",
    cancel: "Cancelar",
    save: "Guardar clase",
    saveChanges: "Guardar cambios",
    saving: "Guardando",
    deleting: "Eliminando",
    retry: "Reintentar",
    contactSupport: "Contactar soporte",
    viewRecording: "Ver grabación",
    copyLink: "Copiar enlace",
    linkCopied: "Enlace copiado",
    testLink: "Probar",
    previous: "Anterior",
    next: "Siguiente",
    show: "Mostrar",
    hide: "Ocultar",
    close: "Cerrar",
  },

  publicSearch: {
    title: "Histórico de clases",
    subtitle:
      "Busca por nombre de clase, código o profesor y accede a la grabación.",
    searchPlaceholder: "Clase, código o profesor",
    dateRange: "Rango de fechas",
    teacher: "Profesor",
    classCode: "Código de clase",
    allTeachers: "Todos los profesores",
    allCodes: "Todos los códigos",
    activeFilters: "Filtros activos:",
    sortBy: "Ordenar por:",
    sortNewest: "Fecha (más reciente)",
    sortOldest: "Fecha (más antigua)",
    loading: "Cargando clases…",
  },

  table: {
    date: "Fecha",
    code: "Código",
    className: "Clase",
    teacher: "Profesor",
    recording: "Grabación",
    link: "Enlace",
    actions: "Acciones",
  },

  detail: {
    date: "Fecha",
    teacher: "Profesor",
    link: "Enlace",
    comment: "Comentario",
    noComment: "Esta clase no tiene comentarios registrados.",
  },

  states: {
    emptyTitle: "No encontramos clases con esos criterios",
    emptyBody:
      "Prueba con otro rango de fechas o busca solo por el código de la clase.",
    errorTitle: "No pudimos conectar con el servidor",
    errorBody:
      "Revisa tu conexión e inténtalo de nuevo. Si el problema sigue, escribe a soporte.",
  },

  auth: {
    title: "Acceso docente",
    subtitle: "Entra para registrar y administrar clases.",
    username: "Usuario",
    password: "Contraseña",
    forgotPassword: "¿Olvidaste tu contraseña?",
    forgotPasswordHelp:
      "Pide al administrador de Talendig que restablezca tu contraseña.",
  },

  admin: {
    title: "Clases registradas",
    searchPlaceholder: "Buscar clase, código o profesor",
    teacherFilterAll: "Profesor: todos",
    rowsPerPage: "Filas por página:",
  },

  form: {
    breadcrumbRoot: "Clases",
    breadcrumbNew: "Nueva clase",
    breadcrumbEdit: "Editar",
    createTitle: "Nueva clase",
    editTitle: "Editar clase",
    optional: "(opcional)",
    date: "Fecha",
    dateHelp: "Día en que se impartió la clase.",
    code: "Código de clase",
    codeHelp: "Usa el formato LETRAS-NÚMEROS, por ejemplo DEV-101.",
    name: "Nombre de la clase",
    nameHelp: "Tema o título con el que los estudiantes reconocen la sesión.",
    teacher: "Profesor",
    link: "Enlace de grabación o material",
    comment: "Comentario",
    commentPlaceholder:
      "Notas de la sesión: temas cubiertos, pendientes, recomendaciones.",
    commentHelp: "Visible en el detalle público de la clase.",
  },

  validation: {
    dateRequired: "Selecciona la fecha en que se impartió la clase.",
    dateInFuture: "La fecha no puede ser posterior a hoy.",
    codeRequired: "Escribe el código de la clase.",
    codeFormat: "Usa el formato LETRAS-NÚMEROS, por ejemplo DEV-101.",
    nameRequired: "Escribe el nombre de la clase.",
    nameTooLong: "El nombre no puede pasar de 120 caracteres.",
    teacherRequired: "Indica quién impartió la clase.",
    linkRequired: "Agrega el enlace de la grabación o del material.",
    linkFormat: "El enlace no tiene un formato válido. Debe empezar con https://",
    commentTooLong: "El comentario no puede pasar de 600 caracteres.",
    usernameRequired: "Escribe tu usuario.",
    passwordRequired: "Escribe tu contraseña.",
  },

  errors: {
    invalidCredentials: "Usuario o contraseña incorrectos.",
    tooManyAttempts:
      "Demasiados intentos fallidos. Espera unos minutos antes de volver a intentar.",
    network: "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.",
    permissionDenied: "Tu cuenta no tiene permiso para hacer esta acción.",
    classNotFound: "Esta clase ya no existe.",
    duplicateCode: "Ya existe una clase con ese código en esa fecha.",
    serviceUnavailable: "El servicio de clases no responde. Inténtalo de nuevo.",
    invalidInput: "Revisa los campos marcados.",
    unexpected: "Ocurrió un error inesperado. Inténtalo de nuevo.",
    boundaryTitle: "Algo se rompió en esta pantalla",
    boundaryBody:
      "Recarga la página para continuar. Si el problema sigue, escribe a soporte.",
    reload: "Recargar",
  },

  notFound: {
    title: "Página no encontrada",
    body: "El enlace que abriste no existe o cambió de dirección.",
    action: "Ir a la consulta",
  },
} as const;
