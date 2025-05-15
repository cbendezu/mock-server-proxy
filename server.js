const express = require('express');
const fetch = require('node-fetch');
const localtunnel = require('localtunnel');

const app = express();
app.use(express.json());

const { performance } = require('perf_hooks');
const WEBHOOK_BASE_URL = 'https://api.simpliroute.com/'; 
let simulatedStatus = 200;       
let simulatedDelay = 0;          //en ms

const codigosError = [404, 408, 429, 500, 502, 503, 504];

//mapeo de  errores en rutas puntuales
const rutasConError = [
    {
        method: 'POST',
        pattern: /^\/v1\/routes\/visits\/upsert\/$/, 
        codes: [408, 429, 500, 502, 503, 504],
    },
    {
        method: 'POST',
        pattern: /^\/routes\/[^/]+\/add\/$/, 
        codes: [404, 408, 429, 500, 502, 503, 504],
    },
    {
        method: 'POST',
        pattern: /^\/v1\/routes\/visits\/$/, 
        codes: [408, 429, 500, 502, 503, 504],
    }
];

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.post('/set-status/:code', (req, res) => {
    const nuevoStatus = parseInt(req.params.code, 10);
    if (codigosError.includes(nuevoStatus) || nuevoStatus === 200) {
        simulatedStatus = nuevoStatus;
        console.log(`🛠️ SIMULATED_STATUS actualizado a ${simulatedStatus}`);
        return res.json({ mensaje: `Status simulado actualizado a ${simulatedStatus}` });
    }
    res.status(400).json({ error: 'Código de status no permitido' });
});

app.post('/set-delay/:ms', (req, res) => {
    const nuevoDelay = parseInt(req.params.ms, 10);
    if (!isNaN(nuevoDelay) && nuevoDelay >= 0 && nuevoDelay <= 600000) {
        simulatedDelay = nuevoDelay;
        console.log(`⏳ SIMULATED_DELAY actualizado a ${simulatedDelay}ms`);
        return res.json({ mensaje: `Delay simulado actualizado a ${simulatedDelay}ms` });
    }
    res.status(400).json({ error: 'Delay inválido (usa milisegundos entre 0 y 600000)' });
});

app.all('*', async (req, res) => {

    const start = performance.now(); 
    const fullPath = req.originalUrl;
    let baseUrl = WEBHOOK_BASE_URL; 

    if (/\/routes\/[^/]+\/add\//.test(fullPath)) {
        baseUrl = 'http://router-ms.simpliroute.com:8000/';
        console.log('🔁 Redirigiendo este request a router-ms.simpliroute.com');
    }

    const fullUrl = baseUrl.replace(/\/$/, '') + fullPath; 

    console.log(`\n📥 Request recibido: ${req.method} ${fullPath}`);
    console.log('🔸 Body:', req.body);

    // delay antes de continuar
    if (simulatedDelay > 0) {
        console.log(`⏳ Esperando ${simulatedDelay}ms antes de responder...`);
        await delay(simulatedDelay);
    }

    const match = rutasConError.find(rule =>
        rule.method === req.method.toUpperCase() && rule.pattern.test(fullPath)
    );

    if (match && match.codes.includes(simulatedStatus)) {
        console.log(`⚠️  Simulando error ${simulatedStatus} para ${req.method} ${fullPath}`);
        return res.status(simulatedStatus).json({
            mensaje: `Mock simulado con status ${simulatedStatus}`,
            ruta: fullPath
        });
    }

    try {
        // 🔁 Reenviar headers originales seguros
        const safeHeaders = {};
        for (const [key, value] of Object.entries(req.headers)) {
            const lowerKey = key.toLowerCase();
            if (!['host', 'connection', 'content-length'].includes(lowerKey)) {
                safeHeaders[lowerKey] = value;
            }
        }
        if (
            ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) &&
            !safeHeaders['content-type']
        ) {
            safeHeaders['content-type'] = 'application/json';
        }

        console.log('📨 Headers reenviados:', safeHeaders);
        console.log(`🔁 Redirigiendo a: ${fullUrl}`);

        const response = await fetch(fullUrl, {
            method: req.method,
            headers: safeHeaders,
            body: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
                ? JSON.stringify(req.body)
                : undefined
        });

        const responseBody = await response.json();
        const raw = Buffer.from(JSON.stringify(responseBody)); 
        console.log('✅ Respuesta del endpoint real:', responseBody);
        res.status(response.status);
        res.setHeader('Content-Type', 'application/json'); 
        res.setHeader('Content-Length', raw.length);
        res.send(raw);

        const duration = (performance.now() - start).toFixed(2);
        console.log(`⏱️ Tiempo de respuesta: ${duration} ms para ${req.method} ${fullPath}`);
    } catch (err) {
        console.error('❌ Error al reenviar:', err);
        return res.status(500).json({ error: 'Fallo al reenviar la solicitud' });
    }
});

app.listen(3000, () => {
    console.log('🟢 Servidor local corriendo en http://localhost:3000');
    iniciarTunnel();
});

async function iniciarTunnel() {
    try {
        const tunnel = await localtunnel({ port: 3000, subdomain: 'chris-endpoint-qa' });
        console.log(`🌍 Tunnel público disponible en: ${tunnel.url}`);
        console.log(`📌 Cambiar status: ${tunnel.url}/set-status/503`);
        console.log(`📌 Cambiar delay: ${tunnel.url}/set-delay/10000`);
    } catch (error) {
        console.error('❌ Error al iniciar localtunnel:', error);
    }
}