"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, AlertTriangle } from "lucide-react";

export default function BarcodeScanner({ onDetect, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const [erro, setErro] = useState("");
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    if (!("BarcodeDetector" in window)) {
      setErro(
        "Seu navegador não suporta leitura automática de código de barras. Use Chrome/Edge atualizados, ou digite o código manualmente."
      );
      return;
    }
    try {
      detectorRef.current = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
      });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPronto(true);
      scanLoop();
    } catch (e) {
      setErro(
        "Não foi possível acessar a câmera. Verifique se você concedeu permissão de câmera para este site."
      );
    }
  }

  async function scanLoop() {
    if (!videoRef.current || !detectorRef.current) return;
    try {
      const codes = await detectorRef.current.detect(videoRef.current);
      if (codes && codes.length > 0) {
        onDetect(codes[0].rawValue);
        stop();
        return;
      }
    } catch (e) {
      // frame ilegível, tenta de novo no próximo
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function handleClose() {
    stop();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-panel border border-white/10 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-cream text-sm font-medium">
            <Camera className="w-4 h-4 text-gold" />
            Aponte a câmera para o código de barras
          </div>
          <button onClick={handleClose} className="text-muted hover:text-cream">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {pronto && !erro && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4/5 h-16 border-2 border-gold rounded-lg" />
            </div>
          )}
        </div>

        {erro && (
          <div className="p-4 flex items-start gap-2 text-sm text-rust">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{erro}</p>
          </div>
        )}

        <div className="p-4 flex justify-end">
          <button
            onClick={handleClose}
            className="text-sm text-muted hover:text-cream"
          >
            Cancelar e digitar manualmente
          </button>
        </div>
      </div>
    </div>
  );
}
