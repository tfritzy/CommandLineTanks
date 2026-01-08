import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

let bytesSent = 0;
let bytesReceived = 0;
let lastCheck = performance.now();

const getByteLength = (data: string | ArrayBufferLike | Blob | ArrayBufferView): number => {
  if (typeof data === "string") {
    return new TextEncoder().encode(data).length;
  } else if (data instanceof Blob) {
    return data.size;
  } else if (data instanceof ArrayBuffer) {
    return data.byteLength;
  } else if (ArrayBuffer.isView(data)) {
    return data.byteLength;
  }
  return 0;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const installWebSocketMonitor = () => {
  const originalSend = WebSocket.prototype.send;

  WebSocket.prototype.send = function (data) {
    bytesSent += getByteLength(data);
    return originalSend.call(this, data);
  };

  const originalOnMessageDescriptor = Object.getOwnPropertyDescriptor(
    WebSocket.prototype,
    "onmessage"
  );

  if (originalOnMessageDescriptor) {
    Object.defineProperty(WebSocket.prototype, "onmessage", {
      set(handler) {
        const wrapped = (event: MessageEvent) => {
          bytesReceived += getByteLength(event.data);
          handler?.call(this, event);
        };
        originalOnMessageDescriptor.set?.call(this, wrapped);
      },
      get() {
        return originalOnMessageDescriptor.get?.call(this);
      },
    });
  }

  setInterval(() => {
    const now = performance.now();
    const elapsed = (now - lastCheck) / 1000;
    const sentPerSec = bytesSent / elapsed;
    const receivedPerSec = bytesReceived / elapsed;

    console.log(
      `WebSocket: ↑ ${formatBytes(sentPerSec)}/s | ↓ ${formatBytes(receivedPerSec)}/s`
    );

    bytesSent = 0;
    bytesReceived = 0;
    lastCheck = now;
  }, 1000);
};

installWebSocketMonitor();

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
