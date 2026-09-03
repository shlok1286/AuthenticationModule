import esbuild from 'esbuild';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startFrontend() {
  // Build bundle using esbuild JS API
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'src', 'main.tsx')],
    bundle: true,
    outfile: path.join(__dirname, 'public', 'bundle.js'),
    loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'css' },
    define: {
      'process.env.NODE_ENV': '"development"',
      'global': 'globalThis'
    },
    sourcemap: true,
    format: 'esm',
    jsx: 'automatic'
  });

  console.log('Frontend bundled successfully with esbuild.');

  const app = express();
  const PORT = Number(process.env.PORT || 5173);

  app.use('/public', express.static(path.join(__dirname, 'public')));

  // Single page app fallback
  app.use((req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Authentication Module</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            window.global = window;
            tailwind.config = {
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                  },
                  colors: {
                    brand: {
                      dark: '#111111',
                      gray: '#6B7280',
                      light: '#E5E7EB',
                    }
                  }
                }
              }
            }
          </script>
        </head>
        <body class="bg-white text-[#111111] antialiased selection:bg-[#111111] selection:text-white">
          <div id="root"></div>
          <script type="module" src="/public/bundle.js"></script>
        </body>
      </html>
    `);
  });

  app.listen(PORT, () => {
    console.log(`Frontend dev server running on http://localhost:${PORT}`);
  });
}

startFrontend().catch(console.error);
