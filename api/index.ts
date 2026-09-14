import app from '../backend/src/app';

export default function handler(req: any, res: any) {
  if (req.url) {
    if (!req.url.startsWith('/api') && !req.url.startsWith('/health') && !req.url.startsWith('/uploads')) {
      req.url = `/api${req.url}`;
    }
  }
  return app(req, res);
}
