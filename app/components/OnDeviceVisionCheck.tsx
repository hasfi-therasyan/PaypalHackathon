'use client';

import { useEffect, useState } from 'react';
import {
  ON_DEVICE_VISION_MODEL,
  type OnDeviceVisionFinding,
} from '@/app/lib/proofs/on-device-vision';
import type { OcrResult } from '@/app/lib/proofs/ocr-client';

export function OnDeviceVisionCheck({
  image,
  expectedCode,
  ocrResult,
  ocrStatus,
  onFinding,
}: {
  image: File | null;
  expectedCode: string;
  ocrResult: OcrResult | null;
  ocrStatus: 'idle' | 'reading' | 'complete' | 'unavailable';
  onFinding: (finding: OnDeviceVisionFinding | null) => void;
}) {
  const [finding, setFinding] = useState<OnDeviceVisionFinding | null>(null);

  useEffect(() => {
    setFinding(null);
    onFinding(null);
  }, [image, onFinding]);

  useEffect(() => {
    if (!image || ocrStatus !== 'complete' || !ocrResult) return;

    const result: OnDeviceVisionFinding = {
      provider: 'tesseract.js',
      model: ON_DEVICE_VISION_MODEL,
      ran_locally: true,
      analyzed_at: new Date().toISOString(),
      scene_elements: [],
      element_confidences: {},
      confidence: ocrResult.confidence,
    };
    setFinding(result);
    onFinding(result);
  }, [image, ocrResult, ocrStatus, onFinding]);

  const normalizedExpectedCode = expectedCode.trim().toLowerCase();
  const codeMatches = Boolean(
    normalizedExpectedCode &&
    ocrResult?.detectedCode?.trim().toLowerCase() === normalizedExpectedCode
  );

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-3" aria-labelledby="onDeviceVisionTitle">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="onDeviceVisionTitle" className="font-bold text-[#003087]">Private proof-code scan</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
            On-device OCR reads the locked proof code from your photo. It is a supplemental anti-replay signal; your referee still makes the final decision.
          </p>
        </div>
        <span className="w-fit rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-bold text-[#0070ba]">ON-DEVICE</span>
      </div>

      {ocrStatus === 'idle' && <p className="text-[11px] text-slate-600">Choose a photo to scan the proof code automatically.</p>}
      {ocrStatus === 'reading' && <p className="flex items-center gap-2 text-[11px] text-[#003087]" aria-live="polite"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0070ba]/30 border-t-[#0070ba]" />Reading the challenge code on this device…</p>}
      {ocrStatus === 'unavailable' && <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900" role="alert"><strong className="block">Proof-code scan unavailable</strong>Your photo can still be submitted for friend review. Make sure the proof code is visible.</div>}
      {finding && ocrStatus === 'complete' && (
        <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3" aria-live="polite">
          <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-emerald-900">AI evidence ready for referee review</p><span className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-800">LOCAL RESULT</span></div>
          <p className="text-[11px] text-slate-700">{ocrResult?.detectedCode ? `Detected: ${ocrResult.detectedCode}` : 'No challenge code was detected.'}</p>
          <p className={`text-[11px] font-semibold ${codeMatches ? 'text-emerald-800' : 'text-amber-800'}`}>{codeMatches ? '✓ Code matches the locked rubric.' : 'Friend referee will verify the visible code.'} Confidence: {Math.round(finding.confidence * 100)}%.</p>
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-slate-500">The AI runs in your browser. The submitted proof photo is still stored privately so your assigned referee can inspect it.</p>
    </section>
  );
}
