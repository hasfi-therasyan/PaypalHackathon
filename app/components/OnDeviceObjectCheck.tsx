'use client';

import { useEffect, useMemo, useState } from 'react';
import { isCocoRubricElement } from '@/app/lib/proofs/coco-rubric';
import type { OnDeviceVisionFinding } from '@/app/lib/proofs/on-device-vision';

type DetectedObject = { class: string; score: number };
type ObjectDetector = {
  detect(image: HTMLImageElement, maxNumBoxes?: number, minScore?: number): Promise<DetectedObject[]>;
};

let detectorPromise: Promise<ObjectDetector> | null = null;

async function getObjectDetector(): Promise<ObjectDetector> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      return cocoSsd.load({ base: 'lite_mobilenet_v2' });
    })();
  }

  try {
    return await detectorPromise;
  } catch (error) {
    detectorPromise = null;
    throw error;
  }
}

function loadImage(file: File): Promise<{ image: HTMLImageElement; release: () => void }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => resolve({ image, release: () => URL.revokeObjectURL(url) });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The photo could not be prepared for object detection.'));
    };
    image.src = url;
  });
}

export function OnDeviceObjectCheck({
  image,
  requiredElements,
  minimumConfidence,
  onFinding,
}: {
  image: File | null;
  requiredElements: string[];
  minimumConfidence: number;
  onFinding: (finding: OnDeviceVisionFinding | null) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'complete' | 'unavailable' | 'unsupported'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [finding, setFinding] = useState<OnDeviceVisionFinding | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const elementsKey = requiredElements.join('|');

  const supportedElements = useMemo(
    () => requiredElements.filter(isCocoRubricElement),
    [elementsKey]
  );
  const unsupportedElements = useMemo(
    () => requiredElements.filter((element) => !isCocoRubricElement(element)),
    [elementsKey]
  );

  useEffect(() => {
    let cancelled = false;
    setFinding(null);
    setError(null);
    onFinding(null);

    if (!image) {
      setStatus('idle');
      return () => { cancelled = true; };
    }
    if (!supportedElements.length) {
      setStatus('unsupported');
      return () => { cancelled = true; };
    }

    async function detectObjects() {
      setStatus('loading');
      try {
        const [detector, prepared] = await Promise.all([getObjectDetector(), loadImage(image!)]);
        try {
          const detections = await detector.detect(prepared.image, 20, 0.25);
          if (cancelled) return;

          const elementConfidences: Record<string, number> = {};
          for (const element of supportedElements) {
            const bestScore = detections
              .filter((detection) => detection.class === element)
              .reduce((highest, detection) => Math.max(highest, detection.score), 0);
            elementConfidences[element] = Number(bestScore.toFixed(4));
          }

          const result: OnDeviceVisionFinding = {
            provider: 'coco-ssd',
            model: 'COCO-SSD Lite MobileNet V2',
            ran_locally: true,
            analyzed_at: new Date().toISOString(),
            scene_elements: supportedElements.filter((element) => (elementConfidences[element] || 0) >= minimumConfidence),
            element_confidences: elementConfidences,
            confidence: Math.max(...Object.values(elementConfidences), 0),
          };
          setFinding(result);
          onFinding(result);
          setStatus('complete');
        } finally {
          prepared.release();
        }
      } catch (cause) {
        if (cancelled) return;
        console.warn('On-device object detection unavailable', cause);
        setStatus('unavailable');
        setError('The local object detector could not start. You can still submit this photo for friend review.');
      }
    }

    void detectObjects();
    return () => { cancelled = true; };
  }, [image, minimumConfidence, onFinding, retryKey, supportedElements]);

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-3" aria-labelledby="onDeviceObjectTitle">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="onDeviceObjectTitle" className="font-bold text-[#003087]">Private AI object check</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">A local detector checks only the supported rubric objects. Results are evidence for your referee, never an automatic settlement.</p>
        </div>
        <span className="w-fit rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-bold text-[#0070ba]">ON-DEVICE</span>
      </div>

      {supportedElements.length > 0 && <div className="flex flex-wrap gap-1.5" aria-label="Objects checked by the local detector">{supportedElements.map((element) => <span key={element} className="rounded-md border border-blue-200 bg-white px-2 py-1 text-[10px] font-semibold text-[#003087]">{element}</span>)}</div>}
      {unsupportedElements.length > 0 && <p className="text-[10px] leading-relaxed text-amber-900">Friend referee review required for: {unsupportedElements.join(', ')}. These are not standard object-detector classes.</p>}

      {status === 'idle' && <p className="text-[11px] text-slate-600">Choose a photo to run the local object check.</p>}
      {status === 'loading' && <p className="flex items-center gap-2 text-[11px] text-[#003087]" aria-live="polite"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0070ba]/30 border-t-[#0070ba]" />Loading and running the local object detector…</p>}
      {status === 'unsupported' && <p className="text-[11px] text-amber-900">This locked rubric has no objects supported by the local detector. Your friend referee will review the photo.</p>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900" role="alert"><strong className="block">Object check unavailable</strong>{error}<button type="button" onClick={() => setRetryKey((value) => value + 1)} className="mt-1.5 block font-bold text-[#0070ba] underline underline-offset-2">Try again</button></div>}

      {finding && status === 'complete' && <div className="space-y-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3" aria-live="polite">
        <p className="text-xs font-bold text-emerald-900">Object evidence ready for referee review</p>
        {supportedElements.map((element) => {
          const score = finding.element_confidences[element] || 0;
          const detected = score >= minimumConfidence;
          return <div key={element} className="flex items-center justify-between gap-3 text-[11px] text-slate-700"><span>{detected ? '✓' : '!'} {element}</span><span className={`font-mono font-bold ${detected ? 'text-emerald-800' : 'text-amber-800'}`}>{Math.round(score * 100)}%</span></div>;
        })}
      </div>}
    </section>
  );
}
