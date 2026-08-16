import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

import cookieParser from 'cookie-parser';

app.use(express.json());
app.use(cookieParser());

// Store token
app.post('/api/github/token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    res.clearCookie('github_token');
    res.json({ success: true, message: 'Token cleared' });
  } else {
    res.cookie('github_token', token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    res.json({ success: true, message: 'Token saved' });
  }
});

// Proxy to GitHub API
app.get('/api/github/{*splat}', async (req, res) => {
  const githubPath = req.path.replace('/api/github/', '');
  const targetUrl = `https://api.github.com/${githubPath}`;
  
  const token = req.cookies.github_token;
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Forward query string if present
  const queryObj = new URLSearchParams(req.query as Record<string, string>);
  const queryStr = queryObj.toString();
  const finalUrl = queryStr ? `${targetUrl}?${queryStr}` : targetUrl;

  try {
    const response = await fetch(finalUrl, { headers });
    
    // Pass status and statusText along
    res.status(response.status);
    
    const data = await response.text(); // sometimes empty or non-JSON
    try {
      res.json(JSON.parse(data));
    } catch {
      res.send(data);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      {
        if (response) {
          // Enable Incremental Static Regeneration (ISR) on Vercel
          // Serve from cache for up to 60 seconds.
          // If a request comes in after 60s, serve stale cache (up to 1h) while regenerating in the background.
          res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600');
          writeResponseToNodeResponse(response, res);
        } else {
          next();
        }
      }
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
