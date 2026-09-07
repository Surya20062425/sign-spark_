import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HandLandmark, RecognitionResult, SignDefinition } from '../types';
import { mediaPipeService } from '../services/mediapipeService';
import { audio } from '../services/audioService';
import { Camera, RefreshCw, Eye, X, Check, AlertCircle } from 'lucide-react';
import { HandSilhouetteDemo } from './HandSilhouetteDemo';

interface DetectionScreenProps {
  sign: SignDefinition;
  onSuccess: (attempts: number, confidence: number) => void;
  onFallbackToQuiz: () => void;
  onCancel: () => void;
  currentAttempt?: number;
}

export const DetectionScreen: React.FC<DetectionScreenProps> = ({
  sign,
  onSuccess,
  onFallbackToQuiz,
  onCancel,
  currentAttempt = 1,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoadingCamera, setIsLoadingCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isHoldingMatch, setIsHoldingMatch] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0.0 to 1.0
  const [feedbackDetails, setFeedbackDetails] = useState<string>(sign.instruction);
  const [feedbackState, setFeedbackState] = useState<'match' | 'close' | 'try_again' | 'no_hand'>('no_hand');
  const [fingerStates, setFingerStates] = useState<{
    thumb?: boolean;
    index?: boolean;
    middle?: boolean;
    ring?: boolean;
    pinky?: boolean;
  }>({});
  const [showThumbRef, setShowThumbRef] = useState(false);
  const [attempts] = useState(currentAttempt);

  // References for continuous frame accumulation
  const holdProgressRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(Date.now());
  const handCenterRef = useRef<{ x: number; y: number } | null>(null);
  const hasFinishedRef = useRef<boolean>(false);
  const isMatchDingPlayedRef = useRef<boolean>(false);

  // Frame evaluation handler
  const handleDetectionFrame = useCallback(
    (landmarks: HandLandmark[] | null) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const now = Date.now();
      const deltaMs = Math.min(100, Math.max(10, now - lastFrameTimeRef.current));
      lastFrameTimeRef.current = now;

      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Match canvas dimensions to video feed
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      const result: RecognitionResult = mediaPipeService.evaluateSign(landmarks, sign);
      const conf = result.confidence;
      setConfidence(conf);
      setFeedbackState(result.feedback);
      setFeedbackDetails(result.details);
      if (result.fingerStates) {
        setFingerStates(result.fingerStates);
      }

      // Track center of hand for circular hold progress HUD
      if (landmarks && landmarks.length > 0) {
        const wrist = landmarks[0];
        const middle = landmarks[9];
        handCenterRef.current = {
          x: (1 - (wrist.x + middle.x) / 2) * canvas.width,
          y: ((wrist.y + middle.y) / 2) * canvas.height,
        };
      }

      // Responsive Hold Accumulator (800ms required, smoothed with grace decay)
      const REQUIRED_HOLD_MS = 800;

      if (result.matched) {
        if (!isMatchDingPlayedRef.current) {
          audio.playMatchDing();
          isMatchDingPlayedRef.current = true;
        }

        // Higher confidence accelerates hold progress
        const speedMultiplier = conf >= 0.85 ? 1.3 : 1.0;
        const addedProgress = (deltaMs / REQUIRED_HOLD_MS) * speedMultiplier;
        holdProgressRef.current = Math.min(1.0, holdProgressRef.current + addedProgress);

        setHoldProgress(holdProgressRef.current);
        setIsHoldingMatch(true);

        if (holdProgressRef.current >= 1.0 && !hasFinishedRef.current) {
          hasFinishedRef.current = true;
          onSuccess(attempts, conf);
          return;
        }
      } else {
        isMatchDingPlayedRef.current = false;
        // Smooth decay rather than sudden reset to prevent jitter frustration
        if (holdProgressRef.current > 0) {
          holdProgressRef.current = Math.max(0, holdProgressRef.current - (deltaMs / REQUIRED_HOLD_MS) * 0.6);
          setHoldProgress(holdProgressRef.current);
        }
        if (holdProgressRef.current <= 0.05) {
          setIsHoldingMatch(false);
        }
      }

      // Render Skeleton
      if (landmarks) {
        mediaPipeService.drawMinimalSkeleton(
          ctx,
          landmarks,
          conf,
          result.matched,
          canvas.width,
          canvas.height
        );
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    [sign, attempts, onSuccess]
  );

  const startDetection = useCallback(async () => {
    if (!videoRef.current) return;
    setIsLoadingCamera(true);
    setCameraError(null);
    hasFinishedRef.current = false;
    holdProgressRef.current = 0;
    setHoldProgress(0);

    try {
      const res = await mediaPipeService.startCamera(
        videoRef.current,
        (landmarks: HandLandmark[] | null) => {
          if (hasFinishedRef.current) return;
          handleDetectionFrame(landmarks);
        }
      );

      if (!res.success) {
        if (res.error === 'permission_denied') {
          setCameraError('Camera access was not granted by your browser. Please allow camera permissions in your browser settings or play using Watch & Tap mode.');
        } else if (res.error === 'no_camera') {
          setCameraError('No webcam detected on this device. You can enjoy the full lesson with Watch & Tap mode.');
        } else {
          setCameraError('Unable to start the camera stream. Please try again or switch to Watch & Tap mode.');
        }
      }
      setIsLoadingCamera(false);
    } catch {
      setCameraError('Camera access unavailable. You can play using Watch & Tap mode.');
      setIsLoadingCamera(false);
    }
  }, [sign, handleDetectionFrame]);

  useEffect(() => {
    startDetection();

    return () => {
      mediaPipeService.stopCamera();
    };
  }, [startDetection]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07080C] select-none overflow-hidden">
      {/* Optical Viewfinder Corner Brackets */}
      <div className="absolute inset-4 md:inset-8 pointer-events-none z-30 flex flex-col justify-between">
        <div className="flex justify-between w-full">
          <div className="w-6 h-6 border-t-2 border-l-2 border-white/20 rounded-tl-lg" />
          <div className="w-6 h-6 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />
        </div>
        <div className="flex justify-between w-full">
          <div className="w-6 h-6 border-b-2 border-l-2 border-white/20 rounded-bl-lg" />
          <div className="w-6 h-6 border-b-2 border-r-2 border-white/20 rounded-br-lg" />
        </div>
      </div>

      {/* Top Floating Target Sign Tag & Reference Toggle */}
      <div className="absolute top-5 inset-x-4 z-40 flex items-center justify-between max-w-md mx-auto pointer-events-auto">
        <button
          onClick={onCancel}
          className="w-10 h-10 rounded-xl minimal-btn-secondary text-zinc-300 hover:text-white flex items-center justify-center"
          title="Exit Challenge"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl minimal-card shadow-lg">
          <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-widest">
            Target
          </span>
          <span className="text-lg font-black text-white tracking-wider font-mono">
            {sign.aslLetterOrWord}
          </span>
        </div>

        <button
          onClick={() => setShowThumbRef((prev) => !prev)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            showThumbRef
              ? 'minimal-btn-primary'
              : 'minimal-btn-secondary text-zinc-300'
          }`}
          title="Toggle reference preview"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Reference Silhouette Modal / Drawer */}
      {showThumbRef && (
        <div className="absolute top-20 right-4 z-40 animate-fadeIn pointer-events-auto">
          <div className="p-3.5 rounded-2xl minimal-card shadow-2xl border border-white/10 max-w-[160px]">
            <HandSilhouetteDemo sign={sign} size={140} />
            <p className="text-[11px] font-semibold text-center text-zinc-200 mt-2">
              {sign.label}
            </p>
            <p className="text-[10px] text-zinc-400 text-center mt-1 leading-snug">
              {sign.tip}
            </p>
          </div>
        </div>
      )}

      {/* Live Finger Detection Sensor Bar */}
      <div className="absolute top-20 left-4 z-40 flex flex-col gap-1 pointer-events-none">
        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-0.5">
          Fingers
        </span>
        {[
          { label: 'Thumb', active: fingerStates.thumb },
          { label: 'Index', active: fingerStates.index },
          { label: 'Mid', active: fingerStates.middle },
          { label: 'Ring', active: fingerStates.ring },
          { label: 'Pinky', active: fingerStates.pinky },
        ].map((f) => (
          <div
            key={f.label}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-medium transition-colors ${
              f.active
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-black/40 text-zinc-600 border border-white/[0.04]'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                f.active ? 'bg-emerald-400' : 'bg-zinc-700'
              }`}
            />
            {f.label}
          </div>
        ))}
      </div>

      {/* Main Video and Canvas View */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Loading Spinner */}
        {isLoadingCamera && (
          <div className="absolute z-20 flex flex-col items-center gap-3 text-center px-4">
            <div className="w-10 h-10 rounded-full border-2 border-white border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-white">
              Starting Hand Tracking...
            </p>
            <p className="text-xs text-zinc-400">
              Position your hand inside the frame
            </p>
          </div>
        )}

        {/* Camera Permission / Error Dialog */}
        {cameraError && (
          <div className="absolute z-30 max-w-sm p-6 mx-4 rounded-3xl minimal-card text-center shadow-2xl border border-white/10">
            <Camera className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Camera Notice</h3>
            <p className="text-xs text-zinc-300 mb-4 leading-relaxed font-normal">
              {cameraError} You can retry starting the camera, or switch to interactive "Watch & Tap" mode.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={startDetection}
                className="w-full py-3 rounded-xl minimal-btn-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera
              </button>
              <button
                onClick={onFallbackToQuiz}
                className="w-full py-2.5 rounded-xl minimal-btn-secondary font-semibold text-xs text-zinc-300 hover:text-white"
              >
                Play in "Watch & Tap" Mode
              </button>
              <button
                onClick={onCancel}
                className="w-full py-2 text-xs text-zinc-400 hover:text-white"
              >
                Return to Map
              </button>
            </div>
          </div>
        )}

        {/* Mirrored Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover -scale-x-100"
        />

        {/* Canvas Overlay for Hand Skeleton */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none object-cover"
        />

        {/* Dynamic Hold Progress Ring around detected hand */}
        {isHoldingMatch && handCenterRef.current && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 z-20"
            style={{
              left: `${handCenterRef.current.x}px`,
              top: `${handCenterRef.current.y}px`,
            }}
          >
            <svg width="120" height="120" className="rotate-[-90deg] drop-shadow-[0_0_16px_rgba(52,211,153,0.8)]">
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="rgba(10, 12, 18, 0.7)"
                stroke="rgba(52, 211, 153, 0.25)"
                strokeWidth="6"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#34D399"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - holdProgress)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-[#34D399] uppercase tracking-wider font-mono">
              HOLD
            </span>
          </div>
        )}

        {/* Real-time Guidance Banner */}
        <div className="absolute bottom-20 px-4 py-2.5 rounded-2xl minimal-card text-xs font-semibold text-zinc-100 shadow-2xl text-center max-w-sm mx-auto animate-fadeIn border border-white/10 z-30">
          <div className="flex items-center justify-center gap-2">
            {feedbackState === 'match' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{feedbackDetails}</span>
          </div>
        </div>

        {/* Bottom Accuracy Counter & Mode Fallback */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-auto">
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl minimal-card shadow-lg">
            <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-widest">
              Accuracy
            </span>
            <span
              className={`text-sm font-mono font-bold ${
                confidence >= 0.7
                  ? 'text-emerald-400'
                  : confidence >= 0.55
                  ? 'text-amber-400'
                  : 'text-zinc-500'
              }`}
            >
              {Math.round(confidence * 100)}%
            </span>
          </div>

          <button
            onClick={onFallbackToQuiz}
            className="mt-2 text-xs text-zinc-400 hover:text-white transition-colors underline decoration-white/20"
          >
            Switch to Tap Mode
          </button>
        </div>
      </div>
    </div>
  );
};
