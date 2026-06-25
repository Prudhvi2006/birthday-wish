import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { exec } from 'child_process';

async function ensureMusicFile() {
  const publicDir = path.join(process.cwd(), "public");
  const musicPath = path.join(publicDir, "music.mp3");
  const distDir = path.join(process.cwd(), "dist");
  const distMusicPath = path.join(distDir, "music.mp3");

  // Create public directory if it doesn't exist
  try {
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
  } catch (err) {
    console.error("[Startup] Failed to create public folder:", err);
  }

  // If the music.mp3 already exists and has a non-trivial size, don't re-download
  if (fs.existsSync(musicPath)) {
    try {
      const stats = fs.statSync(musicPath);
      if (stats.size > 5000) {
        console.log(`[Startup] music.mp3 is already available at ${musicPath} (${stats.size} bytes).`);
        // Force sync it to dist if dist exists but the music file is missing
        if (fs.existsSync(distDir) && !fs.existsSync(distMusicPath)) {
          fs.copyFileSync(musicPath, distMusicPath);
          console.log(`[Startup] Copied existing music.mp3 to dist folder.`);
        }
        return;
      }
    } catch (e) {}
  }

  console.log(`[Startup] Downloading the custom Shinchan sibling voice to static public/music.mp3...`);
  const fileId = "1Qw1Z2Ps8C5eQDWxrBR7ZU9WCbhDKc6Xs";
  const downloadUrls = [
    `https://docs.google.com/uc?export=download&id=${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download`
  ];

  let buffer: Buffer | null = null;
  for (let i = 0; i < downloadUrls.length && !buffer; i++) {
    try {
      const response = await fetch(downloadUrls[i], {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
      });
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          // Consent virus scanning bypass required
          const htmlText = await response.text();
          let confirmToken = "";
          const confirmMatch = htmlText.match(/confirm=([a-zA-Z0-9_\-]+)/);
          if (confirmMatch) {
            confirmToken = confirmMatch[1];
          } else {
            const hiddenMatch = htmlText.match(/name="confirm"\s+value="([^"]+)"/) || 
                                htmlText.match(/value="([^"]+)"\s+name="confirm"/);
            if (hiddenMatch) {
              confirmToken = hiddenMatch[1];
            }
          }
          if (confirmToken) {
            const confirmedUrl = `https://docs.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
            const setCookies = typeof response.headers.getSetCookie === "function"
              ? response.headers.getSetCookie()
              : [response.headers.get("set-cookie")].filter(Boolean);
            const cookieHeader = setCookies.map(c => c.split(";")[0]).join("; ");

            const secondResponse = await fetch(confirmedUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Cookie": cookieHeader,
              }
            });
            if (secondResponse.ok) {
              const ab = await secondResponse.arrayBuffer();
              buffer = Buffer.from(ab);
            }
          }
        } else {
          const ab = await response.arrayBuffer();
          buffer = Buffer.from(ab);
        }
      }
    } catch (e) {}
  }

  // Fallback if google drive fails
  if (!buffer || buffer.length < 5000) {
    console.log(`[Startup] Google drive stream warning, downloading high quality fallback...`);
    try {
      const fallbackRes = await fetch("https://www.myinstants.com/media/sounds/sinchan_1.mp3");
      if (fallbackRes.ok) {
        const ab = await fallbackRes.arrayBuffer();
        buffer = Buffer.from(ab);
      }
    } catch (e) {
      console.error("[Startup] Fallback sound download failed too:", e);
    }
  }

  if (buffer && buffer.length > 500) {
    try {
      fs.writeFileSync(musicPath, buffer);
      console.log(`[Startup] Success! Saved custom voice message as physical local public/music.mp3 (${buffer.length} bytes)`);
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(distMusicPath, buffer);
        console.log(`[Startup] Copied to dist/music.mp3 as well`);
      }
    } catch (writeErr) {
      console.error("[Startup] Error writing downloaded file:", writeErr);
    }
  } else {
    console.error("[Startup] Could not download sound file on init.");
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Create a robust writeable cache folder inside /tmp for sound files
  const cacheDir = path.join("/tmp", "audioproxy-cache");
  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    console.log(`[AudioProxy] Web-compliant audio disk cache ready at: ${cacheDir}`);
  } catch (err) {
    console.error("[AudioProxy] Could not create local temp write directory:", err);
  }

  // Set up API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Call music downloader in background on server boot
  ensureMusicFile().catch(err => {
    console.error("[Server] Error during startup ensureMusicFile:", err);
  });

  // Serves custom birthday greeting voice music.mp3 directly from server with perfect range support (HTTP 206)
  app.get("/music.mp3", (req, res) => {
    const publicMusic = path.join(process.cwd(), "public", "music.mp3");
    const distMusic = path.join(process.cwd(), "dist", "music.mp3");
    
    // Set headers for standard cross-origin capability and media audio players
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
    res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");

    if (fs.existsSync(publicMusic) && fs.statSync(publicMusic).size > 5000) {
      return res.sendFile(publicMusic);
    } else if (fs.existsSync(distMusic) && fs.statSync(distMusic).size > 5000) {
      return res.sendFile(distMusic);
    } else {
      console.log("[Server] music.mp3 is requested but not yet fully saved on disk. Fetching on demand...");
      ensureMusicFile().then(() => {
        if (fs.existsSync(publicMusic)) {
          res.sendFile(publicMusic);
        } else if (fs.existsSync(distMusic)) {
          res.sendFile(distMusic);
        } else {
          // Redirect to google drive direct link as safe final fallback
          res.redirect("https://docs.google.com/uc?export=download&id=1Qw1Z2Ps8C5eQDWxrBR7ZU9WCbhDKc6Xs");
        }
      }).catch(() => {
        res.redirect("https://docs.google.com/uc?export=download&id=1Qw1Z2Ps8C5eQDWxrBR7ZU9WCbhDKc6Xs");
      });
    }
  });

  // Proxy endpoint to stream Google Drive audio files without CORS or browser blocks.
  // Using res.sendFile() allows Express to automatically handle HTTP Range requests (206 Partial Content),
  // which are vital for reliable audio playback in Safari (macOS/iOS) and Chrome.
  app.get("/api/proxy-audio", async (req, res) => {
    try {
      const fileId = (req.query.id as string) || "1Qw1Z2Ps8C5eQDWxrBR7ZU9WCbhDKc6Xs";
      const cachedFilePath = path.join(cacheDir, `audio-${fileId}.mp3`);
      
      // Apply CORS headers for HTML5 audio tags and media elements
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
      res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");

      // Serve instantly from local disk cache if already fetched!
      // This is fast, keeps bandwidth zero, and completely bypasses any Google Drive rate limits.
      if (fs.existsSync(cachedFilePath)) {
        const stats = fs.statSync(cachedFilePath);
        if (stats.size > 5000) {
          console.log(`[AudioProxy] Serving disk-cached audio file for ID: ${fileId} (${stats.size} bytes)`);
          res.sendFile(cachedFilePath);
          return;
        } else {
          // Clean up corrupted or empty file
          try { fs.unlinkSync(cachedFilePath); } catch (e) {}
        }
      }

      console.log(`[AudioProxy] File not cached. Fetching audio from Google Drive for ID: ${fileId}`);
      
      // Try multiple redundant endpoints/URLs to download the Google Drive binary
      const downloadUrls = [
        `https://docs.google.com/uc?export=download&id=${fileId}`,
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        `https://drive.usercontent.google.com/download?id=${fileId}&export=download`
      ];

      let buffer: Buffer | null = null;
      let contentType = "audio/mpeg";

      for (let i = 0; i < downloadUrls.length && !buffer; i++) {
        const url = downloadUrls[i];
        try {
          console.log(`[AudioProxy] Trying source URL ${i + 1}: ${url}`);
          const firstResponse = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            },
          });

          if (!firstResponse.ok) {
            console.log(`[AudioProxy] Source ${i + 1} returned error status: ${firstResponse.status}`);
            continue;
          }

          const responseType = firstResponse.headers.get("content-type") || "";

          // Handle Google Drive Virus Scan confirmation warning page (text/html page)
          if (responseType.includes("text/html")) {
            const htmlText = await firstResponse.text();
            console.log(`[AudioProxy] Source ${i + 1} served HTML warning. Attempting to bypass scan...`);

            // Extract confirm token
            let confirmToken = "";
            const confirmMatch = htmlText.match(/confirm=([a-zA-Z0-9_\-]+)/);
            if (confirmMatch) {
              confirmToken = confirmMatch[1];
            } else {
              const hiddenMatch = htmlText.match(/name="confirm"\s+value="([^"]+)"/) || 
                                  htmlText.match(/value="([^"]+)"\s+name="confirm"/);
              if (hiddenMatch) {
                confirmToken = hiddenMatch[1];
              }
            }

            if (confirmToken) {
              console.log(`[AudioProxy] Found virus-bypass token: ${confirmToken}`);
              const confirmedUrl = `https://docs.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
              
              // Map cookies set by Google Drive session
              const setCookies = typeof firstResponse.headers.getSetCookie === "function"
                ? firstResponse.headers.getSetCookie()
                : [firstResponse.headers.get("set-cookie")].filter(Boolean);
              const cookieHeader = setCookies.map(c => c.split(";")[0]).join("; ");

              const secondResponse = await fetch(confirmedUrl, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                  "Cookie": cookieHeader,
                }
              });

              if (secondResponse.ok) {
                contentType = secondResponse.headers.get("content-type") || "audio/mpeg";
                const arrayBuf = await secondResponse.arrayBuffer();
                buffer = Buffer.from(arrayBuf);
                console.log(`[AudioProxy] Bypass download succeeded! Length: ${buffer.length} bytes`);
              } else {
                console.warn(`[AudioProxy] Bypass download returned status: ${secondResponse.status}`);
              }
            } else {
              console.warn(`[AudioProxy] Consent warning found but no confirm token could be parsed.`);
            }
          } else {
            // Success! Direct audio stream received
            contentType = responseType;
            const arrayBuf = await firstResponse.arrayBuffer();
            buffer = Buffer.from(arrayBuf);
            console.log(`[AudioProxy] Direct download succeeded! Length: ${buffer.length} bytes`);
          }
        } catch (err: any) {
          console.warn(`[AudioProxy] Source ${i + 1} failed during download:`, err.message || err);
        }
      }

      // Robust secondary fallback: If Google Drive is completely blocked, rate-limited or fails
      if (!buffer || buffer.length < 5000 || contentType.includes("html")) {
        console.warn(`[AudioProxy] Google Drive stream failed or rate-limited. Trying official backup sound URL...`);
        const fallbackUrl = "https://www.myinstants.com/media/sounds/sinchan_1.mp3";
        try {
          const fallbackRes = await fetch(fallbackUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            },
          });

          if (fallbackRes.ok) {
            contentType = fallbackRes.headers.get("content-type") || "audio/mpeg";
            const arrayBuf = await fallbackRes.arrayBuffer();
            buffer = Buffer.from(arrayBuf);
            console.log(`[AudioProxy] Backup voice sound loaded successfully. Length: ${buffer.length} bytes`);
          } else {
            console.error(`[AudioProxy] Primary backup sound failed too: ${fallbackRes.status}`);
          }
        } catch (e: any) {
          console.error(`[AudioProxy] Network error fetching backup endpoint:`, e.message || e);
        }
      }

      // Save valid binary data to disk Cache and stream via sendFile for full ranges support
      if (buffer && buffer.length > 500) {
        fs.writeFileSync(cachedFilePath, buffer);
        console.log(`[AudioProxy] Saved audio to physical disk cache: ${cachedFilePath}`);
        res.sendFile(cachedFilePath);
      } else {
        console.warn(`[AudioProxy] All stream acquisition failed for ID ${fileId}. Redirecting client.`);
        res.redirect(`https://docs.google.com/uc?export=download&id=${fileId}`);
      }
    } catch (error: any) {
      console.error("[AudioProxy] Audio Proxy Exception:", error);
      if (!res.headersSent) {
        const fileId = (req.query.id as string) || "1Qw1Z2Ps8C5eQDWxrBR7ZU9WCbhDKc6Xs";
        res.redirect(`https://docs.google.com/uc?export=download&id=${fileId}`);
      }
    }
  });

  // Serve static files from public folder BEFORE Vite middleware
  const publicPath = path.join(process.cwd(), "public");
  app.use(express.static(publicPath, { 
    maxAge: "1h",
    setHeaders: (res, filepath) => {
      if (filepath.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
      }
    }
  }));
  console.log(`[Server] Static public folder mounted at: ${publicPath}`);

  // Vite middleware setup for Development, SPA static fallback for Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log(`[Server] Vite development middleware mounted.`);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`[Server] Production static server serving dist from: ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running and listening on port ${PORT}`);
    // Attempt to open the user's default browser automatically (dev convenience).
    try {
      const url = `http://localhost:${PORT}`;
      if (process.platform === 'win32') {
        exec(`start ${url}`);
      } else if (process.platform === 'darwin') {
        exec(`open ${url}`);
      } else {
        exec(`xdg-open ${url}`);
      }
    } catch (e) {
      // ignore errors - this is a convenience only
    }
  });
}

startServer();
