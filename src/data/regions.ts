import { RegionInfo } from '../types';

export const REGIONS: RegionInfo[] = [
  {
    id: 1,
    name: 'Fingersmith',
    title: 'Region 1: Fingersmith',
    subtitle: 'ASL Alphabet A – J',
    startNode: 1,
    endNode: 10,
    colorAccent: '#D97706', // Warm Amber
    bgGradient: 'from-[#1A1208]/80 via-[#0E0C10] to-[#0A0A0F]',
    description: 'Foundation alphabet handshapes from standard closed fists to open spreads and index hooks.',
  },
  {
    id: 2,
    name: 'Handweaver',
    title: 'Region 2: Handweaver',
    subtitle: 'ASL Alphabet K – T',
    startNode: 11,
    endNode: 20,
    colorAccent: '#65A30D', // Sage Green
    bgGradient: 'from-[#0F170C]/80 via-[#0A0F0D] to-[#0A0A0F]',
    description: 'Master intricate thumb tucks, peace variations, and index-ring finger weaves.',
  },
  {
    id: 3,
    name: 'Signstream',
    title: 'Region 3: Signstream',
    subtitle: 'ASL Alphabet U – Z & Alphabet Mastery',
    startNode: 21,
    endNode: 30,
    colorAccent: '#F97316', // Soft Coral
    bgGradient: 'from-[#1E100A]/80 via-[#100A0D] to-[#0A0A0F]',
    description: 'Dynamic motion traces (J, Z) and fluid letter transitions across full spelling speeds.',
  },
  {
    id: 4,
    name: 'Wordforge',
    title: 'Region 4: Wordforge',
    subtitle: 'Core Conversational Words',
    startNode: 31,
    endNode: 40,
    colorAccent: '#0EA5E9', // Sky Blue
    bgGradient: 'from-[#081521]/80 via-[#080D15] to-[#0A0A0F]',
    description: 'Essential everyday vocabulary: HELLO, THANK YOU, PLEASE, HELP, YES, NO, LOVE, FRIEND, FAMILY.',
  },
  {
    id: 5,
    name: 'Phrasecraft',
    title: 'Region 5: Phrasecraft',
    subtitle: '2-Word Phrases & Expressions',
    startNode: 41,
    endNode: 50,
    colorAccent: '#A78BFA', // Lavender
    bgGradient: 'from-[#140D24]/80 via-[#0E0B19] to-[#0A0A0F]',
    description: 'Fluid two-sign combinations with rhythm, expressive cadence, and natural speed.',
  },
  {
    id: 6,
    name: 'Fluent Path',
    title: 'Region 6: Fluent Path',
    subtitle: 'Full Sentences & Grand Finale',
    startNode: 51,
    endNode: 60,
    colorAccent: '#EAB308', // Radiant Gold
    bgGradient: 'from-[#221A08]/80 via-[#151208] to-[#0A0A0F]',
    description: 'Full sentence dialogues, rapid comprehension drills, and the Master SignQuest Trial.',
  },
];
