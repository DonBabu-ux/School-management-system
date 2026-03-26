/**
 * Keep-Alive Service
 * Pings the server's own /health endpoint every 14 minutes
 * to prevent Render.com free tier from putting the server to sleep.
 * (Render sleeps after 15 minutes of inactivity)
 */

const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

function startKeepAlive(port) {
    const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}/health`;
    
    setInterval(async () => {
        try {
            const https = url.startsWith('https') ? require('https') : require('http');
            const req = https.get(url, (res) => {
                console.log(`🏓 Keep-Alive ping sent → ${url} [${res.statusCode}]`);
            });
            req.on('error', (e) => {
                console.warn(`⚠️ Keep-Alive ping failed: ${e.message}`);
            });
            req.end();
        } catch (err) {
            console.warn('⚠️ Keep-Alive error:', err.message);
        }
    }, PING_INTERVAL_MS);

    console.log(`🔁 Keep-Alive service started. Pinging every 14 minutes → ${url}`);
}

module.exports = { startKeepAlive };
