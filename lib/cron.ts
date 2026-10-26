// Vercel Cron envía "Authorization: Bearer <CRON_SECRET>". Sin secreto configurado, se rechaza todo.
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
