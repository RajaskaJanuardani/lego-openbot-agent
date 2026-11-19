import type { PersonalityType, RoomId } from '../../types';

export interface DialogueContext {
  speakerName: string;
  role: string;
  personality: PersonalityType;
  roomId: RoomId;
  lastAgentTask?: string | null;
}

const LOCATION_OPENERS: Partial<Record<RoomId, string[]>> = {
  kitchen: [
    'Wangi masakan di dapur bikin laper nih!',
    'Ambil minum dingin dari kulkas dulu ah, seger!',
    'Siapa yang mau ikutan masak nasi goreng LEGO?',
  ],
  'living-room': [
    'Sofa ruang keluarga ini paling pw se-komplek!',
    'Eh karpet etniknya kece banget ya warna-warni.',
    'Lagi santai nih, ngobrol asyik!',
  ],
  studio: [
    'Suasana ruang kerja lantai 1 bikin produktif banget!',
    'Papan tulisnya udah penuh sticky notes sprint tuh.',
    'Kopi dulu sebelum lanjut ngoding di studio!',
  ],
  foyer: [
    'Asyik banget nonton TV baru di ruang tamu bawah!',
    'Ganti channel yuk, ada acara seru nih!',
    'Sofa rotan depan TV ini nyaman banget.',
  ],
  'bathroom-1': [
    'Mandi shower hangat dulu biar fresh lagi!',
    'Kamar mandi keramik mint lantai 1 seger banget.',
  ],
  bedroom: [
    'Kasur kanopi ini empuk banget, bikin ngantuk…',
    'Tidur siang bentar ah di kamar utama.',
  ],
  'guest-room': [
    'Kamar tamunya adem banget buat istirahat.',
    'Rebahan sebentar di ranjang tamu enak nih.',
  ],
  'outdoor-beach': [
    'Berenang di laut tropis seger pol hari ini!',
    'Ombak pantainya tenang banget, ayo nyebur!',
    'Berjemur di kursi biru enak banget nih.',
  ],
  'outdoor-tuktuk': [
    'Bajaj kuningnya siap keliling pulau nih!',
    'Bensin bajaj masih penuh nggak ya?',
    'Naik bajaj ke pantai yuk!',
  ],
  terraces: [
    'Main engklek yuk, siapa takut!',
    'Pemandangan dari teras atas juara banget.',
    'Angin sore di teras bikin ngantuk enak.',
  ],
  laundry: [
    'Jemuran udah kering belum tuh?',
    'Cucian hari ini lumayan numpuk ya!',
  ],
  'dressing-room': [
    'Hammock putih di kamar rias nyaman banget!',
    'Motif gorden batiknya estetik pol!',
  ],
};

const PERSONALITY_LINES: Record<PersonalityType, string[]> = {
  diligent: [
    'Target hari ini harus beres sebelum magrib!',
    'Jangan lupa cek daftar kerjaan di lantai 1 ya.',
    'Kalau semua stud tersusun rapi, hati ikut tenang.',
  ],
  relaxed: [
    'Santai dulu lah, hidup nggak usah buru-buru.',
    'Enaknya ngopi sore sambil lihat laut nih.',
    'Rebahan sebentar boleh kali ya?',
  ],
  chatty: [
    'Eh denger-denger rumah ini baru renovasi lantai 1 lho!',
    'Kamu udah lihat ruang kerja baru di bawah belum?',
    'Ngobrol bareng gini seru banget, rame!',
  ],
  shy: [
    'Hehe, halo… cuaca hari ini cerah ya.',
    'Maaf lewat sebentar ya…',
    'Rumahnya makin bagus deh sekarang.',
  ],
};

const REPLIES: string[] = [
  'Bener banget tuh, setuju 100%!',
  'Haha bisa aja deh kamu!',
  'Wah boleh juga idenya, gas!',
  'Seriusan? Baru tahu lho aku!',
  'Nanti abis ini kita mampir ke pantai yuk.',
  'Mantap, semangat terus ya!',
  'Asik, jangan lupa ajak yang lain juga!',
  'Iya nih, aku juga mikir gitu barusan.',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates a witty Indonesian speech-bubble line tailored to personality,
 * location, turn index, and (if connected to OpenBot) recent completed task!
 */
export function pickDialogueLine(ctx: DialogueContext, turnIndex: number): string {
  // 40% chance to mention recent OpenBot agent task on first turn!
  if (ctx.lastAgentTask && turnIndex === 0 && Math.random() < 0.55) {
    const shortTask =
      ctx.lastAgentTask.length > 46
        ? `${ctx.lastAgentTask.slice(0, 44)}…`
        : ctx.lastAgentTask;
    const templates = [
      `Barusan beres "${shortTask}" nih!`,
      `Fiuh, "${shortTask}" akhirnya kelar juga!`,
      `Tadi fokus banget ngerjain "${shortTask}".`,
    ];
    return pick(templates);
  }

  if (turnIndex === 0) {
    const locPool = LOCATION_OPENERS[ctx.roomId];
    if (locPool && Math.random() < 0.6) {
      return pick(locPool);
    }
    return pick(PERSONALITY_LINES[ctx.personality]);
  }

  if (turnIndex % 2 === 1) {
    return pick(REPLIES);
  }

  return pick(PERSONALITY_LINES[ctx.personality]);
}
