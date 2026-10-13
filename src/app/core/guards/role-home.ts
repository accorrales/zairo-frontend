export function roleHome(role: string | null | undefined): string {
  switch (role?.trim().toLowerCase()) {
    case 'admin':
    case 'rrhh':
    case 'contabilidad': return '/dashboard';
    case 'entrada': return '/admin/kiosk';
    case 'visor': return '/reportes';
    default: return '/home';
  }
}
