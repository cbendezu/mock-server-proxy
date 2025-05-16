# 🧪 mock-server-proxy

Mock server proxy en Node.js para simular respuestas de endpoints reales, con soporte para:
- Cambios dinámicos de status code (`200`, `503`, etc.)
- Simulación de delay en las respuestas
- Proxy inteligente con reglas por ruta
- Exposición pública automática vía LocalTunnel

---

## 🚀 ¿Para qué sirve?

Este servidor proxy permite redirigir peticiones a endpoints reales, pero también **simular errores o demoras** para validar cómo se comportan los sistemas bajo fallas o latencias. Ideal para pruebas en QA o automatización.

---

## ⚙️ Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Node.js (solo si deseas correrlo fuera de Docker)

---

## 🐳 Cómo correr con Docker

1. Clona el proyecto:

```bash
git clone https://github.com/tu-usuario/mock-server-proxy.git
cd mock-server-proxy
```

2. Construye la imagen:

```bash
docker build -t mock-server-proxy .
```

3. Ejecuta el contenedor:

```bash
docker run --rm --name mock-proxy -p 3000:3000 mock-server-proxy
```

Esto iniciará el mock-server y levantará automáticamente un túnel público.

---

## 🌐 Exponer públicamente con LocalTunnel

Al iniciar el mock, se levanta automáticamente un túnel público a través de [LocalTunnel](https://theboroer.github.io/localtunnel-www/).  
No es necesario ejecutar nada extra — el túnel se genera internamente desde el código.

### URL pública por defecto:
```
https://chris-endpoint-qa.loca.lt
```

> Puedes cambiar el subdominio o desactivar el túnel desde el código si lo deseas.

---
## 🔧 Endpoints útiles

### ▶️ Cambiar status simulado

```http
POST /set-status/:code
```

Ejemplo:
```http
POST /set-status/503
```

### 🐢 Cambiar delay simulado (milisegundos)

```http
POST /set-delay/:ms
```

Ejemplo:
```http
POST /set-delay/10000
```

---

## 📌 Reglas actuales de simulación

El servidor simula errores si el método y la ruta coinciden con estas:

| Método | Ruta | Códigos simulados |
|--------|------|-------------------|
| POST | `/v1/routes/visits/upsert/` | 408, 429, 500, 502, 503, 504 |
| POST | `/routes/:id/add/`          | 404, 408, 429, 500, 502, 503, 504 |
| POST | `/v1/routes/visits/`        | 408, 429, 500, 502, 503, 504 |

---

## 💡 Tips

- Usa `--rm` al correr Docker para evitar acumulación de contenedores.
- Si el puerto 3000 está ocupado, puedes cambiarlo así:
  ```bash
  docker run -p 3001:3000 mock-server-proxy
  ```

---

## 🧠 Autor

Desarrollado por **cbendezu** – [github.com/cbendezu](https://github.com/cbendezu) + 🤖
