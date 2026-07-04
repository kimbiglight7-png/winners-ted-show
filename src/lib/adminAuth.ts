export const ADMIN_PASSWORD = '0316';

export function isAdminRequest(request: Request): boolean {
  return request.headers.get('x-admin-password') === ADMIN_PASSWORD;
}
