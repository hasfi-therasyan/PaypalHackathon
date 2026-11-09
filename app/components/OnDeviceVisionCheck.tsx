'use client';

import { useEffect, useState } from 'react';
import {
  ON_DEVICE_VISION_MODEL,
  type OnDeviceVisionFinding,
} from '@/app/lib/proofs/on-device-vision';

type VisionPrediction = { label: string; score: number };
type LocalClassifier = (
  image: File,
  labels: string[],
  options: { hypothesis_template: string }
) => Promise<VisionPrediction[]>;
type LocalPipelineFactory = (
  task: 'zero-shot-image-classification',
  model: string,
  options: { progress_callback: (progress: { status?: string; progress?: number }) => void }
) => Promise<LocalClassifier>;

let classifierPromise: Promise<LocalClassifier> | null = null;

function describeVisionError(cause: unknown) {
  const message = cause instanceof Error ? cause.message.toLowerCase() : '';

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You appear to be offline. Reconnect, then try the private AI check again. You can still submit this photo for friend review now.';
  }

  if (/fetch|network|download|load.*model|cors/.test(message)) {
    return 'The private AI model could not download. Check your connection or browser privacy blocker, then try again. You can still submit this photo for friend review.';
  }

  if (/webassembly|wasm|not supported|unsupported/.test(message)) {
    return 'This browser cannot run the private AI model. You can still submit this photo for friend review.';
  }

  return 'The private AI check could not start. Try again, or submit this photo for friend review.';
}

export function OnDeviceVisionCheck({
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
  const [status, setStatus] = useState<'idle' | 'loading' | 'complete' | 'unavailable'>('idle');
  const [progress, setProgress] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finding, setFinding] = useState<OnDeviceVisionFinding | null>(null);

  useEffect(() => {
    setStatus('idle');
    setProgress(null);
    setProgressPercent(null);
    setError(null);
    setFinding(null);
    onFinding(null);
  }, [image, onFinding]);

  async function analyze() {
    if (!image) return;
    const labels = Array.from(new Set(requiredElements.map((item) => item.trim()).filter(Boolean)));
    if (!labels.length) {
      setStatus('unavailable');
      setError('This rubric has no scene elements for the on-device model to check. You can still send the photo to your referee.');
      return;
    }

    setStatus('loading');
    setProgress('Preparing private, on-device analysis…');
    setProgressPercent(null);
    setError(null);
    setFinding(null);
    onFinding(null);

    try {
      if (!classifierPromise) {
        const { pipeline } = await import('@huggingface/transformers');
        const createLocalPipeline = pipeline as unknown as LocalPipelineFactory;
        classifierPromise = createLocalPipeline('zero-shot-image-classification', ON_DEVICE_VISION_MODEL, {
          progress_callback: (event) => {
            setProgress(event.status || 'Loading local vision model');
            setProgressPercent(typeof event.progress === 'number' ? Math.round(event.progress) : null);
          },
        });
      }

      const classifier = await classifierPromise;
      setProgress('Checking the rubric elements in your photo…');
      const predictions = await classifier(image, labels, {
        hypothesis_template: 'This is a photo containing {}.',
      });
      const elementConfidences: Record<string, number> = Object.fromEntries(
        predictions.map((prediction) => [prediction.label, Number(prediction.score.toFixed(4))])
      );
      const result: OnDeviceVisionFinding = {
        provider: 'transformers.js',
        model: ON_DEVICE_VISION_MODEL,
        ran_locally: true,
        analyzed_at: new Date().toISOString(),
        scene_elements: labels.filter((label) => (elementConfidences[label] || 0) >= 0.5),
        element_confidences: elementConfidences,
        confidence: Math.max(...Object.values(elementConfidences), 0),
      };
      setFinding(result);
      onFinding(result);
      setStatus('complete');
      setProgress('On-device analysis complete. Your referee makes the final decision.');
      setProgressPercent(100);
    } catch (cause) {
      console.warn('On-device vision unavailable', cause);
      // A rejected cached promise would otherwise make every retry fail until
      // the entire page is reloaded. The browser may still reuse downloaded
      // model files on the next attempt.
      classifierPromise = null;
      setStatus('unavailable');
      setProgress(null);
      setProgressPercent(null);
      setError(describeVisionError(cause));
    }
  }

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-3" aria-labelledby="onDeviceVisionTitle">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="onDeviceVisionTitle" className="font-bold text-[#003087]">Private AI photo check</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
            A vision model checks the rubric elements on this device. No LLM API key is used; your referee still makes the final decision.
          </p>
        </div>
        <span className="w-fit rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-bold text-[#0070ba]">ON-DEVICE</span>
      </div>

      <div className="flex flex-wrap gap-1.5" aria-label="Required photo elements">
        {requiredElements.map((element) => (
          <span key={element} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700">{element}</span>
        ))}
      </div>

      {status !== 'complete' && (
        <button
          type="button"
          onClick={analyze}
          disabled={!image || status === 'loading'}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#0070ba] bg-white px-3 py-2.5 text-xs font-bold text-[#003087] transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'loading' ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0070ba]/30 border-t-[#0070ba]" /><span>{progress || 'Loading local model…'}</span></> : <span>{status === 'unavailable' ? 'Try private AI check again' : 'Analyze photo privately on this device'}</span>}
        </button>
      )}

      {status === 'loading' && (
        <div className="space-y-1" aria-live="polite">
          <div className="h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-[#0070ba] transition-[width]" style={{ width: `${progressPercent ?? 12}%` }} /></div>
          <p className="text-[10px] text-slate-600">{progressPercent !== null ? `${progressPercent}% downloaded or prepared` : 'First use may take a moment; later checks use the browser cache.'}</p>
        </div>
      )}

      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900" role="alert"><strong className="block">AI check unavailable</strong>{error}</div>}

      {finding && (
        <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3" aria-live="polite">
          <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-emerald-900">AI evidence ready for referee review</p><span className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-800">LOCAL RESULT</span></div>
          <div className="space-y-1.5">
            {requiredElements.map((element) => {
              const score = finding.element_confidences[element] || 0;
              const isStrong = score >= minimumConfidence;
              return <div key={element} className="flex items-center justify-between gap-3 text-[11px] text-slate-700"><span className="min-w-0 truncate">{isStrong ? '✓' : '!'} {element}</span><span className={`shrink-0 font-mono font-bold ${isStrong ? 'text-emerald-800' : 'text-amber-800'}`}>{Math.round(score * 100)}%</span></div>;
            })}
          </div>
          <p className="text-[10px] leading-relaxed text-emerald-900">Threshold: {Math.round(minimumConfidence * 100)}%. Weak or missing evidence goes to your referee—no automatic capture occurs.</p>
          <button type="button" onClick={analyze} className="text-[11px] font-bold text-[#0070ba] underline underline-offset-2">Run analysis again</button>
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-slate-500">The model runs in your browser. The submitted proof photo is still stored privately so your assigned referee can inspect it.</p>
    </section>
  );
}
