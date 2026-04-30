/**
 * Mensajes para el usuario: mapeo de respuestas del backend (inglés/técnicas) y fallbacks en español.
 */

const GENERIC = 'Ocurrió un problema. Inténtalo nuevamente';

function looksLikeSpanish(s: string): boolean {
  return (
    /[áéíóúñüÁÉÍÓÚÑÜ]/.test(s) ||
    /\b(el|la|los|las|no|tenés|listo|contraseña|correo|negocio|ficha|completá|podés|ingres|registr|error al|no se|encontrad|válid)\b/i.test(
      s
    )
  );
}

type Rule = { test: (lower: string) => boolean; es: string };

const RULES: Rule[] = [
  { test: (s) => s.includes('invalid credentials'), es: 'Credenciales inválidas' },
  { test: (s) => s.includes('username or email already exists'), es: 'El usuario o el correo ya están registrados' },
  { test: (s) => s.includes('email already exists') || s.includes('email already in use'), es: 'Este correo ya está en uso' },
  { test: (s) => s.includes('email is required'), es: 'Ingresá un correo electrónico' },
  { test: (s) => s.includes('invalid email format'), es: 'El formato del correo no es válido' },
  {
    test: (s) => s.includes('currentpassword') && s.includes('required'),
    es: 'Completá la contraseña actual, la nueva y la confirmación',
  },
  {
    test: (s) => s.includes('newpassword and confirmpassword do not match'),
    es: 'Las contraseñas nuevas no coinciden',
  },
  {
    test: (s) => s.includes('newpassword must be at least'),
    es: 'La nueva contraseña debe tener al menos 6 caracteres',
  },
  { test: (s) => s.includes('current password is incorrect'), es: 'La contraseña actual no es correcta' },
  { test: (s) => s.includes('account is already deleted'), es: 'Esta cuenta ya fue eliminada' },
  { test: (s) => s.includes('admin cannot switch role'), es: 'El administrador no puede cambiar de perfil desde aquí' },
  { test: (s) => s.includes('username already exists'), es: 'Este nombre de usuario ya está en uso' },
  { test: (s) => s.includes('account does not exist'), es: 'La cuenta no existe o fue eliminada' },
  { test: (s) => s.includes('user not found'), es: 'El nombre de usuario no existe' },
  { test: (s) => s.includes('username is required'), es: 'Completá el nombre de usuario' },
  { test: (s) => s.includes('validation error'), es: 'Los datos ingresados no son válidos' },
  { test: (s) => s.includes('username and password are required'), es: 'Completá usuario y contraseña' },
  { test: (s) => s.includes('invalid role'), es: 'El tipo de cuenta no es válido' },
  { test: (s) => s.includes('admin role cannot'), es: 'No podés registrar una cuenta de administrador' },
  { test: (s) => s.includes('request failed'), es: GENERIC },
  { test: (s) => s.includes('missing authorization'), es: 'Sesión no válida. Iniciá sesión nuevamente' },
  { test: (s) => s.includes('invalid authorization format'), es: 'Sesión no válida. Iniciá sesión nuevamente' },
  { test: (s) => s.includes('invalid or expired token'), es: 'La sesión expiró. Iniciá sesión nuevamente' },
  { test: (s) => s.includes('business not found'), es: 'Negocio no encontrado' },
  { test: (s) => s.includes('business id is required'), es: 'Faltan datos. Volvé a intentar' },
  { test: (s) => s.includes('forbidden') || s.includes('unauthorized'), es: 'No tenés permiso para realizar esta acción' },
  { test: (s) => s.includes('access denied'), es: 'No tenés permiso para realizar esta acción' },
  { test: (s) => s.includes('admin only'), es: 'Esta acción es solo para administradores' },
  { test: (s) => s.includes('name is required'), es: 'Completá el nombre del negocio' },
  { test: (s) => s.includes('category is required'), es: 'Elegí una categoría' },
  { test: (s) => s.includes('bannerimageurl is required'), es: 'Subí o indicá la imagen del banner' },
  { test: (s) => s.includes('redirecturl is required'), es: 'Completá el enlace de redirección' },
  { test: (s) => s.includes('slogan is required'), es: 'Completá el eslogan' },
  { test: (s) => s.includes('description is required'), es: 'Completá la descripción' },
  { test: (s) => s.includes('p2002'), es: 'Ese dato ya está registrado' },
  { test: (s) => s.includes('cloudinary is not configured'), es: 'La subida de imágenes no está disponible. Contactá al administrador' },
  { test: (s) => s.includes('cloudinary'), es: 'No se pudo subir la imagen. Intentá más tarde' },
  { test: (s) => s.includes('upload preset'), es: 'No se pudo subir la imagen. Intentá más tarde' },
  { test: (s) => s.includes('email updated successfully'), es: 'Correo actualizado correctamente' },
  { test: (s) => s.includes('password updated successfully'), es: 'Contraseña modificada correctamente' },
  { test: (s) => s.includes('account deleted successfully'), es: 'Cuenta eliminada correctamente' },
  { test: (s) => s.includes('role updated successfully'), es: 'Perfil actualizado correctamente' },
];

/**
 * Convierte mensajes conocidos del API a español claro. Si ya parece español, lo devuelve.
 * Mensajes desconocidos en inglés → fallback.
 */
export function mapApiMessage(raw: unknown, fallback: string): string {
  if (raw == null || typeof raw !== 'string') return fallback;
  const msg = raw.trim();
  if (!msg) return fallback;

  const lower = msg.toLowerCase();

  for (const { test, es } of RULES) {
    if (test(lower)) return es;
  }

  if (looksLikeSpanish(msg)) return msg;

  if (/^[a-z0-9\s.,'!?\-_]+$/i.test(msg) && msg.length < 120) return fallback;

  return fallback;
}

/** Mensaje seguro a partir de un error capturado (p. ej. en toasts o formularios). */
export function userFacingError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return mapApiMessage(err.message, fallback);
  return fallback;
}
