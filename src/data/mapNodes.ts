import { MapNode, NodeType } from '../types';

interface SingleNodeInfo {
  type: NodeType;
  title: string;
  subtitle?: string;
  signs: string[];
}

export function generateMapNodes(): MapNode[] {
  // Complete 60-node curriculum mapped to single sequential path
  const nodeSignMap: Record<number, SingleNodeInfo> = {
    // === REGION 1: Fingersmith (1-10) ===
    1: { type: 'learn', title: 'Letter A', subtitle: 'Fist & Side Thumb', signs: ['sign_a'] },
    2: { type: 'challenge', title: 'Letter B', subtitle: 'Flat 4 Fingers', signs: ['sign_b'] },
    3: { type: 'challenge', title: 'Letter C', subtitle: 'Curved C-Arc', signs: ['sign_c'] },
    4: { type: 'challenge', title: 'Letter D', subtitle: 'Index Spire & Loop', signs: ['sign_d'] },
    5: { type: 'learn', title: 'Letter E', subtitle: 'Tucked Fingertips', signs: ['sign_e'] },
    6: { type: 'challenge', title: 'Letter F', subtitle: 'OK Ring & 3 Fans', signs: ['sign_f'] },
    7: { type: 'challenge', title: 'Letter G', subtitle: 'Horizontal Caliper', signs: ['sign_g'] },
    8: { type: 'challenge', title: 'Letter H', subtitle: 'Twin Barrels', signs: ['sign_h'] },
    9: { type: 'challenge', title: 'Letters I & J', subtitle: 'Upright Pinky & J-Trace', signs: ['sign_i', 'sign_j'] },
    10: { type: 'boss', title: 'Boss 1: Fingersmith', subtitle: 'Spell "CAB" & "FAD"', signs: ['sign_c', 'sign_a', 'sign_b', 'sign_f', 'sign_j'] },

    // === REGION 2: Handweaver (11-20) ===
    11: { type: 'learn', title: 'Letter K', subtitle: 'Middle Tilt & Thumb Stem', signs: ['sign_k'] },
    12: { type: 'challenge', title: 'Letter L', subtitle: 'Right Angle L-Shape', signs: ['sign_l'] },
    13: { type: 'challenge', title: 'Letter M', subtitle: '3 Knuckles Over Thumb', signs: ['sign_m'] },
    14: { type: 'challenge', title: 'Letter N', subtitle: '2 Knuckles Over Thumb', signs: ['sign_n'] },
    15: { type: 'learn', title: 'Letter O', subtitle: 'Hollow Circle', signs: ['sign_o'] },
    16: { type: 'challenge', title: 'Letter P', subtitle: 'Downward Stem', signs: ['sign_p'] },
    17: { type: 'challenge', title: 'Letter Q', subtitle: 'Downward Pinch', signs: ['sign_q'] },
    18: { type: 'challenge', title: 'Letter R', subtitle: 'Fingers Crossed', signs: ['sign_r'] },
    19: { type: 'challenge', title: 'Letters S & T', subtitle: 'Front Fist & Thumb Peek', signs: ['sign_s', 'sign_t'] },
    20: { type: 'boss', title: 'Boss 2: Handweaver', subtitle: 'Spell "LOOK" & "PORT"', signs: ['sign_l', 'sign_o', 'sign_k', 'sign_p', 'sign_t'] },

    // === REGION 3: Signstream (21-30) ===
    21: { type: 'learn', title: 'Letter U', subtitle: 'Twin Spire Held Close', signs: ['sign_u'] },
    22: { type: 'challenge', title: 'Letter V', subtitle: 'Peace Sign Spread', signs: ['sign_v'] },
    23: { type: 'challenge', title: 'Letter W', subtitle: '3-Finger Trident', signs: ['sign_w'] },
    24: { type: 'challenge', title: 'Letter X', subtitle: 'Pirate Hook', signs: ['sign_x'] },
    25: { type: 'learn', title: 'Letter Y', subtitle: 'Shaka Hang-Loose', signs: ['sign_y'] },
    26: { type: 'challenge', title: 'Letter Z', subtitle: 'Air Zig-Zag Trace', signs: ['sign_z'] },
    27: { type: 'challenge', title: 'Numbers 1, 2, 3', subtitle: 'Counting Foundation', signs: ['sign_1', 'sign_2', 'sign_3'] },
    28: { type: 'challenge', title: 'Numbers 4 & 5', subtitle: 'Full Hand Numbers', signs: ['sign_4', 'sign_5'] },
    29: { type: 'challenge', title: 'Vowel Sprint', subtitle: 'A-E-I-O-U Mastery', signs: ['sign_a', 'sign_e', 'sign_i', 'sign_o', 'sign_u'] },
    30: { type: 'boss', title: 'Boss 3: Signstream', subtitle: 'Full Alphabet Master Trial', signs: ['sign_u', 'sign_v', 'sign_w', 'sign_y', 'sign_z'] },

    // === REGION 4: Wordforge (31-40) ===
    31: { type: 'learn', title: 'HELLO', subtitle: 'Temple Wave Salute', signs: ['sign_hello'] },
    32: { type: 'challenge', title: 'THANK YOU', subtitle: 'Chin to Forward Palm', signs: ['sign_thankyou'] },
    33: { type: 'challenge', title: 'PLEASE', subtitle: 'Chest Palm Circle', signs: ['sign_please'] },
    34: { type: 'challenge', title: 'SORRY', subtitle: 'Chest Fist Circle', signs: ['sign_sorry'] },
    35: { type: 'learn', title: 'YES & NO', subtitle: 'Nodding Fist & Beak Snap', signs: ['sign_yes', 'sign_no'] },
    36: { type: 'challenge', title: 'LOVE', subtitle: 'I-L-Y Handshape', signs: ['sign_love'] },
    37: { type: 'challenge', title: 'FRIEND', subtitle: 'Interlocking Index Hook', signs: ['sign_friend'] },
    38: { type: 'challenge', title: 'FAMILY', subtitle: 'F-Handshape Circle', signs: ['sign_family'] },
    39: { type: 'challenge', title: 'HELP', subtitle: 'Support Lift Gesture', signs: ['sign_help'] },
    40: { type: 'boss', title: 'Boss 4: Wordforge', subtitle: '"HELLO FRIEND, THANK YOU"', signs: ['sign_hello', 'sign_friend', 'sign_please', 'sign_thankyou'] },

    // === REGION 5: Phrasecraft (41-50) ===
    41: { type: 'learn', title: 'GOOD', subtitle: 'Chin to Palm Forward', signs: ['sign_good'] },
    42: { type: 'challenge', title: 'MORNING', subtitle: 'Rising Sun Arc', signs: ['sign_morning'] },
    43: { type: 'challenge', title: 'MEET', subtitle: 'Two People Meet', signs: ['sign_meet'] },
    44: { type: 'challenge', title: 'YOU', subtitle: 'Direct Forward Point', signs: ['sign_you'] },
    45: { type: 'learn', title: 'NAME', subtitle: 'H-Fingers Cross Tap', signs: ['sign_name'] },
    46: { type: 'challenge', title: 'AGAIN', subtitle: 'Bent Hand to Palm', signs: ['sign_again'] },
    47: { type: 'challenge', title: 'GOOD MORNING', subtitle: '2-Sign Combination', signs: ['sign_good', 'sign_morning'] },
    48: { type: 'challenge', title: 'NICE TO MEET YOU', subtitle: 'Meet + You Expression', signs: ['sign_meet', 'sign_you', 'sign_friend'] },
    49: { type: 'challenge', title: 'YES PLEASE', subtitle: 'Polite Request Combo', signs: ['sign_yes', 'sign_please'] },
    50: { type: 'boss', title: 'Boss 5: Phrasecraft', subtitle: '"GOOD MORNING FRIEND, I LOVE YOU"', signs: ['sign_good', 'sign_morning', 'sign_friend', 'sign_love'] },

    // === REGION 6: Fluent Path (51-60) ===
    51: { type: 'learn', title: 'LEARN', subtitle: 'Knowledge to Forehead', signs: ['sign_learn'] },
    52: { type: 'challenge', title: 'SIGN LANGUAGE', subtitle: 'Fluid Sign Circles', signs: ['sign_sign'] },
    53: { type: 'challenge', title: 'MORE & WATER', subtitle: 'Practical Everyday Signs', signs: ['sign_more', 'sign_water'] },
    54: { type: 'challenge', title: 'HELP ME SIGN', subtitle: 'Sign + Help Blend', signs: ['sign_help', 'sign_sign'] },
    55: { type: 'learn', title: 'AWESOME', subtitle: 'Radiant Celebration Palms', signs: ['sign_awesome'] },
    56: { type: 'challenge', title: 'I LOVE SIGNING', subtitle: 'Love + Sign Combination', signs: ['sign_love', 'sign_sign'] },
    57: { type: 'challenge', title: 'AWESOME FRIEND', subtitle: 'Friend + Awesome Blend', signs: ['sign_friend', 'sign_awesome'] },
    58: { type: 'challenge', title: 'SENTENCE TRIAL', subtitle: '"HELLO! PLEASE HELP FRIEND"', signs: ['sign_hello', 'sign_please', 'sign_help', 'sign_friend'] },
    59: { type: 'challenge', title: 'GRAND SUMMIT', subtitle: '"GOOD MORNING, YOU ARE AWESOME"', signs: ['sign_good', 'sign_morning', 'sign_you', 'sign_awesome'] },
    60: { type: 'boss', title: 'Grand Finale: SignQuest Champion', subtitle: 'The Ultimate 5-Sign Journey', signs: ['sign_hello', 'sign_friend', 'sign_love', 'sign_sign', 'sign_awesome'] },
  };

  const NODE_SPACING_Y = 110;
  const TOTAL_NODES = 60;
  const nodes: MapNode[] = [];

  for (let i = 1; i <= TOTAL_NODES; i++) {
    const mapping = nodeSignMap[i] || {
      type: 'challenge' as NodeType,
      title: `Level ${i}`,
      signs: ['sign_a'],
    };

    const regionId = Math.min(6, Math.floor((i - 1) / 10) + 1);

    // Serpentine horizontal wave: between 22% and 78% width
    // Creates a smooth, natural single winding trail
    const wavePhase = (i - 1) * 0.65;
    const xPct = Math.round((50 + 28 * Math.sin(wavePhase)) * 10) / 10;
    // Level 1 is at the bottom, Level 60 is at the summit top (120px)
    const yPx = 120 + (TOTAL_NODES - i) * NODE_SPACING_Y;

    nodes.push({
      id: i,
      regionId,
      type: mapping.type,
      title: mapping.title,
      subtitle: mapping.subtitle,
      signIds: mapping.signs,
      x: xPct,
      y: yPx,
      parents: i > 1 ? [i - 1] : undefined,
      children: i < TOTAL_NODES ? [i + 1] : undefined,
    });
  }

  return nodes.sort((a, b) => a.id - b.id);
}

export const MAP_NODES = generateMapNodes();
