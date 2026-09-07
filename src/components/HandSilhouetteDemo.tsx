import React from 'react';
import { SignDefinition } from '../types';

interface HandSilhouetteDemoProps {
  sign: SignDefinition;
  size?: number;
}

export const HandSilhouetteDemo: React.FC<HandSilhouetteDemoProps> = ({ sign, size = 180 }) => {
  const { aslLetterOrWord, fingerConfig, isStatic, motion } = sign;
  const letter = aslLetterOrWord.toUpperCase();
  const isMotion = !isStatic || Boolean(motion);

  // High-fidelity Realistic Gradients & Defs
  const renderDefs = () => (
    <defs>
      {/* 3D Realistic Skin Tone Gradients with Subsurface Warmth */}
      <radialGradient id="skinMain" cx="42%" cy="38%" r="62%">
        <stop offset="0%" stopColor="#FDE3CB" />
        <stop offset="35%" stopColor="#E9B98A" />
        <stop offset="70%" stopColor="#CE9662" />
        <stop offset="100%" stopColor="#9C6234" />
      </radialGradient>

      <linearGradient id="fingerLit" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FEE9D5" />
        <stop offset="25%" stopColor="#EAB789" />
        <stop offset="75%" stopColor="#CD935E" />
        <stop offset="100%" stopColor="#A36737" />
      </linearGradient>

      <linearGradient id="fingerVertLit" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEEAD7" />
        <stop offset="50%" stopColor="#E7B384" />
        <stop offset="85%" stopColor="#C68C57" />
        <stop offset="100%" stopColor="#8C5227" />
      </linearGradient>

      <linearGradient id="fingerFoldedLit" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ECC299" />
        <stop offset="40%" stopColor="#D29966" />
        <stop offset="80%" stopColor="#AB6F3B" />
        <stop offset="100%" stopColor="#75421B" />
      </linearGradient>

      <radialGradient id="knuckleHighlight" cx="45%" cy="40%" r="50%">
        <stop offset="0%" stopColor="#FFF2E5" />
        <stop offset="60%" stopColor="#ECC39A" />
        <stop offset="100%" stopColor="rgba(197, 140, 87, 0)" />
      </radialGradient>

      <linearGradient id="nailGloss" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFF6F2" />
        <stop offset="25%" stopColor="#F8D6CB" />
        <stop offset="75%" stopColor="#ECAFA1" />
        <stop offset="100%" stopColor="#CF8E80" />
      </linearGradient>

      <radialGradient id="contactShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(45, 18, 5, 0.45)" />
        <stop offset="100%" stopColor="rgba(45, 18, 5, 0)" />
      </radialGradient>

      <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>

      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );

  // Common Realistic Anatomy Helpers
  const renderWrist = () => (
    <g id="wrist-section">
      <path
        d="M 74 186 C 73 162, 75 146, 78 138 L 122 138 C 125 146, 127 162, 126 186 Z"
        fill="url(#skinMain)"
        stroke="#845028"
        strokeWidth="1.2"
      />
      {/* Subtle wrist crease & tendon lines */}
      <path d="M 82 158 Q 100 162 118 158" stroke="#945D33" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M 88 170 Q 100 173 112 170" stroke="#945D33" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M 96 142 L 96 176" stroke="#945D33" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.25" />
    </g>
  );

  const renderFingernail = (x: number, y: number, w: number, h: number, rx: number, rotate = 0) => (
    <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
      {/* Nail Plate */}
      <rect x={x} y={y} width={w} height={h} rx={rx} fill="url(#nailGloss)" stroke="#AA7258" strokeWidth="0.6" />
      {/* Lunula (white half-moon at base) */}
      <path
        d={`M ${x + 1.5} ${y + h - 1} Q ${x + w / 2} ${y + h - 3.5} ${x + w - 1.5} ${y + h - 1}`}
        fill="#FFFFFF"
        opacity="0.6"
      />
      {/* Specular Glint */}
      <ellipse cx={x + w / 2 - 1} cy={y + 2.5} rx={w / 3.5} ry="1" fill="#FFFFFF" opacity="0.75" />
    </g>
  );

  const renderCreases = (x1: number, y1: number, x2: number, y2: number) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8C5329" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
  );

  // Custom Specific ASL Letter Renderers for Perfect Realism
  const renderSpecificLetterHand = () => {
    switch (letter) {
      // ----------------------------------------------------
      // ASL 'A' : Fist with upright thumb resting against index knuckle
      // ----------------------------------------------------
      case 'A':
        return (
          <g id="letter-A-pose">
            {renderWrist()}
            {/* Palm base */}
            <path
              d="M 66 140 C 60 120, 60 98, 68 88 C 76 80, 126 80, 134 88 C 140 98, 140 120, 134 140 Z"
              fill="url(#skinMain)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* 4 Curled Fingers in Fist with natural knuckles */}
            {/* Index Folded */}
            <path d="M 72 88 C 72 74, 86 74, 86 88 L 86 112 C 86 118, 72 118, 72 112 Z" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            <circle cx="79" cy="85" r="4.5" fill="url(#knuckleHighlight)" />
            {renderFingernail(74.5, 96, 9, 8, 2.5)}

            {/* Middle Folded */}
            <path d="M 87 85 C 87 71, 101 71, 101 85 L 101 114 C 101 120, 87 120, 87 114 Z" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            <circle cx="94" cy="82" r="4.5" fill="url(#knuckleHighlight)" />
            {renderFingernail(89.5, 96, 9, 8, 2.5)}

            {/* Ring Folded */}
            <path d="M 102 87 C 102 73, 116 73, 116 87 L 116 114 C 116 120, 102 120, 102 114 Z" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            <circle cx="109" cy="84" r="4.5" fill="url(#knuckleHighlight)" />
            {renderFingernail(104.5, 96, 9, 8, 2.5)}

            {/* Pinky Folded */}
            <path d="M 117 92 C 117 80, 129 80, 129 92 L 129 116 C 129 122, 117 122, 117 116 Z" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            <circle cx="123" cy="89" r="4" fill="url(#knuckleHighlight)" />
            {renderFingernail(119, 98, 8, 7, 2)}

            {/* Thumb standing upright along the side of index finger */}
            <path
              d="M 64 136 C 54 124, 48 106, 52 82 C 55 66, 68 66, 72 80 C 74 96, 74 122, 68 136 Z"
              fill="url(#fingerLit)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {renderFingernail(54, 70, 11, 10, 3.5, 8)}
            {renderCreases(55, 94, 69, 96)}
            {renderCreases(58, 114, 70, 116)}
          </g>
        );

      // ----------------------------------------------------
      // ASL 'B' : 4 open flat fingers together straight up, thumb tucked across palm
      // ----------------------------------------------------
      case 'B':
        return (
          <g id="letter-B-pose">
            {renderWrist()}
            {/* Extended Index */}
            <path d="M 72 90 L 72 26 C 72 18, 85 18, 85 26 L 85 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            {renderFingernail(74, 21, 9, 8, 3)}
            {renderCreases(73, 44, 84, 44)}
            {renderCreases(73, 66, 84, 66)}

            {/* Extended Middle */}
            <path d="M 86 90 L 86 16 C 86 8, 99 8, 99 16 L 99 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            {renderFingernail(88, 11, 9, 8.5, 3)}
            {renderCreases(87, 38, 98, 38)}
            {renderCreases(87, 62, 98, 62)}

            {/* Extended Ring */}
            <path d="M 100 90 L 100 22 C 100 14, 113 14, 113 22 L 113 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            {renderFingernail(102, 17, 9, 8, 3)}
            {renderCreases(101, 42, 112, 42)}
            {renderCreases(101, 65, 112, 65)}

            {/* Extended Pinky */}
            <path d="M 114 90 L 114 36 C 114 28, 126 28, 126 36 L 126 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            {renderFingernail(116, 31, 8, 7.5, 2.5)}
            {renderCreases(115, 52, 125, 52)}
            {renderCreases(115, 71, 125, 71)}

            {/* Palm base */}
            <path
              d="M 66 140 C 60 120, 62 98, 70 88 C 76 84, 126 84, 132 88 C 140 98, 140 120, 134 140 Z"
              fill="url(#skinMain)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* Thumb tucked horizontally across lower palm */}
            <path
              d="M 64 134 C 74 116, 92 114, 108 120 C 112 126, 106 134, 94 136 C 80 138, 68 142, 64 134 Z"
              fill="url(#fingerFoldedLit)"
              stroke="#78441D"
              strokeWidth="1.2"
            />
            {renderFingernail(101, 120, 8, 7, 2.5, -20)}
            {renderCreases(78, 124, 82, 136)}
          </g>
        );

      // ----------------------------------------------------
      // ASL 'C' : Clean curved hand profile forming a smooth 'C' arc
      // ----------------------------------------------------
      case 'C':
        return (
          <g id="letter-C-pose">
            {renderWrist()}
            {/* Palm body in semi-profile */}
            <path
              d="M 80 142 C 68 126, 64 100, 72 82 C 80 66, 104 64, 120 70 C 132 75, 136 85, 128 92 C 118 100, 100 102, 94 114 C 90 122, 96 134, 124 142 Z"
              fill="url(#skinMain)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* Curved Top Fingers forming top arch of C */}
            <path
              d="M 76 80 C 82 54, 114 44, 138 56 C 146 60, 146 72, 136 76 C 118 70, 96 74, 88 92 Z"
              fill="url(#fingerLit)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {renderFingernail(130, 58, 8, 9, 2.5, 45)}
            {renderCreases(100, 58, 106, 68)}
            {renderCreases(118, 62, 124, 72)}

            {/* Curved Thumb forming bottom arch of C */}
            <path
              d="M 76 130 C 72 118, 86 108, 106 112 C 126 116, 142 128, 138 138 C 132 144, 118 142, 104 134 C 92 128, 82 136, 76 130 Z"
              fill="url(#fingerLit)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {renderFingernail(128, 128, 9, 8, 2.5, -30)}
            {renderCreases(94, 118, 98, 128)}
          </g>
        );

      // ----------------------------------------------------
      // ASL 'D' : Index finger straight up, thumb touching middle/ring/pinky loop
      // ----------------------------------------------------
      case 'D':
        return (
          <g id="letter-D-pose">
            {renderWrist()}
            {/* Extended Index Finger */}
            <path d="M 75 90 L 75 22 C 75 14, 89 14, 89 22 L 89 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            {renderFingernail(77, 17, 10, 8.5, 3)}
            {renderCreases(76, 42, 88, 42)}
            {renderCreases(76, 66, 88, 66)}

            {/* Palm base */}
            <path
              d="M 68 140 C 62 120, 64 100, 72 90 C 80 84, 126 84, 134 90 C 140 102, 140 122, 134 140 Z"
              fill="url(#skinMain)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* Middle, Ring, Pinky curled touching thumb in circle */}
            <path
              d="M 90 90 C 90 78, 124 78, 124 94 C 124 108, 108 116, 92 114 Z"
              fill="url(#fingerFoldedLit)"
              stroke="#78441D"
              strokeWidth="1.2"
            />
            {/* Thumb touching curled fingers */}
            <path
              d="M 64 136 C 60 118, 74 104, 94 104 C 104 104, 110 112, 102 120 C 88 126, 72 136, 64 136 Z"
              fill="url(#fingerLit)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {renderFingernail(94, 106, 8, 7, 2.5, 20)}
          </g>
        );

      // ----------------------------------------------------
      // ASL 'E' : All 4 fingers curled tightly, thumb tucked across bottom resting against fingertips
      // ----------------------------------------------------
      case 'E':
        return (
          <g id="letter-E-pose">
            {renderWrist()}
            <path
              d="M 66 140 C 60 120, 60 98, 68 88 C 76 80, 126 80, 134 88 C 140 98, 140 120, 134 140 Z"
              fill="url(#skinMain)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* 4 Knuckles arched at the top */}
            <rect x="71" y="68" width="13" height="34" rx="6.5" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            <rect x="85" y="64" width="13.5" height="38" rx="6.75" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            <rect x="100" y="66" width="13" height="36" rx="6.5" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            <rect x="114" y="72" width="12" height="30" rx="6" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />

            {/* Fingertips hooked down */}
            {renderFingernail(73, 92, 9, 8, 2.5)}
            {renderFingernail(87, 92, 9.5, 8, 2.5)}
            {renderFingernail(102, 92, 9, 8, 2.5)}
            {renderFingernail(116, 94, 8, 7, 2)}

            {/* Thumb tucked under fingertips horizontally */}
            <path
              d="M 62 134 C 70 114, 88 108, 118 108 C 124 114, 120 124, 108 126 C 88 128, 72 136, 62 134 Z"
              fill="url(#fingerFoldedLit)"
              stroke="#78441D"
              strokeWidth="1.2"
            />
            {renderFingernail(110, 110, 8, 7, 2, -20)}
          </g>
        );

      // ----------------------------------------------------
      // ASL 'F' : Thumb and Index touching in 'OK' circle, other 3 fingers extended
      // ----------------------------------------------------
      case 'F':
        return (
          <g id="letter-F-pose">
            {renderWrist()}
            {/* Middle Extended */}
            <path d="M 87 90 L 87 18 C 87 10, 100 10, 100 18 L 100 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            {renderFingernail(89, 13, 9.5, 8.5, 3)}
            {renderCreases(88, 40, 99, 40)}
            {renderCreases(88, 64, 99, 64)}

            {/* Ring Extended */}
            <path d="M 102 90 L 102 24 C 102 16, 115 16, 115 24 L 115 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            {renderFingernail(104, 19, 9, 8, 3)}
            {renderCreases(103, 44, 114, 44)}
            {renderCreases(103, 67, 114, 67)}

            {/* Pinky Extended */}
            <path d="M 117 90 L 117 38 C 117 30, 129 30, 129 38 L 129 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            {renderFingernail(119, 33, 8, 7.5, 2.5)}
            {renderCreases(118, 54, 128, 54)}
            {renderCreases(118, 73, 128, 73)}

            {/* Palm base */}
            <path
              d="M 68 140 C 62 120, 64 100, 72 90 C 80 84, 128 84, 134 90 C 140 102, 140 122, 134 140 Z"
              fill="url(#skinMain)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* Index & Thumb meeting in 'OK' loop */}
            <path
              d="M 72 90 C 62 76, 52 88, 62 104 C 68 112, 78 112, 82 102 C 86 92, 82 82, 72 90 Z"
              fill="url(#fingerLit)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* Thumb pressing tip */}
            <path
              d="M 64 136 C 56 122, 60 106, 72 102 C 78 100, 82 108, 78 116 C 72 126, 68 136, 64 136 Z"
              fill="url(#fingerLit)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {renderFingernail(68, 98, 7, 7, 2, 40)}
          </g>
        );

      // ----------------------------------------------------
      // ASL 'L' : Index finger up, thumb extended 90 degrees out
      // ----------------------------------------------------
      case 'L':
        return (
          <g id="letter-L-pose">
            {renderWrist()}
            {/* Extended Index Finger Up */}
            <path d="M 76 90 L 76 22 C 76 14, 90 14, 90 22 L 90 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            {renderFingernail(78, 17, 10, 8.5, 3)}
            {renderCreases(77, 44, 89, 44)}
            {renderCreases(77, 68, 89, 68)}

            {/* Palm base */}
            <path
              d="M 68 140 C 62 120, 64 100, 72 90 C 80 84, 126 84, 134 90 C 140 102, 140 122, 134 140 Z"
              fill="url(#skinMain)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* Middle, Ring, Pinky curled into palm */}
            <rect x="91" y="85" width="13.5" height="24" rx="6.75" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            <rect x="105.5" y="86" width="13" height="23" rx="6.5" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            <rect x="119.5" y="88" width="12" height="21" rx="6" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            {renderFingernail(93, 92, 9.5, 8, 2.5)}
            {renderFingernail(107.5, 93, 9, 8, 2.5)}
            {renderFingernail(121.5, 94, 8, 7, 2)}

            {/* Thumb extended horizontally at 90 degrees */}
            <path
              d="M 72 136 C 62 132, 44 126, 28 122 C 20 120, 20 108, 28 106 C 46 102, 64 106, 76 114 Z"
              fill="url(#fingerLit)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {renderFingernail(22, 108, 9, 10, 3, -80)}
            {renderCreases(48, 106, 48, 122)}
            {renderCreases(66, 110, 68, 128)}
          </g>
        );

      // ----------------------------------------------------
      // ASL 'V' / '2' : Index and Middle fingers in a 'V' peace sign
      // ----------------------------------------------------
      case 'V':
      case '2':
        return (
          <g id="letter-V-pose">
            {renderWrist()}
            {/* Index angled slightly left */}
            <g transform="rotate(-12 78 90)">
              <path d="M 72 90 L 72 22 C 72 14, 86 14, 86 22 L 86 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
              {renderFingernail(74, 17, 10, 8.5, 3)}
              {renderCreases(73, 44, 85, 44)}
              {renderCreases(73, 68, 85, 68)}
            </g>

            {/* Middle angled slightly right */}
            <g transform="rotate(12 108 90)">
              <path d="M 102 90 L 102 16 C 102 8, 116 8, 116 16 L 116 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
              {renderFingernail(104, 11, 10, 8.5, 3)}
              {renderCreases(103, 38, 115, 38)}
              {renderCreases(103, 62, 115, 62)}
            </g>

            {/* Palm base */}
            <path
              d="M 68 140 C 62 120, 64 100, 72 90 C 80 84, 126 84, 134 90 C 140 102, 140 122, 134 140 Z"
              fill="url(#skinMain)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* Ring and Pinky curled into palm */}
            <rect x="105" y="86" width="13" height="23" rx="6.5" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            <rect x="119" y="88" width="12" height="21" rx="6" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            {renderFingernail(107, 93, 9, 8, 2.5)}
            {renderFingernail(121, 94, 8, 7, 2)}

            {/* Thumb folded over curled fingers */}
            <path
              d="M 64 134 C 74 116, 92 114, 108 120 C 112 126, 106 134, 94 136 C 80 138, 68 142, 64 134 Z"
              fill="url(#fingerFoldedLit)"
              stroke="#78441D"
              strokeWidth="1.2"
            />
            {renderFingernail(101, 120, 8, 7, 2.5, -20)}
          </g>
        );

      // ----------------------------------------------------
      // ASL 'Y' : Thumb and Pinky extended wide, middle 3 curled ('shaka')
      // ----------------------------------------------------
      case 'Y':
        return (
          <g id="letter-Y-pose">
            {renderWrist()}
            {/* Palm base */}
            <path
              d="M 68 140 C 62 120, 64 100, 72 90 C 80 84, 126 84, 134 90 C 140 102, 140 122, 134 140 Z"
              fill="url(#skinMain)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* 3 Middle fingers curled */}
            <rect x="76" y="85" width="13.5" height="24" rx="6.75" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            <rect x="91" y="85" width="13.5" height="24" rx="6.75" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            <rect x="105.5" y="86" width="13" height="23" rx="6.5" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            {renderFingernail(78, 92, 9.5, 8, 2.5)}
            {renderFingernail(93, 92, 9.5, 8, 2.5)}
            {renderFingernail(107.5, 93, 9, 8, 2.5)}

            {/* Thumb extended out to the left */}
            <path
              d="M 70 136 C 58 130, 42 118, 30 104 C 24 96, 32 86, 42 92 C 54 100, 68 108, 76 116 Z"
              fill="url(#fingerLit)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {renderFingernail(28, 94, 9, 9, 3, -40)}

            {/* Pinky extended out to the right */}
            <path
              d="M 122 116 C 132 108, 148 96, 160 84 C 168 76, 174 86, 166 96 C 154 108, 138 122, 126 130 Z"
              fill="url(#fingerLit)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {renderFingernail(162, 78, 8, 8.5, 2.5, 45)}
          </g>
        );

      // ----------------------------------------------------
      // ASL 'I' / 'J' : Pinky extended straight up, others curled in fist
      // ----------------------------------------------------
      case 'I':
      case 'J':
        return (
          <g id="letter-I-pose">
            {renderWrist()}
            {/* Extended Pinky Finger */}
            <path d="M 118 90 L 118 32 C 118 24, 130 24, 130 32 L 130 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            {renderFingernail(120, 27, 8, 7.5, 2.5)}
            {renderCreases(119, 48, 129, 48)}
            {renderCreases(119, 68, 129, 68)}

            {/* Palm base */}
            <path
              d="M 68 140 C 62 120, 64 100, 72 90 C 80 84, 126 84, 134 90 C 140 102, 140 122, 134 140 Z"
              fill="url(#skinMain)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* Curled Index, Middle, Ring */}
            <rect x="74" y="85" width="13.5" height="24" rx="6.75" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            <rect x="89" y="85" width="13.5" height="24" rx="6.75" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            <rect x="103.5" y="86" width="13" height="23" rx="6.5" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            {renderFingernail(76, 92, 9.5, 8, 2.5)}
            {renderFingernail(91, 92, 9.5, 8, 2.5)}
            {renderFingernail(105.5, 93, 9, 8, 2.5)}

            {/* Thumb tucked across fingers */}
            <path
              d="M 64 134 C 74 116, 92 114, 108 120 C 112 126, 106 134, 94 136 C 80 138, 68 142, 64 134 Z"
              fill="url(#fingerFoldedLit)"
              stroke="#78441D"
              strokeWidth="1.2"
            />
            {renderFingernail(101, 120, 8, 7, 2.5, -20)}
          </g>
        );

      // ----------------------------------------------------
      // ASL 'LOVE' / 'ILY' : Thumb, Index, Pinky extended
      // ----------------------------------------------------
      case 'LOVE':
      case 'ILY':
        return (
          <g id="letter-ILY-pose">
            {renderWrist()}
            {/* Extended Index */}
            <path d="M 76 90 L 76 22 C 76 14, 90 14, 90 22 L 90 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            {renderFingernail(78, 17, 10, 8.5, 3)}
            {renderCreases(77, 44, 89, 44)}
            {renderCreases(77, 68, 89, 68)}

            {/* Extended Pinky */}
            <path d="M 120 90 L 120 32 C 120 24, 132 24, 132 32 L 132 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
            {renderFingernail(122, 27, 8, 7.5, 2.5)}
            {renderCreases(121, 48, 131, 48)}
            {renderCreases(121, 68, 131, 68)}

            {/* Palm base */}
            <path
              d="M 68 140 C 62 120, 64 100, 72 90 C 80 84, 126 84, 134 90 C 140 102, 140 122, 134 140 Z"
              fill="url(#skinMain)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* Middle and Ring curled */}
            <rect x="91" y="85" width="13.5" height="24" rx="6.75" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            <rect x="105.5" y="86" width="13" height="23" rx="6.5" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
            {renderFingernail(93, 92, 9.5, 8, 2.5)}
            {renderFingernail(107.5, 93, 9, 8, 2.5)}

            {/* Thumb extended out to the left */}
            <path
              d="M 72 136 C 62 132, 44 126, 28 122 C 20 120, 20 108, 28 106 C 46 102, 64 106, 76 114 Z"
              fill="url(#fingerLit)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {renderFingernail(22, 108, 9, 10, 3, -80)}
          </g>
        );

      // ----------------------------------------------------
      // Default / Parametric Fallback with High Realism Anatomy
      // ----------------------------------------------------
      default: {
        const f = fingerConfig;
        return (
          <g id="default-anatomical-pose">
            {renderWrist()}
            {/* 1. Extended fingers rendered first behind palm if needed */}
            {f.index === 1 && (
              <g id="index-ext">
                <path d="M 73 90 L 73 24 C 73 16, 86 16, 86 24 L 86 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
                {renderFingernail(75, 19, 9, 8, 3)}
                {renderCreases(74, 44, 85, 44)}
                {renderCreases(74, 66, 85, 66)}
              </g>
            )}
            {f.middle === 1 && (
              <g id="middle-ext">
                <path d="M 87 90 L 87 16 C 87 8, 100 8, 100 16 L 100 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
                {renderFingernail(89, 11, 9.5, 8.5, 3)}
                {renderCreases(88, 38, 99, 38)}
                {renderCreases(88, 62, 99, 62)}
              </g>
            )}
            {f.ring === 1 && (
              <g id="ring-ext">
                <path d="M 101 90 L 101 22 C 101 14, 114 14, 114 22 L 114 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
                {renderFingernail(103, 17, 9, 8, 3)}
                {renderCreases(102, 42, 113, 42)}
                {renderCreases(102, 65, 113, 65)}
              </g>
            )}
            {f.pinky === 1 && (
              <g id="pinky-ext">
                <path d="M 115 90 L 115 36 C 115 28, 127 28, 127 36 L 127 90 Z" fill="url(#fingerLit)" stroke="#845028" strokeWidth="1.2" />
                {renderFingernail(117, 31, 8, 7.5, 2.5)}
                {renderCreases(116, 52, 126, 52)}
                {renderCreases(116, 71, 126, 71)}
              </g>
            )}

            {/* 2. Palm body */}
            <path
              d="M 66 140 C 60 120, 62 98, 70 88 C 76 84, 126 84, 132 88 C 140 98, 140 120, 134 140 Z"
              fill="url(#skinMain)"
              stroke="#845028"
              strokeWidth="1.2"
            />
            {/* Palm creases */}
            <path d="M 74 110 Q 95 120 114 116" stroke="#8C5329" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M 78 126 Q 98 132 122 124" stroke="#8C5329" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.4" />

            {/* 3. Folded fingers in front of palm */}
            {f.index !== 1 && (
              <g id="index-fold">
                <rect x="73" y="85" width="13" height="23" rx="6.5" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
                {renderFingernail(75, 91, 9, 8, 2.5)}
              </g>
            )}
            {f.middle !== 1 && (
              <g id="middle-fold">
                <rect x="87" y="85" width="13.5" height="23" rx="6.75" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
                {renderFingernail(89, 91, 9.5, 8, 2.5)}
              </g>
            )}
            {f.ring !== 1 && (
              <g id="ring-fold">
                <rect x="101.5" y="86" width="13" height="22" rx="6.5" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
                {renderFingernail(103.5, 92, 9, 8, 2.5)}
              </g>
            )}
            {f.pinky !== 1 && (
              <g id="pinky-fold">
                <rect x="115.5" y="88" width="12" height="20" rx="6" fill="url(#fingerFoldedLit)" stroke="#78441D" strokeWidth="1.2" />
                {renderFingernail(117.5, 93, 8, 7, 2)}
              </g>
            )}

            {/* 4. Thumb state */}
            {f.thumb === 1 ? (
              <g id="thumb-ext">
                <path
                  d="M 68 136 C 54 126, 36 108, 42 92 C 48 82, 60 86, 72 108 Z"
                  fill="url(#fingerLit)"
                  stroke="#845028"
                  strokeWidth="1.2"
                />
                {renderFingernail(44, 90, 8.5, 8, 2.5, -30)}
              </g>
            ) : f.thumb === 2 ? (
              <g id="thumb-pinch">
                <path
                  d="M 66 132 C 76 114, 88 108, 102 112 C 102 122, 88 132, 68 138 Z"
                  fill="url(#fingerLit)"
                  stroke="#845028"
                  strokeWidth="1.2"
                />
                {renderFingernail(96, 112, 8, 8, 2.5)}
              </g>
            ) : (
              <g id="thumb-fold">
                <path
                  d="M 64 134 C 74 116, 92 114, 108 120 C 112 126, 106 134, 94 136 C 80 138, 68 142, 64 134 Z"
                  fill="url(#fingerFoldedLit)"
                  stroke="#78441D"
                  strokeWidth="1.2"
                />
                {renderFingernail(101, 120, 8, 7, 2.5, -20)}
              </g>
            )}
          </g>
        );
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-3 rounded-2xl minimal-inset">
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="overflow-visible select-none drop-shadow-[0_16px_28px_rgba(0,0,0,0.7)]"
      >
        {renderDefs()}
        {/* Soft ground shadow */}
        <ellipse cx="100" cy="172" rx="46" ry="12" fill="url(#groundShadow)" />
        {renderSpecificLetterHand()}

        {/* Dynamic Motion Guides for letters requiring movement (e.g. J, Z, HELLO, PLEASE) */}
        {isMotion && (
          <g className="animate-pulse">
            {letter === 'J' && (
              <path
                d="M 124 45 C 136 85, 136 128, 110 138 C 96 142, 86 132, 90 118"
                fill="none"
                stroke="#34D399"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="6 4"
              />
            )}
            {letter === 'Z' && (
              <path
                d="M 65 38 L 135 38 L 65 92 L 135 92"
                fill="none"
                stroke="#34D399"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="6 4"
              />
            )}
            {(letter === 'HELLO' || letter === 'GOOD') && (
              <path
                d="M 98 56 C 120 38, 150 42, 164 68"
                fill="none"
                stroke="#34D399"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            {(letter === 'PLEASE' || letter === 'SORRY') && (
              <path
                d="M 100 70 A 28 28 0 1 1 99 70"
                fill="none"
                stroke="#34D399"
                strokeWidth="2.5"
                strokeDasharray="5 3"
              />
            )}
          </g>
        )}
      </svg>

      {/* Minimal Clean Sub-badge */}
      <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-[10px] font-medium tracking-wide text-zinc-400 uppercase">
          {sign.dominantHand === 'right' ? 'Right Hand' : 'Dominant Hand'}
        </span>
      </div>
    </div>
  );
};
