'use client';
import { useState, useRef, useCallback } from 'react';
import { ScanLine, Upload, Camera, X, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { runOCR, readFileAsDataURL } from '@/lib/ocr';
import { compressImageToAvif } from '@/lib/compression';
import type { ScanResult } from '@/types';

interface ScanModalProps {
  onClose: () => void;
  onInsert: (text: string, imageData?: string) => void;
  imageQuality: number;
}

type ScanStep = 'choose' | 'camera' | 'processing' | 'result';

export function ScanModal({ onClose, onInsert, imageQuality }: ScanModalProps) {
  const [step, setStep] = useState<ScanStep>('choose');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [editedText, setEditedText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processImage = useCallback(async (dataUrl: string) => {
    setStep('processing');
    setProgress(0);
    setProgressLabel('Preparing image…');
    setPreviewImage(dataUrl);

    try {
      // Compress the image first
      setProgressLabel('Compressing image…');
      setProgress(10);
      const compressed = await compressImageToAvif(dataUrl, imageQuality);

      // Run OCR
      const scanResult = await runOCR(compressed, (pct, status) => {
        setProgress(10 + Math.round(pct * 0.85));
        setProgressLabel(
          status.includes('loading') ? 'Loading OCR engine…' :
          status.includes('initializing') ? 'Initializing language model…' :
          status.includes('recognizing') ? `Recognizing text… ${pct}%` :
          'Processing…'
        );
      });

      setProgress(100);
      setProgressLabel('Complete!');
      setResult({ ...scanResult, imageData: compressed });
      setEditedText(scanResult.text);
      setStep('result');
    } catch (err) {
      console.error('OCR failed:', err);
      setProgressLabel('OCR failed. You can still insert the image.');
      setResult({ text: '', confidence: 0, imageData: dataUrl, processedAt: Date.now() });
      setEditedText('');
      setStep('result');
    }
  }, [imageQuality]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    await processImage(dataUrl);
  }

  async function startCamera() {
    setStep('camera');
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Camera access denied. Please upload a file instead.');
      setStep('choose');
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    processImage(dataUrl);
  }

  function stopCamera() {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
  }

  function handleClose() {
    stopCamera();
    onClose();
  }

  function handleInsert(includeImage: boolean) {
    if (!result) return;
    onInsert(editedText, includeImage ? result.imageData : undefined);
    handleClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(10, 10, 8, 0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        border: '0.5px solid var(--border-mid)',
        width: '100%',
        maxWidth: 520,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease',
        boxShadow: 'var(--shadow-doc)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 20px', borderBottom: '0.5px solid var(--border-light)',
        }}>
          <div style={{
            width: 32, height: 32, background: 'var(--accent-light)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ScanLine size={16} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Scan Document</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>OCR + compression applied automatically</div>
          </div>
          <button onClick={handleClose} style={{
            marginLeft: 'auto', background: 'transparent', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4,
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── Choose source ── */}
          {step === 'choose' && (
            <div style={{ padding: '24px 20px' }}>
              {cameraError && (
                <div style={{ padding: '10px 12px', background: '#fde8e8', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 12, color: 'var(--red)' }}>
                  {cameraError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <button
                  onClick={startCamera}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 10, padding: '28px 16px',
                    border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-page)', cursor: 'pointer',
                    transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.background = 'var(--bg-page)'; }}
                >
                  <Camera size={28} color="var(--accent)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Use Camera</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Scan with device camera</div>
                  </div>
                </button>

                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 10, padding: '28px 16px',
                    border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-page)', cursor: 'pointer',
                    transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.background = 'var(--bg-page)'; }}
                >
                  <Upload size={28} color="var(--accent)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Upload Image</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>JPG, PNG, WEBP</div>
                  </div>
                </button>
              </div>

              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />

              <div style={{ padding: '12px 14px', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-light)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <strong style={{ fontWeight: 500 }}>How it works:</strong> Your image is processed entirely in your browser using Tesseract.js OCR. The raster scan is replaced with a searchable text layer, reducing file size by up to 78%.
                </div>
              </div>
            </div>
          )}

          {/* ── Camera view ── */}
          {step === 'camera' && (
            <div style={{ padding: '16px 20px' }}>
              <div style={{
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                background: '#000', position: 'relative',
                border: '0.5px solid var(--border-mid)',
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', display: 'block', maxHeight: 300, objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', inset: 16, border: '1.5px solid rgba(255,255,255,0.4)',
                  borderRadius: 8, pointerEvents: 'none',
                }}>
                  {/* Corner guides */}
                  {['topleft','topright','bottomleft','bottomright'].map(corner => (
                    <div key={corner} style={{
                      position: 'absolute',
                      width: 20, height: 20,
                      borderTop: corner.includes('top') ? '2.5px solid var(--accent)' : 'none',
                      borderBottom: corner.includes('bottom') ? '2.5px solid var(--accent)' : 'none',
                      borderLeft: corner.includes('left') ? '2.5px solid var(--accent)' : 'none',
                      borderRight: corner.includes('right') ? '2.5px solid var(--accent)' : 'none',
                      top: corner.includes('top') ? -1 : 'auto',
                      bottom: corner.includes('bottom') ? -1 : 'auto',
                      left: corner.includes('left') ? -1 : 'auto',
                      right: corner.includes('right') ? -1 : 'auto',
                    }} />
                  ))}
                </div>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button onClick={() => { stopCamera(); setStep('choose'); }} style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                  border: '0.5px solid var(--border-mid)', background: 'transparent',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13,
                }}>
                  Cancel
                </button>
                <button onClick={capturePhoto} style={{
                  flex: 2, padding: '10px', borderRadius: 'var(--radius-md)',
                  background: 'var(--accent)', color: 'white', border: 'none',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <Camera size={15} /> Capture
                </button>
              </div>
            </div>
          )}

          {/* ── Processing ── */}
          {step === 'processing' && (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              {previewImage && (
                <img src={previewImage} alt="Processing"
                  style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 'var(--radius-md)', marginBottom: 20, objectFit: 'contain' }}
                />
              )}
              <div style={{ marginBottom: 16 }}>
                <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {progressLabel}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Processing on your device…</div>
              </div>

              <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 3, overflow: 'hidden', margin: '0 40px' }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: 'var(--accent)', borderRadius: 3,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {progress}%
              </div>
            </div>
          )}

          {/* ── Result ── */}
          {step === 'result' && result && (
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                {result.imageData && (
                  <img src={result.imageData} alt="Scanned"
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-light)', flexShrink: 0 }}
                  />
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <CheckCircle size={14} color="var(--accent)" />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>OCR Complete</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Confidence: <strong style={{ color: 'var(--text-accent)' }}>{result.confidence}%</strong><br />
                    {result.text.split(/\s+/).filter(Boolean).length} words extracted
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.06em' }}>
                  EXTRACTED TEXT (EDITABLE)
                </div>
                <textarea
                  value={editedText}
                  onChange={e => setEditedText(e.target.value)}
                  rows={8}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '0.5px solid var(--border-mid)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-page)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7,
                    resize: 'vertical', outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setStep('choose'); setResult(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px',
                    borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-mid)',
                    background: 'transparent', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12,
                  }}
                >
                  <RefreshCw size={12} /> Rescan
                </button>
                <button
                  onClick={() => handleInsert(false)}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 'var(--radius-md)',
                    border: '0.5px solid var(--border-mid)', background: 'transparent',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 12,
                  }}
                >
                  Insert text only
                </button>
                <button
                  onClick={() => handleInsert(true)}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 'var(--radius-md)',
                    background: 'var(--accent)', color: 'white', border: 'none',
                    cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                  }}
                >
                  Insert text + image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
