import express from "express"
import fs from "fs"
import path from "path"

export function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
  console.log(`${formattedTime} [${source}] ${message}`)
}

export async function setupVite(_app, _server) {
  // No-op in standalone server mode; the client runs separately on Vite dev server
}

export function serveStatic(app) {
  const distPath = path.resolve(process.cwd(), "client", "dist")
  
  // Check if client/dist exists, if not, just serve API routes
  if (!fs.existsSync(distPath)) {
    log("Client build directory not found, serving API only", "vite")
    
    // Add a catch-all route for API-only mode
    app.use("*", (req, res) => {
      if (req.path.startsWith("/api")) {
        res.status(404).json({ 
          message: "API endpoint not found",
          path: req.path,
          availableEndpoints: [
            "/api/health",
            "/api/auth/*",
            "/api/users/*",
            "/api/courses/*",
            "/api/assignments/*",
            "/api/products/*",
            "/api/admin/*",
            "/api/recommendations",
            "/api/dashboard"
          ]
        })
      } else {
        res.status(404).json({ 
          message: "Frontend not available. This is an API-only deployment.",
          note: "Deploy the client separately or include client/dist in your deployment"
        })
      }
    })
    return
  }
  
  // If client/dist exists, serve static files
  app.use(express.static(distPath))
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"))
  })
}


