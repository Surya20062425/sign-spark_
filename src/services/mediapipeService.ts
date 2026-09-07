import { HandLandmark, RecognitionResult, SignDefinition } from '../types';

// Declare global MediaPipe types
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export class MediaPipeService {
  private handsInstance: any = null;
  private isModelLoaded: boolean = false;
  private isLoading: boolean = false;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private motionHistory: { time: number; x: number; y: number }[] = [];
  private isRunning: boolean = false;

  public async loadMediaPipe(): Promise<boolean> {
    if (this.isModelLoaded && this.handsInstance) return true;
    if (this.isLoading) {
      // Wait for existing load
      let count = 0;
      while (this.isLoading && count < 50) {
        await new Promise((r) => setTimeout(r, 100));
        count++;
      }
      return this.isModelLoaded;
    }
    this.isLoading = true;

    try {
      // Load MediaPipe Hands script
      if (!window.Hands) {
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.min.js');
      }

      if (window.Hands) {
        this.handsInstance = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
        });

        this.handsInstance.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        this.isModelLoaded = true;
        this.isLoading = false;
        return true;
      }
    } catch (err) {
      console.warn('MediaPipe primary CDN load failed, trying fallback:', err);
      try {
        if (!window.Hands) {
          await this.loadScript('https://unpkg.com/@mediapipe/hands@0.4.1675469240/hands.js');
        }
        if (window.Hands) {
          this.handsInstance = new window.Hands({
            locateFile: (file: string) => `https://unpkg.com/@mediapipe/hands@0.4.1675469240/${file}`,
          });
          this.handsInstance.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          this.isModelLoaded = true;
          this.isLoading = false;
          return true;
        }
      } catch (fallbackErr) {
        console.error('MediaPipe fallback CDN also failed:', fallbackErr);
      }
    }

    this.isLoading = false;
    return false;
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  }

  public async startCamera(
    videoElement: HTMLVideoElement,
    onResultsCallback: (landmarks: HandLandmark[] | null) => void
  ): Promise<{ success: boolean; error?: 'permission_denied' | 'no_camera' | 'model_failed' | 'unknown' }> {
    this.stopCamera();

    try {
      const modelReady = await this.loadMediaPipe();
      if (!modelReady || !this.handsInstance) {
        console.warn('MediaPipe Hands could not be initialized from CDN');
        return { success: false, error: 'model_failed' };
      }

      // Check mediaDevices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { success: false, error: 'no_camera' };
      }

      // 1. Acquire camera stream with flexible constraints
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch (firstErr: any) {
        if (firstErr?.name === 'NotAllowedError' || firstErr?.name === 'PermissionDeniedError' || firstErr?.message?.toLowerCase().includes('permission')) {
          return { success: false, error: 'permission_denied' };
        }
        if (firstErr?.name === 'NotFoundError' || firstErr?.name === 'DevicesNotFoundError') {
          return { success: false, error: 'no_camera' };
        }
        // Fallback to minimal video constraint
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (secondErr: any) {
          if (secondErr?.name === 'NotAllowedError' || secondErr?.name === 'PermissionDeniedError' || secondErr?.message?.toLowerCase().includes('permission')) {
            return { success: false, error: 'permission_denied' };
          }
          if (secondErr?.name === 'NotFoundError' || secondErr?.name === 'DevicesNotFoundError') {
            return { success: false, error: 'no_camera' };
          }
          return { success: false, error: 'unknown' };
        }
      }

      if (!stream) {
        return { success: false, error: 'no_camera' };
      }

      this.stream = stream;
      videoElement.srcObject = stream;

      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play().then(() => resolve()).catch(() => resolve());
        };
      });

      // 2. Set up MediaPipe results callback
      this.handsInstance.onResults((results: any) => {
        if (!this.isRunning) return;
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const raw = results.multiHandLandmarks[0];
          const landmarks: HandLandmark[] = raw.map((lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z || 0,
          }));
          onResultsCallback(landmarks);
        } else {
          onResultsCallback(null);
        }
      });

      this.isRunning = true;

      // 3. High-efficiency frame processing loop
      let isProcessing = false;
      const processLoop = async () => {
        if (!this.isRunning) return;

        if (
          !isProcessing &&
          this.handsInstance &&
          videoElement &&
          videoElement.readyState >= 2 &&
          videoElement.videoWidth > 0
        ) {
          isProcessing = true;
          try {
            await this.handsInstance.send({ image: videoElement });
          } catch (err) {
            // Ignore minor frame drop
          } finally {
            isProcessing = false;
          }
        }

        if (this.isRunning) {
          this.animationFrameId = requestAnimationFrame(processLoop);
        }
      };

      this.animationFrameId = requestAnimationFrame(processLoop);
      return { success: true };
    } catch (err: any) {
      console.warn('Camera initialization notification:', err?.message || err);
      this.stopCamera();
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || err?.message?.toLowerCase().includes('permission')) {
        return { success: false, error: 'permission_denied' };
      }
      return { success: false, error: 'unknown' };
    }
  }

  public stopCamera() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // Ignored
        }
      });
      this.stream = null;
    }
    this.motionHistory = [];
  }

  // Draw minimalist sleek skeleton on canvas
  public drawMinimalSkeleton(
    ctx: CanvasRenderingContext2D,
    landmarks: HandLandmark[],
    confidence: number,
    isMatched: boolean,
    width: number,
    height: number
  ) {
    ctx.clearRect(0, 0, width, height);

    // MediaPipe Hand connections (21 landmarks)
    const connections = [
      // Palm & Wrist
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [5, 9], [9, 10], [10, 11], [11, 12], // Middle
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring
      [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [0, 17], // Wrist to Pinky base
    ];

    let strokeColor = 'rgba(255, 255, 255, 0.4)';
    let lineWidth = 2.5;

    if (isMatched) {
      strokeColor = '#34D399'; // Vibrant Emerald
      lineWidth = 4;
    } else if (confidence >= 0.65) {
      strokeColor = '#FBBF24'; // Amber Close
      lineWidth = 3;
    }

    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    connections.forEach(([start, end]) => {
      const p1 = landmarks[start];
      const p2 = landmarks[end];
      if (p1 && p2) {
        ctx.beginPath();
        // Mirrored coordinate system for natural selfie view
        const x1 = (1 - p1.x) * width;
        const y1 = p1.y * height;
        const x2 = (1 - p2.x) * width;
        const y2 = p2.y * height;

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    // Fingertips and wrist key points
    const keyJoints = [0, 4, 8, 12, 16, 20];
    keyJoints.forEach((idx) => {
      const p = landmarks[idx];
      if (p) {
        const x = (1 - p.x) * width;
        const y = p.y * height;
        ctx.beginPath();
        ctx.arc(x, y, isMatched ? 5 : (confidence >= 0.65 ? 4 : 3), 0, 2 * Math.PI);
        ctx.fillStyle = isMatched ? '#34D399' : (confidence >= 0.65 ? '#FBBF24' : '#FFFFFF');
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  // Robust, kinematically calibrated ASL sign evaluation
  public evaluateSign(landmarks: HandLandmark[] | null, targetSign: SignDefinition): RecognitionResult {
    if (!landmarks || landmarks.length < 21) {
      return {
        matched: false,
        confidence: 0,
        feedback: 'no_hand',
        details: 'Show your hand clearly in front of the camera',
      };
    }

    const wrist = landmarks[0];
    const thumbCmc = landmarks[1];
    const thumbMcp = landmarks[2];
    const thumbIp = landmarks[3];
    const thumbTip = landmarks[4];

    const indexMcp = landmarks[5];
    const indexPip = landmarks[6];
    const indexDip = landmarks[7];
    const indexTip = landmarks[8];

    const middleMcp = landmarks[9];
    const middlePip = landmarks[10];
    const middleDip = landmarks[11];
    const middleTip = landmarks[12];

    const ringMcp = landmarks[13];
    const ringPip = landmarks[14];
    const ringDip = landmarks[15];
    const ringTip = landmarks[16];

    const pinkyMcp = landmarks[17];
    const pinkyPip = landmarks[18];
    const pinkyDip = landmarks[19];
    const pinkyTip = landmarks[20];

    // Palm scale: wrist (0) to middle finger base (9)
    const palmScale = Math.max(0.08, Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y));

    // Distance function normalized by palm scale
    const dist = (p1: HandLandmark, p2: HandLandmark) =>
      Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z - p2.z) * 0.6) / palmScale;

    // Helper: calculate continuous finger extension ratio (1.0 = fully open, 0.0 = fully curled)
    const calcFingerExtension = (mcp: HandLandmark, pip: HandLandmark, tip: HandLandmark): number => {
      const tipWristDist = dist(tip, wrist);
      const pipWristDist = dist(pip, wrist);
      const tipMcpDist = dist(tip, mcp);
      const pipMcpDist = dist(pip, mcp);

      const ratioWrist = tipWristDist / Math.max(0.1, pipWristDist);
      const ratioMcp = tipMcpDist / Math.max(0.1, pipMcpDist);

      // Blend metrics
      const score = Math.max(0, Math.min(1, (ratioWrist - 0.95) / 0.35 * 0.6 + (ratioMcp - 1.1) / 0.6 * 0.4));
      return score;
    };

    const indexExtScore = calcFingerExtension(indexMcp, indexPip, indexTip);
    const middleExtScore = calcFingerExtension(middleMcp, middlePip, middleTip);
    const ringExtScore = calcFingerExtension(ringMcp, ringPip, ringTip);
    const pinkyExtScore = calcFingerExtension(pinkyMcp, pinkyPip, pinkyTip);

    const isIndexExt = indexExtScore >= 0.52;
    const isMiddleExt = middleExtScore >= 0.52;
    const isRingExt = ringExtScore >= 0.52;
    const isPinkyExt = pinkyExtScore >= 0.52;

    // Thumb extension analysis
    const thumbPinkyMcpDist = dist(thumbTip, pinkyMcp);
    const thumbIndexMcpDist = dist(thumbTip, indexMcp);
    const thumbRingMcpDist = dist(thumbTip, ringMcp); // palm center
    const isThumbExt = thumbPinkyMcpDist > 0.95 && thumbIndexMcpDist > 0.52;

    // Joint distances for special ASL letter shapes
    const thumbIndexTipDist = dist(thumbTip, indexTip);
    const thumbMiddleTipDist = dist(thumbTip, middleTip);
    const indexMiddleTipDist = dist(indexTip, middleTip);
    const middleRingTipDist = dist(middleTip, ringTip);
    const ringPinkyTipDist = dist(ringTip, pinkyTip);

    let matchScore = 0;
    let maxChecks = 0;
    let specificFeedback = targetSign.instruction;

    const addMetric = (condition: boolean, weight: number = 1.0) => {
      maxChecks += weight;
      if (condition) matchScore += weight;
    };

    const id = targetSign.id;

    // ==========================================
    // SPECIFIC ASL SIGN GEOMETRIC CLASSIFICATION
    // ==========================================
    if (id === 'sign_a') {
      // 4 fingers curled into fist, thumb upright along side
      addMetric(!isIndexExt, 2.0);
      addMetric(!isMiddleExt, 2.0);
      addMetric(!isRingExt, 1.5);
      addMetric(!isPinkyExt, 1.5);
      addMetric(thumbIndexMcpDist < 0.65, 2.0);
      addMetric(thumbPinkyMcpDist > 0.65, 1.5); // Thumb not crossed inside palm
      if (isIndexExt || isMiddleExt) specificFeedback = 'Close all fingers into a tight fist';
      else if (thumbIndexMcpDist >= 0.65) specificFeedback = 'Keep thumb upright resting along index knuckle';
    } else if (id === 'sign_b') {
      // 4 fingers straight together, thumb folded over palm
      addMetric(isIndexExt, 2.0);
      addMetric(isMiddleExt, 2.0);
      addMetric(isRingExt, 2.0);
      addMetric(isPinkyExt, 2.0);
      addMetric(indexMiddleTipDist < 0.55, 1.5); // fingers together
      addMetric(thumbRingMcpDist < 0.75, 2.0); // thumb tucked
      if (!isIndexExt || !isMiddleExt || !isRingExt || !isPinkyExt) {
        specificFeedback = 'Extend all 4 fingers straight up together';
      } else if (indexMiddleTipDist >= 0.55) {
        specificFeedback = 'Keep 4 fingers touching side-by-side';
      }
    } else if (id === 'sign_c') {
      // C shape arc
      const fingersCurved = indexExtScore > 0.2 && indexExtScore < 0.85 && middleExtScore > 0.2 && middleExtScore < 0.85;
      addMetric(fingersCurved, 3.0);
      addMetric(thumbIndexTipDist > 0.35 && thumbIndexTipDist < 1.1, 3.0);
      specificFeedback = 'Curve your fingers and thumb to form a C-cup shape';
    } else if (id === 'sign_d') {
      // Index straight up, middle+ring+pinky touch thumb in a circle
      addMetric(isIndexExt, 3.0);
      addMetric(!isMiddleExt, 2.0);
      addMetric(!isRingExt, 1.5);
      addMetric(!isPinkyExt, 1.5);
      addMetric(thumbMiddleTipDist < 0.65 || thumbIndexTipDist < 0.75, 2.5);
      if (!isIndexExt) specificFeedback = 'Point index finger straight up';
      else specificFeedback = 'Curl middle, ring, and pinky to touch your thumb tip';
    } else if (id === 'sign_e') {
      // All 4 curled down onto folded thumb
      addMetric(!isIndexExt, 2.0);
      addMetric(!isMiddleExt, 2.0);
      addMetric(!isRingExt, 2.0);
      addMetric(!isPinkyExt, 2.0);
      addMetric(dist(indexTip, wrist) < 1.0, 2.0);
      specificFeedback = 'Curl all 4 fingertips down tightly onto your palm/thumb';
    } else if (id === 'sign_f') {
      // OK sign (thumb + index touch, other 3 extended up)
      addMetric(thumbIndexTipDist < 0.45, 3.5);
      addMetric(isMiddleExt, 2.0);
      addMetric(isRingExt, 2.0);
      addMetric(isPinkyExt, 2.0);
      if (thumbIndexTipDist >= 0.45) specificFeedback = 'Pinch index and thumb tips together (OK sign)';
      else specificFeedback = 'Extend middle, ring, and pinky tall';
    } else if (id === 'sign_g') {
      // Index & thumb horizontal caliper, other 3 curled
      addMetric(isIndexExt || dist(indexTip, indexMcp) > 0.65, 3.0);
      addMetric(!isMiddleExt, 2.0);
      addMetric(!isRingExt, 1.5);
      addMetric(!isPinkyExt, 1.5);
      addMetric(thumbIndexTipDist < 0.85, 2.0);
      specificFeedback = 'Point index and thumb horizontally across like a caliper';
    } else if (id === 'sign_h') {
      // Index & Middle together horizontally, ring and pinky curled
      addMetric(isIndexExt || dist(indexTip, indexMcp) > 0.65, 2.5);
      addMetric(isMiddleExt || dist(middleTip, middleMcp) > 0.65, 2.5);
      addMetric(!isRingExt, 2.0);
      addMetric(!isPinkyExt, 2.0);
      addMetric(indexMiddleTipDist < 0.45, 2.0);
      specificFeedback = 'Extend index and middle fingers together sideways';
    } else if (id === 'sign_i') {
      // Pinky straight up, other 3 curled
      addMetric(isPinkyExt, 4.0);
      addMetric(!isIndexExt, 2.0);
      addMetric(!isMiddleExt, 2.0);
      addMetric(!isRingExt, 2.0);
      if (!isPinkyExt) specificFeedback = 'Extend your pinky finger straight up';
      else specificFeedback = 'Curl index, middle, and ring into a tight fist';
    } else if (id === 'sign_j') {
      // Pinky straight up + J motion
      addMetric(isPinkyExt, 3.0);
      addMetric(!isIndexExt, 1.5);
      addMetric(!isMiddleExt, 1.5);
      specificFeedback = 'Extend pinky and trace a J-curve in the air';
    } else if (id === 'sign_k') {
      // Index up, Middle forward/up, thumb in between
      addMetric(isIndexExt, 3.0);
      addMetric(middleExtScore > 0.4, 2.5);
      addMetric(!isRingExt, 2.0);
      addMetric(!isPinkyExt, 2.0);
      specificFeedback = 'Index straight up, middle tilted forward, thumb between knuckles';
    } else if (id === 'sign_l') {
      // L shape (Index up, thumb wide at 90 deg)
      addMetric(isIndexExt, 3.5);
      addMetric(isThumbExt, 3.5);
      addMetric(!isMiddleExt, 2.0);
      addMetric(!isRingExt, 1.5);
      addMetric(!isPinkyExt, 1.5);
      if (!isIndexExt) specificFeedback = 'Point index finger straight up';
      else if (!isThumbExt) specificFeedback = 'Stick thumb out wide to form a sharp 90° L';
      else specificFeedback = 'Curl middle, ring, and pinky into your palm';
    } else if (id === 'sign_m' || id === 'sign_n' || id === 'sign_s' || id === 'sign_t') {
      // Fist variants
      addMetric(!isIndexExt, 2.5);
      addMetric(!isMiddleExt, 2.5);
      addMetric(!isRingExt, 2.0);
      addMetric(!isPinkyExt, 2.0);
      if (id === 'sign_s') addMetric(thumbRingMcpDist < 0.65, 2.0);
      specificFeedback = 'Close fingers into a fist with thumb wrapped across';
    } else if (id === 'sign_o') {
      // O shape (all fingertips meet thumb tip in a circle)
      addMetric(thumbIndexTipDist < 0.50, 3.0);
      addMetric(thumbMiddleTipDist < 0.55, 3.0);
      specificFeedback = 'Curve all fingertips to touch thumb tip in an O circle';
    } else if (id === 'sign_p') {
      // K pointing down
      addMetric(isIndexExt || dist(indexTip, indexMcp) > 0.6, 3.0);
      addMetric(!isRingExt, 2.0);
      addMetric(!isPinkyExt, 2.0);
      specificFeedback = 'Make a K shape and point hand downward';
    } else if (id === 'sign_q') {
      // G pointing down
      addMetric(dist(indexTip, indexMcp) > 0.55, 3.0);
      addMetric(!isMiddleExt, 2.0);
      addMetric(!isPinkyExt, 2.0);
      specificFeedback = 'Make a G pinch and point downward';
    } else if (id === 'sign_r') {
      // Index and Middle crossed
      addMetric(isIndexExt, 2.5);
      addMetric(isMiddleExt, 2.5);
      addMetric(!isRingExt, 2.0);
      addMetric(!isPinkyExt, 2.0);
      addMetric(indexMiddleTipDist < 0.35, 3.0);
      specificFeedback = 'Cross your middle finger over your index finger';
    } else if (id === 'sign_u') {
      // Index & Middle straight up together (no space)
      addMetric(isIndexExt, 3.0);
      addMetric(isMiddleExt, 3.0);
      addMetric(!isRingExt, 2.0);
      addMetric(!isPinkyExt, 2.0);
      addMetric(indexMiddleTipDist < 0.38, 3.0);
      if (indexMiddleTipDist >= 0.38) specificFeedback = 'Keep index and middle fingers touching (no gap)';
      else specificFeedback = 'Extend index and middle straight up together';
    } else if (id === 'sign_v' || id === 'sign_2') {
      // V / 2 Peace sign (Index & Middle spread wide)
      addMetric(isIndexExt, 3.0);
      addMetric(isMiddleExt, 3.0);
      addMetric(!isRingExt, 2.0);
      addMetric(!isPinkyExt, 2.0);
      addMetric(indexMiddleTipDist >= 0.35, 3.0);
      if (indexMiddleTipDist < 0.35) specificFeedback = 'Spread index and middle fingers apart into a V';
      else specificFeedback = 'Extend index and middle in a peace sign V';
    } else if (id === 'sign_w' || id === 'sign_3' || id === 'sign_water') {
      // W (Index, Middle, Ring extended)
      addMetric(isIndexExt, 2.5);
      addMetric(isMiddleExt, 2.5);
      addMetric(isRingExt, 2.5);
      addMetric(!isPinkyExt, 2.5);
      specificFeedback = 'Extend 3 fingers (index, middle, ring) spread apart';
    } else if (id === 'sign_x') {
      // Index hook
      addMetric(indexExtScore > 0.25 && indexExtScore < 0.75, 3.5);
      addMetric(!isMiddleExt, 2.0);
      addMetric(!isRingExt, 1.5);
      addMetric(!isPinkyExt, 1.5);
      specificFeedback = 'Bend index finger into a hooked shape';
    } else if (id === 'sign_y') {
      // Shaka (Thumb + Pinky wide, middle 3 curled)
      addMetric(isThumbExt, 3.5);
      addMetric(isPinkyExt, 3.5);
      addMetric(!isIndexExt, 2.5);
      addMetric(!isMiddleExt, 2.5);
      addMetric(!isRingExt, 2.5);
      if (!isThumbExt || !isPinkyExt) specificFeedback = 'Extend thumb and pinky wide apart (shaka sign)';
      else specificFeedback = 'Keep middle 3 fingers curled into palm';
    } else if (id === 'sign_z') {
      // Index pointing for Z trace
      addMetric(isIndexExt, 3.5);
      addMetric(!isMiddleExt, 2.0);
      addMetric(!isRingExt, 1.5);
      addMetric(!isPinkyExt, 1.5);
      specificFeedback = 'Point index and trace a Z pattern in the air';
    } else if (id === 'sign_1' || id === 'sign_you' || id === 'sign_meet') {
      // 1 / You / Meet (Index only)
      addMetric(isIndexExt, 4.0);
      addMetric(!isMiddleExt, 2.0);
      addMetric(!isRingExt, 2.0);
      addMetric(!isPinkyExt, 2.0);
      specificFeedback = 'Extend only index finger straight up / forward';
    } else if (id === 'sign_4') {
      // 4 fingers extended, thumb folded
      addMetric(isIndexExt, 2.0);
      addMetric(isMiddleExt, 2.0);
      addMetric(isRingExt, 2.0);
      addMetric(isPinkyExt, 2.0);
      addMetric(!isThumbExt, 2.0);
      specificFeedback = 'Extend 4 fingers up with thumb folded across palm';
    } else if (id === 'sign_5' || id === 'sign_hello' || id === 'sign_awesome' || id === 'sign_morning') {
      // 5 / Hello / Awesome / Open Palm
      addMetric(isIndexExt, 2.0);
      addMetric(isMiddleExt, 2.0);
      addMetric(isRingExt, 2.0);
      addMetric(isPinkyExt, 2.0);
      addMetric(isThumbExt, 2.0);
      specificFeedback = 'Open all 5 fingers spread wide';
    } else if (id === 'sign_love') {
      // I-L-Y (Thumb, Index, Pinky extended; Middle, Ring curled)
      addMetric(isThumbExt, 3.0);
      addMetric(isIndexExt, 3.0);
      addMetric(isPinkyExt, 3.0);
      addMetric(!isMiddleExt, 2.5);
      addMetric(!isRingExt, 2.5);
      if (!isThumbExt || !isIndexExt || !isPinkyExt) {
        specificFeedback = 'Extend thumb, index, AND pinky simultaneously';
      } else {
        specificFeedback = 'Keep middle and ring fingers curled down';
      }
    } else {
      // Generic fallback config matching
      const target = targetSign.fingerConfig;
      addMetric(isThumbExt === Boolean(target.thumb), 1.5);
      addMetric(isIndexExt === Boolean(target.index), 2.0);
      addMetric(isMiddleExt === Boolean(target.middle), 2.0);
      addMetric(isRingExt === Boolean(target.ring), 1.5);
      addMetric(isPinkyExt === Boolean(target.pinky), 1.5);
    }

    // Motion evaluation for dynamic signs
    if (targetSign.motion) {
      const now = Date.now();
      const trackingPoint = id === 'sign_j' ? pinkyTip : (id === 'sign_z' ? indexTip : wrist);
      this.motionHistory.push({ time: now, x: trackingPoint.x, y: trackingPoint.y });
      this.motionHistory = this.motionHistory.filter((p) => now - p.time < 1600);

      if (this.motionHistory.length > 4) {
        const dx = Math.abs(this.motionHistory[this.motionHistory.length - 1].x - this.motionHistory[0].x);
        const dy = Math.abs(this.motionHistory[this.motionHistory.length - 1].y - this.motionHistory[0].y);
        if (dx + dy > 0.06) {
          matchScore += 2.0;
        }
      }
      maxChecks += 2.0;
    }

    const rawConfidence = maxChecks > 0 ? matchScore / maxChecks : 0.5;
    const confidence = Math.min(0.99, Math.max(0.05, rawConfidence));

    // Dynamic calibrated threshold (forgiving yet distinct)
    const threshold = Math.min(0.72, Math.max(0.60, targetSign.tolerance || 0.68));
    const isMatched = confidence >= threshold;

    let feedback: 'match' | 'close' | 'try_again' | 'no_hand' = 'try_again';
    let details = specificFeedback;

    if (isMatched) {
      feedback = 'match';
      details = 'Excellent! Hold steady';
    } else if (confidence >= 0.55) {
      feedback = 'close';
      details = specificFeedback || 'Almost there! Adjust slightly';
    }

    return {
      matched: isMatched,
      confidence: Math.round(confidence * 100) / 100,
      feedback,
      details,
      landmarks,
      fingerStates: {
        thumb: isThumbExt,
        index: isIndexExt,
        middle: isMiddleExt,
        ring: isRingExt,
        pinky: isPinkyExt,
      },
    };
  }
}

export const mediaPipeService = new MediaPipeService();
