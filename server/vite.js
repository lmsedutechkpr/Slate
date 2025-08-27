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
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}`)
  }
  app.use(express.static(distPath))
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"))
  })
}


