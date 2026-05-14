const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");

const MIME = {
  ".html": "text/html", ".js": "application/javascript",
  ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg",
  ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2",
};

let localPort = null;

function startLocalServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = req.url.split("?")[0];
      if (filePath === "/") filePath = "/index.html";
      const fullPath = path.join(__dirname, "build", filePath);
      try {
        const data = fs.readFileSync(fullPath);
        const mime = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": mime });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("Not Found");
      }
    });
    server.listen(0, "127.0.0.1", () => {
      localPort = server.address().port;
      resolve(localPort);
    });
  });
}

let mainWin;
const getPlaylistPath = () => path.join(app.getPath("userData"), "playlist.json");

function extractVideoId(url) {
  const m = url.match(/(?:v=|\/v\/|youtu\.be\/|\/embed\/)([^&?\/]{11})/);
  if (!m) throw new Error("올바른 YouTube URL이 아닙니다");
  return m[1];
}

function httpsPost(urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: "POST", headers }, (res) => {
      const chunks = [];
      res.on("data", (d) => chunks.push(d));
      res.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

const INNERTUBE_CLIENTS = [
  {
    headers: { "Content-Type": "application/json", "User-Agent": "com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip" },
    client: { clientName: "ANDROID_TESTSUITE", clientVersion: "1.9", androidSdkVersion: 30, hl: "en", gl: "US" },
  },
  {
    headers: { "Content-Type": "application/json", "User-Agent": "com.google.ios.youtube/17.33.2 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)" },
    client: { clientName: "IOS", clientVersion: "17.33.2", deviceModel: "iPhone14,3", hl: "en", gl: "US" },
  },
  {
    headers: { "Content-Type": "application/json", "User-Agent": "com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip" },
    client: { clientName: "ANDROID", clientVersion: "17.31.35", androidSdkVersion: 30, hl: "en", gl: "US" },
  },
];

async function innerTube(videoId) {
  for (const { headers, client } of INNERTUBE_CLIENTS) {
    const data = await httpsPost("https://www.youtube.com/youtubei/v1/player", headers, { videoId, context: { client } });
    console.log(`[innertube:${client.clientName}] status=${data.playabilityStatus?.status} videoDetails=${!!data.videoDetails} formats=${data.streamingData?.adaptiveFormats?.length ?? 0}`);
    if (data.videoDetails) return data;
  }
  throw new Error("YouTube 응답 없음");
}

function createWindow() {
  mainWin = new BrowserWindow({
    width: 360,
    height: 58,
    frame: false,
    transparent: true,
    resizable: false,
    icon: path.join(__dirname, "public", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      webSecurity: false,
    },
  });
  if (app.isPackaged) {
    mainWin.loadURL(`http://localhost:${localPort}/`);
  } else {
    mainWin.loadURL("http://localhost:3000");
  }
}

ipcMain.handle("load-playlist", () => {
  try {
    const p = getPlaylistPath();
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : [];
  } catch {
    return [];
  }
});

ipcMain.handle("save-playlist", (_, pl) => {
  fs.writeFileSync(getPlaylistPath(), JSON.stringify(pl, null, 2));
});

ipcMain.handle("get-video-info", async (_, url) => {
  const videoId = extractVideoId(url);
  const data = await innerTube(videoId);
  const d = data.videoDetails;
  if (!d) throw new Error("영상 정보를 가져올 수 없습니다");
  return {
    id: videoId,
    title: d.title || "제목 없음",
    author: d.author || "",
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    duration: parseInt(d.lengthSeconds) || 0,
    url,
  };
});

ipcMain.handle("set-opacity", (_, v) => mainWin?.setOpacity(v));
ipcMain.handle("set-window-mode", (_, mode) => {
  if (!mainWin) return;
  const height = mode === "compact" ? 58 : 660;
  mainWin.setSize(360, height);
});
ipcMain.handle("minimize", () => mainWin?.minimize());
ipcMain.handle("close", () => mainWin?.close());

app.whenReady().then(async () => {
  if (app.isPackaged) await startLocalServer();
  createWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
