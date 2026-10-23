'use strict';
// Waqt Noorani Qaida (phones): learning to read the Quran from the first
// letter, lesson by lesson, in the order Bangladesh's maktabs teach it.
// Letters and syllables are spoken by the phone's Arabic voice when tapped;
// Quranic words are heard from a reciter. Every lesson can be walked through
// ("listen and repeat") and ends with a short listening quiz. IndoPak script,
// as printed in Bangladeshi Qurans. Loaded after salah.js (uses tr2 and B).

const QD = { run: 0, playing: false, items: [], quiz: null, voice: null, audio: null, surah: 1 };
const qdLoad = () => { try { return JSON.parse(localStorage.getItem('qaida') || '{}'); } catch { return {}; } };
const qdSt = () => ({ done: {}, best: {}, rate: 0.75, tl: true, ...qdLoad() });
const qdSave = (st) => { try { localStorage.setItem('qaida', JSON.stringify(st)); } catch { /* private mode */ } };

const QDT = {
  title: ['Noorani Qaida', 'নূরানী কায়দা'], sub: ['Learn to read the Quran, letter by letter', 'হরফ থেকে শুরু করে কুরআন পড়া শিখুন'],
  lesson: ['Lesson', 'সবক'], lessons: ['Lessons', 'সবকসমূহ'], cont: ['Continue', 'চালিয়ে যান'], begin: ['Begin', 'শুরু করুন'], all_done: ['All lessons complete', 'সব সবক সম্পন্ন'],
  listen: ['Listen & repeat', 'শুনুন ও বলুন'], stop: ['Stop', 'থামুন'], quiz: ['Quiz', 'কুইজ'], take_quiz: ['Take the quiz', 'কুইজ দিন'], next_lesson: ['Next lesson', 'পরের সবক'],
  tap_hint: ['Tap any tile to hear it', 'যেকোনো ঘরে চাপ দিলে উচ্চারণ শোনা যাবে'],
  which: ['Which one did you hear?', 'কোনটি শুনলেন?'], which_name: ['What is this letter called?', 'এই হরফের নাম কী?'], again: ['Hear it again', 'আবার শুনুন'],
  great: ['Excellent — lesson complete', 'চমৎকার — সবক সম্পন্ন'], good: ['Lesson complete', 'সবক সম্পন্ন'], retry_t: ['Almost there', 'আরেকটু বাকি'],
  need: ['Get 6 of 8 right to complete the lesson.', 'সবক সম্পন্ন করতে ৮টির মধ্যে ৬টি সঠিক হতে হবে।'],
  try_again: ['Try again', 'আবার চেষ্টা করুন'], back_list: ['Back to lessons', 'সবকের তালিকায়'], best: ['Best', 'সেরা'],
  voice_missing: ['Install the Arabic voice to hear the letters.', 'হরফের উচ্চারণ শুনতে ফোনে আরবি ভয়েস ইনস্টল করুন।'], install: ['Install', 'ইনস্টল'],
  speed: ['Voice speed', 'উচ্চারণের গতি'], slow: ['Slow', 'ধীরে'], normal: ['Normal', 'স্বাভাবিক'],
  tl: ['Pronunciation guide', 'উচ্চারণ সহায়িকা'], tl_d: ['Each sound written in English letters', 'প্রতিটি উচ্চারণ বাংলা অক্ষরে'],
  settings: ['Settings', 'সেটিংস'],
  note: ['Letters and syllables are spoken by your phone\'s Arabic voice, and Quranic words by a reciter. Written pronunciations are only a guide: learn the exact sounds (makhraj) from a teacher.', 'হরফ ও স্বরের উচ্চারণ ফোনের আরবি ভয়েসে, আর কুরআনের শব্দ কারির কণ্ঠে শোনানো হয়। বাংলায় লেখা উচ্চারণ শুধু সহায়িকা; সঠিক মাখরাজ শিক্ষকের কাছ থেকে শিখুন।'],
  offline: ['The reciter needs an internet connection.', 'কারির তিলাওয়াত শুনতে ইন্টারনেট লাগবে।'],
  throat: ['Throat', 'কণ্ঠনালী'], tongue: ['Tongue', 'জিহ্বা'], lips: ['Lips', 'ঠোঁট'], jawf: ['Open mouth', 'মুখের খালি জায়গা'], heavy: ['Heavy — full mouth', 'মোটা — মুখ ভরে'],
  qalqalah: ['Qalqalah — echo', 'কলকলা — প্রতিধ্বনি'], ghunnah: ['Ghunnah — through the nose', 'গুন্নাহ — নাকে স্বর'],
  forms: ['End · Middle · Start · Alone', 'শেষে · মাঝে · শুরুতে · একা'], joined: ['Joined letters', 'যুক্ত হরফ'], joined_d: ['Read the name of each letter, right to left.', 'ডান দিক থেকে প্রতিটি হরফের নাম পড়ুন।'],
  examples: ['In the Quran', 'কুরআনের শব্দে'], opens: ['Opens', 'শুরুতে আছে'], surahs: ['surahs', 'টি সূরা'],
  words_tap: ['Tap a word to hear it recited', 'শব্দে চাপ দিলে তিলাওয়াত শোনা যাবে'],
};
const qdt = (k) => tr2(QDT[k]);

// ---------- The letters ----------
// c letter · n its name, voweled for the voice · en/bn its name · l/b how its
// sounds are written (English consonant; Bengali with a, i, u) · k Bengali
// consonant for sukun and shaddah · g where it is said · h heavy.
const LET = [
  { c: 'ا', n: 'أَلِفْ', en: 'Alif', bn: 'আলিফ', l: '', b: ['আ', 'ই', 'উ'], g: 'jawf' },
  { c: 'ب', n: 'بَاءْ', en: 'Bā', bn: 'বা', l: 'b', b: ['বা', 'বি', 'বু'], k: 'ব', g: 'lips' },
  { c: 'ت', n: 'تَاءْ', en: 'Tā', bn: 'তা', l: 't', b: ['তা', 'তি', 'তু'], k: 'ত', g: 'tongue' },
  { c: 'ث', n: 'ثَاءْ', en: 'Thā', bn: 'ছা', l: 'th', b: ['ছা', 'ছি', 'ছু'], k: 'ছ', g: 'tongue' },
  { c: 'ج', n: 'جِيمْ', en: 'Jīm', bn: 'জীম', l: 'j', b: ['জা', 'জি', 'জু'], k: 'জ', g: 'tongue' },
  { c: 'ح', n: 'حَاءْ', en: 'Ḥā', bn: 'হা', l: 'ḥ', b: ['হা', 'হি', 'হু'], k: 'হ', g: 'throat' },
  { c: 'خ', n: 'خَاءْ', en: 'Khā', bn: 'খা', l: 'kh', b: ['খা', 'খি', 'খু'], k: 'খ', g: 'throat', h: 1 },
  { c: 'د', n: 'دَالْ', en: 'Dāl', bn: 'দাল', l: 'd', b: ['দা', 'দি', 'দু'], k: 'দ', g: 'tongue' },
  { c: 'ذ', n: 'ذَالْ', en: 'Dhāl', bn: 'যাল', l: 'dh', b: ['যা', 'যি', 'যু'], k: 'য', g: 'tongue' },
  { c: 'ر', n: 'رَاءْ', en: 'Rā', bn: 'রা', l: 'r', b: ['রা', 'রি', 'রু'], k: 'র', g: 'tongue' },
  { c: 'ز', n: 'زَايْ', en: 'Zāy', bn: 'যা', l: 'z', b: ['যা', 'যি', 'যু'], k: 'য', g: 'tongue' },
  { c: 'س', n: 'سِينْ', en: 'Sīn', bn: 'সীন', l: 's', b: ['সা', 'সি', 'সু'], k: 'স', g: 'tongue' },
  { c: 'ش', n: 'شِينْ', en: 'Shīn', bn: 'শীন', l: 'sh', b: ['শা', 'শি', 'শু'], k: 'শ', g: 'tongue' },
  { c: 'ص', n: 'صَادْ', en: 'Ṣād', bn: 'ছোয়াদ', l: 'ṣ', b: ['ছা', 'ছি', 'ছু'], k: 'ছ', g: 'tongue', h: 1 },
  { c: 'ض', n: 'ضَادْ', en: 'Ḍād', bn: 'দোয়াদ', l: 'ḍ', b: ['দ্বা', 'দ্বি', 'দ্বু'], k: 'দ', g: 'tongue', h: 1 },
  { c: 'ط', n: 'طَاءْ', en: 'Ṭā', bn: 'ত্বোয়া', l: 'ṭ', b: ['ত্বা', 'ত্বি', 'ত্বু'], k: 'ত', g: 'tongue', h: 1 },
  { c: 'ظ', n: 'ظَاءْ', en: 'Ẓā', bn: 'যোয়া', l: 'ẓ', b: ['য্বা', 'য্বি', 'য্বু'], k: 'য', g: 'tongue', h: 1 },
  { c: 'ع', n: 'عَيْنْ', en: 'ʿAyn', bn: 'আইন', l: 'ʿ', b: ['আ', 'ই', 'উ'], g: 'throat', sk: ['আ\'', 'ই\'', 'উ\''], sh: ['আ\'আ', 'ই\'ই', 'উ\'উ'] },
  { c: 'غ', n: 'غَيْنْ', en: 'Ghayn', bn: 'গাইন', l: 'gh', b: ['গা', 'গি', 'গু'], k: 'গ', g: 'throat', h: 1 },
  { c: 'ف', n: 'فَاءْ', en: 'Fā', bn: 'ফা', l: 'f', b: ['ফা', 'ফি', 'ফু'], k: 'ফ', g: 'lips' },
  { c: 'ق', n: 'قَافْ', en: 'Qāf', bn: 'ক্বাফ', l: 'q', b: ['ক্বা', 'ক্বি', 'ক্বু'], k: 'ক', g: 'tongue', h: 1 },
  { c: 'ك', n: 'كَافْ', en: 'Kāf', bn: 'কাফ', l: 'k', b: ['কা', 'কি', 'কু'], k: 'ক', g: 'tongue' },
  { c: 'ل', n: 'لَامْ', en: 'Lām', bn: 'লাম', l: 'l', b: ['লা', 'লি', 'লু'], k: 'ল', g: 'tongue' },
  { c: 'م', n: 'مِيمْ', en: 'Mīm', bn: 'মীম', l: 'm', b: ['মা', 'মি', 'মু'], k: 'ম', g: 'lips' },
  { c: 'ن', n: 'نُونْ', en: 'Nūn', bn: 'নূন', l: 'n', b: ['না', 'নি', 'নু'], k: 'ন', g: 'tongue' },
  { c: 'و', n: 'وَاوْ', en: 'Wāw', bn: 'ওয়াও', l: 'w', b: ['ওয়া', 'ওয়ি', 'ওয়ু'], g: 'lips', sk: ['আও', 'ইও', 'উও'], sh: ['আওয়া', 'ইওয়ি', 'উওয়ু'] },
  { c: 'ه', n: 'هَاءْ', en: 'Hā', bn: 'হা', l: 'h', b: ['হা', 'হি', 'হু'], k: 'হ', g: 'throat' },
  { c: 'ء', n: 'هَمْزَةْ', en: 'Hamzah', bn: 'হামযা', l: '\'', b: ['আ', 'ই', 'উ'], g: 'throat' },
  { c: 'ي', n: 'يَاءْ', en: 'Yā', bn: 'ইয়া', l: 'y', b: ['ইয়া', 'ইয়ি', 'ইয়ু'], g: 'tongue', sk: ['আই', 'ইই', 'উই'], sh: ['আইয়া', 'ইইয়ি', 'উইয়ু'] },
];
const ALIF = LET[0];
/// Letters that carry vowels (hamza is taught through alif).
const VOW = LET.filter((x) => x.c !== 'ء');
/// Letters after alif, for sukun, shaddah and the long marks.
const CONS = VOW.slice(1);
const NOJOIN = 'ادذرزو';
const QALQALAH = 'قطبجد';
const F = 'َ', K = 'ِ', D = 'ُ', SUK = 'ْ', SHD = 'ّ';
/// A Quranic word without its pause marks (taught later, with the teacher).
const qdBare = (w) => w.replace(/[\u06D6-\u06DC\u06DE\u06E9\u200B-\u200F\uE000-\uF8FF]/g, '').trim();
/// Arabic inside a sentence, set in the Quran font so it can be read.
const qdInline = (txt) => esc(txt).replace(/[\u0600-\u06FF](?:[\u0600-\u06FF\s]*[\u0600-\u06FF])?/g, (m) => `<span class="qd-inl" lang="ar" dir="rtl">${m}</span>`);
const longBn = (s) => s.replace(/ি$/, 'ী').replace(/ু$/, 'ূ').replace(/^ই$/, 'ঈ').replace(/^উ$/, 'ঊ');

// ---------- Lessons ----------
// Each builds its groups of tiles: { ar shown, say for the voice, en/bn written sound, w a Quran word }.
const syl = (x, ar, say, en, bn, mark) => ({ ar, say, en, bn, letter: x.c, mark });
const rowsOf = (letters, make, mark) => [{ rows: letters.map((x) => ({ mark: mark?.(x), items: make(x) })) }];

const LESSONS = [
  { id: 'letters', ar: 'ا ب ت', t: ['The letters', 'হরফ পরিচিতি'], s: ['29 letters and their names', '২৯টি হরফ ও তাদের নাম'],
    d: ['Arabic has 29 letters, read from right to left. Learn each letter\'s shape and name. The colour shows where a letter is said; letters with a bar are heavy, said with a full mouth.', 'আরবিতে ২৯টি হরফ, ডান দিক থেকে বাম দিকে পড়া হয়। প্রতিটি হরফের আকৃতি ও নাম চিনুন। রং দেখায় হরফটি কোথা থেকে উচ্চারিত হয়; দাগ দেওয়া হরফগুলো মোটা — মুখ ভরে পড়তে হয়।'],
    legend: ['throat', 'tongue', 'lips', 'jawf', 'heavy'],
    build: () => [{ grid: 4, items: LET.map((x) => ({ ar: x.c, say: x.n, en: x.en, bn: x.bn, g: x.g, h: x.h, letter: x.c, name: true })) }] },
  { id: 'shapes', ar: 'بـ ـبـ ـب', t: ['Joined letters', 'হরফের যুক্ত রূপ'], s: ['How letters join in a word', 'শব্দে হরফ যেভাবে যুক্ত হয়'],
    d: ['A letter changes shape as it joins others: at the start, in the middle or at the end of a word. Six letters — ا د ذ ر ز و — never join the letter after them.', 'অন্য হরফের সাথে যুক্ত হলে আকৃতি বদলে যায়: শব্দের শুরুতে, মাঝে বা শেষে। ছয়টি হরফ — ا د ذ ر ز و — পরের হরফের সাথে যুক্ত হয় না।'],
    build: () => {
      const Z = '\u0640';
      const forms = LET.filter((x) => x.c !== 'ء').map((x) => {
        const j = !NOJOIN.includes(x.c);
        const one = (ar) => ({ ar, say: x.n, en: x.en, bn: x.bn, letter: x.c });
        return { items: [one(x.c), j ? one(x.c + Z) : null, j ? one(Z + x.c + Z) : null, one(Z + x.c)] };
      });
      const sets = ['بتث', 'جحخ', 'سش', 'صض', 'طظ', 'عغ', 'فق', 'كل', 'من', 'هي', 'لا', 'نبت', 'يسر', 'حمد', 'قلم', 'علم'];
      const by = Object.fromEntries(LET.map((x) => [x.c, x]));
      return [{ h: QDT.forms, rows: forms, cols: 4 },
        { h: QDT.joined, p: QDT.joined_d, grid: 4, items: sets.map((s) => {
          const ls = [...s].map((ch) => by[ch]);
          return { ar: s, say: ls.map((x) => x.n).join(' '), en: ls.map((x) => x.en).join(' '), bn: ls.map((x) => x.bn).join(' '), small: true };
        }) }];
    } },
  { id: 'muqattaat', ar: 'الٓمّٓ', t: ['Opening letters', 'হুরূফে মুকাত্তাআত'], s: ['The letters that open 29 surahs', '২৯টি সূরার শুরুর হরফ'], quran: true,
    d: ['Fourteen letters open 29 surahs. They are read by their names, as the reciter does. Their meaning is known to Allah alone.', '২৯টি সূরার শুরুতে ১৪টি হরফ আছে। এগুলো হরফের নাম ধরে পড়া হয়, যেমন কারি পড়েন। এর অর্থ একমাত্র আল্লাহই জানেন।'] },
  { id: 'harakat', ar: 'بَ بِ بُ', t: ['Fatha, Kasra, Damma', 'যবর, যের, পেশ'], s: ['The three short vowels', 'তিনটি ছোট স্বরচিহ্ন'],
    d: ['Three short vowel marks. Fatha, a line above, gives "a"; kasra, a line below, gives "i"; damma, a small waw above, gives "u". Say each one short, in a single beat.', 'তিনটি ছোট স্বরচিহ্ন। যবর (উপরে দাগ) দিলে "আ", যের (নিচে দাগ) দিলে "ই", আর পেশ (উপরে ছোট ওয়াও) দিলে "উ"। প্রতিটি এক মাত্রায়, ছোট করে পড়ুন।'],
    build: () => rowsOf(VOW, (x) => {
      const a = x === ALIF;
      return [[F, 'أَ'], [K, 'إِ'], [D, 'أُ']].map(([m, h], i) => syl(x, x.c + m, a ? h : x.c + m, x.l + 'aiu'[i], x.b[i]));
    }) },
  { id: 'tanwin', ar: 'بً بٍ بٌ', t: ['Tanwin', 'তানভীন'], s: ['Doubled vowels: an, in, un', 'দুই যবর, দুই যের, দুই পেশ'],
    d: ['Two fathas, two kasras or two dammas add a hidden "n" to the end: "an", "in", "un".', 'দুই যবর, দুই যের ও দুই পেশকে তানভীন বলে। এতে শেষে একটি "ন" যুক্ত হয়: আন, ইন, উন।'],
    build: () => rowsOf(VOW, (x) => {
      const a = x === ALIF;
      return [['ً', 'أً'], ['ٍ', 'إٍ'], ['ٌ', 'أٌ']].map(([m, h], i) => syl(x, x.c + m, a ? h : x.c + m, x.l + ['an', 'in', 'un'][i], x.b[i] + 'ন'));
    }) },
  { id: 'words', ar: 'خَلَقَ', t: ['Reading words', 'শব্দ পড়া (মশক)'], s: ['Joining sounds into words', 'স্বর মিলিয়ে শব্দ পড়া'],
    d: ['Now join the sounds into words from the Quran. Read each letter with its mark, one after another, without pausing in between.', 'এবার স্বরচিহ্নসহ হরফ মিলিয়ে কুরআনের শব্দ পড়ুন। প্রতিটি হরফ তার চিহ্নসহ, মাঝে না থেমে পরপর পড়ুন।'],
    build: () => [{ grid: 2, items: WORDS.map(([ar, en, bn, men, mbn]) => ({ ar, say: ar, en, bn, mean: [men, mbn], word: true })) }] },
  { id: 'standing', ar: 'بٰ بٖ بٗ', t: ['Standing marks', 'খাড়া যবর, খাড়া যের, উল্টা পেশ'], s: ['Long vowels of two beats', 'দুই মাত্রা টেনে পড়া'],
    d: ['A standing fatha, a standing kasra or an inverted damma stretches the vowel to two beats: "ā", "ī", "ū".', 'খাড়া যবর, খাড়া যের ও উল্টা পেশ থাকলে স্বর দুই মাত্রা টেনে পড়তে হয়: "আ-", "ঈ-", "ঊ-"।'],
    build: () => [...rowsOf(CONS, (x) => ['ٰ', 'ٖ', 'ٗ'].map((m, i) => syl(x, x.c + m, x.c + [F + 'ا', K + 'ي', D + 'و'][i], x.l + 'āīū'[i], longBn(x.b[i])))),
      { h: QDT.examples, grid: 2, items: [['لَهٗ', 'لَهُو', 'lahū', 'লাহূ'], ['بِهٖ', 'بِهِي', 'bihī', 'বিহী'], ['ذٰلِكَ', 'ذَالِكَ', 'dhālika', 'যা-লিকা'], ['اِلٰهٌ', 'إِلَاهٌ', 'ilāhun', 'ইলা-হুন']].map(([ar, say, en, bn]) => ({ ar, say, en, bn, word: true })) }] },
  { id: 'madd', ar: 'بَا بِيْ بُوْ', t: ['Madd letters', 'হরফে মাদ্দ'], s: ['Alif, waw and ya that stretch', 'আলিফ, ওয়াও ও ইয়া দিয়ে টানা'],
    d: ['An empty alif after a fatha, a ya with sukun after a kasra, and a waw with sukun after a damma stretch the sound to two beats.', 'যবরের পর খালি আলিফ, যেরের পর জযমওয়ালা ইয়া, আর পেশের পর জযমওয়ালা ওয়াও থাকলে দুই মাত্রা টেনে পড়তে হয়।'],
    build: () => rowsOf(VOW, (x) => {
      const a = x === ALIF;
      return [
        syl(x, a ? 'آ' : x.c + F + 'ا', a ? 'آ' : x.c + F + 'ا', x.l + 'ā', longBn(x.b[0])),
        syl(x, (a ? 'اِ' : x.c + K) + 'يْ', (a ? 'إِ' : x.c + K) + 'ي', x.l + 'ī', longBn(x.b[1])),
        syl(x, (a ? 'اُ' : x.c + D) + 'وْ', (a ? 'أُ' : x.c + D) + 'و', x.l + 'ū', longBn(x.b[2])),
      ];
    }) },
  { id: 'leen', ar: 'بَيْ بَوْ', t: ['Leen letters', 'হরফে লীন'], s: ['Soft "ay" and "aw"', 'নরম স্বর: আই, আউ'],
    d: ['A waw or ya with sukun after a fatha is read softly, gliding: "ay" and "aw" — as in خَوْف and بَيْت.', 'যবরের পর জযমওয়ালা ওয়াও বা ইয়া নরমভাবে পড়তে হয়: "আই" ও "আউ" — যেমন خَوْف ও بَيْت।'],
    build: () => rowsOf(VOW, (x) => {
      const a = x === ALIF, c = a ? 'اَ' : x.c + F, s = a ? 'أَ' : x.c + F;
      return [syl(x, c + 'يْ', s + 'يْ', x.l + 'ay', x.b[0] + 'ই'), syl(x, c + 'وْ', s + 'وْ', x.l + 'aw', x.b[0] + 'উ')];
    }) },
  { id: 'sukun', ar: 'اَبْ اِبْ اُبْ', t: ['Sukun (Jazm)', 'জযম (সুকুন)'], s: ['A letter with no vowel', 'স্বরহীন হরফ'],
    d: ['A letter with sukun has no vowel of its own: join it to the letter before. The five qalqalah letters — ق ط ب ج د — echo slightly when they carry a sukun.', 'জযমওয়ালা হরফের নিজের কোনো স্বর নেই; আগের হরফের সাথে মিলিয়ে পড়ুন। কলকলার পাঁচ হরফ — ق ط ب ج د — জযম অবস্থায় একটু প্রতিধ্বনি দিয়ে পড়তে হয়।'],
    legend: ['qalqalah'],
    build: () => rowsOf(CONS, (x) => [['اَ', 'أَ', 'a'], ['اِ', 'إِ', 'i'], ['اُ', 'أُ', 'u']].map(([c, s, v], i) => syl(x, c + x.c + SUK, s + x.c + SUK, v + x.l, x.sk ? x.sk[i] : ['আ', 'ই', 'উ'][i] + x.k)), (x) => (QALQALAH.includes(x.c) ? 'qalqalah' : '')) },
  { id: 'shaddah', ar: 'اَبَّ اِبِّ اُبُّ', t: ['Shaddah (Tashdid)', 'তাশদীদ'], s: ['A doubled letter', 'দ্বিগুণ হরফ'],
    d: ['Shaddah doubles a letter: say it twice, once closing the sound before it and once with its own vowel. On ن and م, hold a nasal sound (ghunnah) for two beats.', 'তাশদীদ হরফকে দ্বিগুণ করে: একবার আগের হরফের সাথে মিলিয়ে, আরেকবার নিজের স্বরচিহ্নসহ পড়ুন। ن ও م-এ তাশদীদ থাকলে দুই মাত্রা গুন্নাহ (নাকে স্বর) করতে হয়।'],
    legend: ['ghunnah'],
    build: () => rowsOf(CONS, (x) => [['اَ', 'أَ', 'a', F], ['اِ', 'إِ', 'i', K], ['اُ', 'أُ', 'u', D]].map(([c, s, v, m], i) => syl(x, c + x.c + SHD + m, s + x.c + SHD + m, v + x.l + x.l + v, x.sh ? x.sh[i] : ['আ', 'ই', 'উ'][i] + x.k + '্' + x.b[i])), (x) => ('نم'.includes(x.c) ? 'ghunnah' : '')) },
  { id: 'reading', ar: 'قُلْ هُوَ اللّٰهُ', t: ['Reading the Quran', 'কুরআন তিলাওয়াত'], s: ['Short surahs, word by word', 'ছোট সূরা, শব্দে শব্দে'], quran: true,
    d: ['Put it all together with short surahs. Tap a word to hear it recited, or let the reciter lead you word by word and repeat after each one.', 'সব মিলিয়ে ছোট সূরা পড়ুন। যেকোনো শব্দে চাপ দিলে তিলাওয়াত শোনা যাবে, অথবা কারির সাথে শব্দে শব্দে শুনে পড়ুন।'] },
];
// [Arabic, English sound, Bengali sound, English meaning, Bengali meaning]
const WORDS = [
  ['خَلَقَ', 'khalaqa', 'খালাক্বা', 'He created', 'তিনি সৃষ্টি করলেন'], ['كَتَبَ', 'kataba', 'কাতাবা', 'He wrote', 'তিনি লিখলেন'],
  ['جَعَلَ', 'jaʿala', 'জা\'আলা', 'He made', 'তিনি বানালেন'], ['ذَهَبَ', 'dhahaba', 'যাহাবা', 'He went', 'তিনি গেলেন'],
  ['صَدَقَ', 'ṣadaqa', 'ছাদাক্বা', 'He spoke the truth', 'তিনি সত্য বললেন'], ['نَصَرَ', 'naṣara', 'নাছারা', 'He helped', 'তিনি সাহায্য করলেন'],
  ['رَزَقَ', 'razaqa', 'রাযাক্বা', 'He provided', 'তিনি রিযিক দিলেন'], ['أَمَرَ', 'amara', 'আমারা', 'He commanded', 'তিনি আদেশ করলেন'],
  ['عَلِمَ', 'ʿalima', '\'আলিমা', 'He knew', 'তিনি জানলেন'], ['سَمِعَ', 'samiʿa', 'সামি\'আ', 'He heard', 'তিনি শুনলেন'],
  ['شَكَرَ', 'shakara', 'শাকারা', 'He was thankful', 'তিনি কৃতজ্ঞ হলেন'], ['حَسُنَ', 'ḥasuna', 'হাসুনা', 'It was good', 'তা সুন্দর হলো'],
  ['كُتِبَ', 'kutiba', 'কুতিবা', 'It was prescribed', 'তা নির্ধারিত হলো'], ['خُلِقَ', 'khuliqa', 'খুলিক্বা', 'He was created', 'তাকে সৃষ্টি করা হলো'],
  ['أَحَدٌ', 'aḥadun', 'আহাদুন', 'One', 'এক'], ['قَمَرٌ', 'qamarun', 'ক্বামারুন', 'A moon', 'চাঁদ'],
  ['شَجَرٌ', 'shajarun', 'শাজারুন', 'Trees', 'গাছ'], ['بَلَدٌ', 'baladun', 'বালাদুন', 'A land', 'শহর'],
  ['مَلَكٌ', 'malakun', 'মালাকুন', 'An angel', 'ফেরেশতা'], ['وَلَدٌ', 'waladun', 'ওয়ালাদুন', 'A child', 'সন্তান'],
  ['عَمَلٌ', 'ʿamalun', '\'আমালুন', 'A deed', 'আমল'], ['رُسُلٌ', 'rusulun', 'রুসুলুন', 'Messengers', 'রাসূলগণ'],
  ['كُتُبٌ', 'kutubun', 'কুতুবুন', 'Books', 'কিতাবসমূহ'], ['حَسَنَةٌ', 'ḥasanatun', 'হাসানাতুন', 'A good deed', 'নেকি'],
];
// The opening letters: where they are, how they are read, and the surahs they open.
const MUQ = [
  { s: 2, v: 1, en: 'Alif Lām Mīm', bn: 'আলিফ-লাম-মীম', say: 'أَلِفْ لَامْ مِيمْ', in: [2, 3, 29, 30, 31, 32] },
  { s: 7, v: 1, en: 'Alif Lām Mīm Ṣād', bn: 'আলিফ-লাম-মীম-ছোয়াদ', say: 'أَلِفْ لَامْ مِيمْ صَادْ', in: [7] },
  { s: 10, v: 1, en: 'Alif Lām Rā', bn: 'আলিফ-লাম-রা', say: 'أَلِفْ لَامْ رَا', in: [10, 11, 12, 14, 15] },
  { s: 13, v: 1, en: 'Alif Lām Mīm Rā', bn: 'আলিফ-লাম-মীম-রা', say: 'أَلِفْ لَامْ مِيمْ رَا', in: [13] },
  { s: 19, v: 1, en: 'Kāf Hā Yā ʿAyn Ṣād', bn: 'কাফ-হা-ইয়া-আইন-ছোয়াদ', say: 'كَافْ هَا يَا عَيْنْ صَادْ', in: [19] },
  { s: 20, v: 1, en: 'Ṭā Hā', bn: 'ত্বোয়া-হা', say: 'طَا هَا', in: [20] },
  { s: 26, v: 1, en: 'Ṭā Sīn Mīm', bn: 'ত্বোয়া-সীন-মীম', say: 'طَا سِينْ مِيمْ', in: [26, 28] },
  { s: 27, v: 1, en: 'Ṭā Sīn', bn: 'ত্বোয়া-সীন', say: 'طَا سِينْ', in: [27] },
  { s: 36, v: 1, en: 'Yā Sīn', bn: 'ইয়া-সীন', say: 'يَا سِينْ', in: [36] },
  { s: 38, v: 1, en: 'Ṣād', bn: 'ছোয়াদ', say: 'صَادْ', in: [38] },
  { s: 40, v: 1, en: 'Ḥā Mīm', bn: 'হা-মীম', say: 'حَا مِيمْ', in: [40, 41, 42, 43, 44, 45, 46] },
  { s: 42, v: 2, en: 'ʿAyn Sīn Qāf', bn: 'আইন-সীন-ক্বাফ', say: 'عَيْنْ سِينْ قَافْ', in: [42] },
  { s: 50, v: 1, en: 'Qāf', bn: 'ক্বাফ', say: 'قَافْ', in: [50] },
  { s: 68, v: 1, en: 'Nūn', bn: 'নূন', say: 'نُونْ', in: [68] },
];
const READ_SURAHS = [1, 112, 113, 114, 108, 103];

Object.assign(IC, {
  alifba: '<path d="M4.5 10.5c0 4.4 3.2 6.3 7.5 6.3s7.5-1.9 7.5-6.3"/><circle cx="12" cy="20.3" r="1.1"/><path d="M12 3.5v5.5"/>',
});

// =====================================================================
// Sound
// =====================================================================
const qdSleep = (ms) => new Promise((r) => setTimeout(r, ms));

/// The Quran player and the Qaida share the speaker: pause the recitation first.
function qdQuiet() {
  if (Q.p?.playing) { post('/api/quran/cmd', { cmd: 'pause' }).catch(() => {}); Q.p.playing = false; }
}

async function qdVoice(text) {
  try { await post('/api/qaida/say', { text, rate: qdSt().rate }); return true; }
  catch {
    if (QD.voice !== false) { QD.voice = false; qdVoiceBanner(); toast(qdt('voice_missing')); }
    return false;
  }
}

function qdReciter(url) {
  return new Promise((res, rej) => {
    QD.audio?.pause();
    const a = new Audio(url);
    QD.audio = a;
    a.onended = () => res();
    a.onerror = () => rej(new Error('offline'));
    a.play().catch(rej);
  });
}
const qdWordUrl = (s, v, w) => Q.meta.word_audio.replace('{s}', pad3(s)).replace('{v}', pad3(v)).replace('{w}', pad3(w));

/// Says one tile, and resolves once it has been heard.
async function qdSay(it) {
  qdQuiet();
  if (it.w) {
    try { await qdMeta(); return await qdReciter(qdWordUrl(...it.w)); }
    catch { if (!it.say) { toast(qdt('offline')); return; } }
  }
  if (it.say) await qdVoice(it.say);
}
const qdMeta = () => qMeta();

function qdStop() {
  QD.run++;
  QD.playing = false;
  QD.audio?.pause();
  post('/api/qaida/stop').catch(() => {});
  $$('.qd-t.on, .qd-t.turn').forEach((el) => el.classList.remove('on', 'turn'));
  const b = $('#qd-play');
  if (b) b.innerHTML = `${icon('play')}${esc(qdt('listen'))}`;
}

/// Listen and repeat: each tile in turn, with a pause to say it back.
async function qdPlayAll() {
  const run = ++QD.run;
  QD.playing = true;
  const b = $('#qd-play');
  if (b) b.innerHTML = `${icon('stop')}${esc(qdt('stop'))}`;
  const tiles = $$('#qd-body .qd-t[data-i]');
  const gap = qdSt().rate < 0.7 ? 1500 : 1100;
  for (const el of tiles) {
    if (run !== QD.run || !el.isConnected) return;
    el.classList.add('on');
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await qdSay(QD.items[+el.dataset.i]);
    if (run !== QD.run) return;
    el.classList.add('turn');
    await qdSleep(gap + (QD.items[+el.dataset.i].word ? 500 : 0));
    el.classList.remove('on', 'turn');
  }
  if (run === QD.run) qdStop();
}

async function qdCheckVoice() {
  if (QD.voice != null) return;
  try { QD.voice = !!(await api('/api/qaida/voice')).ar; } catch { QD.voice = false; }
  qdVoiceBanner();
}
function qdVoiceBanner() {
  const box = $('#qd-voice');
  if (!box) return;
  box.innerHTML = QD.voice === false ? `<div class="banner warn">${icon('speaker')}<div><small>${esc(qdt('voice_missing'))}</small></div><button class="btn small" data-qd="voice-fix">${esc(qdt('install'))}</button></div>` : '';
}

// =====================================================================
// Views
// =====================================================================
VIEWS.qaida = async (tok) => {
  qdStop();
  const parts = location.hash.replace(/^#\/?qaida\/?/, '').split('/').filter(Boolean);
  const lesson = LESSONS.find((x) => x.id === parts[0]);
  const quiz = !!lesson && parts[1] === 'quiz';
  document.body.classList.toggle('focus', quiz);
  if (quiz) return qdQuiz(lesson);
  if (lesson) return qdLesson(lesson, tok);
  return qdHome();
};
// Leaving a lesson stops the voice.
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/qaida')) qdStop(); });

const qdNext = (st) => LESSONS.find((x) => !st.done[x.id]);
const qdNum = (l) => LESSONS.indexOf(l) + 1;

function qdHome() {
  const st = qdSt();
  const n = LESSONS.filter((x) => st.done[x.id]).length;
  const next = qdNext(st);
  const pct = n / LESSONS.length;
  const R = 34, C = 2 * Math.PI * R;
  const steps = LESSONS.map((l, i) => {
    const done = !!st.done[l.id], cur = l === next;
    return `<a class="qd-step ${done ? 'done' : ''} ${cur ? 'cur' : ''}" href="#/qaida/${l.id}">
      <span class="qd-n">${done ? icon('check') : N(i + 1)}</span>
      <span class="qd-st"><b>${esc(tr2(l.t))}</b><small>${esc(tr2(l.s))}${st.best[l.id] != null ? ` · ${esc(qdt('best'))} ${N(st.best[l.id])}/${N(8)}` : ''}</small></span>
      <span class="qd-sample" dir="rtl" lang="ar">${l.ar}</span></a>`;
  }).join('');
  view.innerHTML = `<div class="p-page qd">${ptitle(qdt('title'))}<p class="p-sub">${esc(qdt('sub'))}</p>
    <a class="qd-hero" href="#/qaida/${(next || LESSONS[0]).id}">
      <div class="qd-hero-ar" dir="rtl" lang="ar" aria-hidden="true">${['ا', 'ب', 'ت', 'ث'].map((c, i) => `<span style="--d:${i * 0.18}s">${c}</span>`).join('')}</div>
      <div class="qd-hero-row">
        <svg class="qd-ring" viewBox="0 0 80 80"><circle cx="40" cy="40" r="${R}" class="bg"/><circle cx="40" cy="40" r="${R}" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/>
          <text x="40" y="38" text-anchor="middle">${N(n)}</text><text x="40" y="52" text-anchor="middle" class="sm">/ ${N(LESSONS.length)}</text></svg>
        <div class="qd-hero-t">${next ? `<small>${esc(qdt('lesson'))} ${N(qdNum(next))}</small><b>${esc(tr2(next.t))}</b><span>${esc(tr2(next.s))}</span>` : `<small>${esc(qdt('title'))}</small><b>${esc(qdt('all_done'))}</b><span>${esc(qdt('sub'))}</span>`}
          <span class="btn gold small">${icon('play')}${esc(n ? qdt('cont') : qdt('begin'))}</span></div></div></a>
    <div id="qd-voice"></div>
    <div class="p-head">${esc(qdt('lessons'))}</div><div class="qd-path">${steps}</div>
    <div class="p-head">${esc(qdt('settings'))}</div><div class="p-group">
      <div class="p-row"><span class="p-lab"><b>${esc(qdt('speed'))}</b></span><div class="p-seg">${[[0.55, qdt('slow')], [0.8, qdt('normal')]].map(([v, l]) => `<button class="${Math.abs(st.rate - v) < 0.13 ? 'on' : ''}" data-qd="rate" data-v="${v}">${esc(l)}</button>`).join('')}</div></div>
      <div class="p-row"><span class="p-lab"><b>${esc(qdt('tl'))}</b><small>${esc(qdt('tl_d'))}</small></span><button class="toggle ${st.tl ? 'on' : ''}" data-qd="tl" role="switch" aria-checked="${st.tl}"></button></div></div>
    <div class="p-foot">${esc(qdt('note'))}</div></div>`;
  qdVoiceBanner();
  qdCheckVoice();
}

/// One tile; its sound is looked up by index when tapped.
function qdTile(it, st) {
  if (!it) return '<span class="qd-t blank"></span>';
  const i = QD.items.push(it) - 1;
  const sound = st.tl ? (B() ? it.bn : it.en) : '';
  const cls = ['qd-t', it.g ? `g-${it.g}` : '', it.h ? 'heavy' : '', it.word ? 'word' : '', it.small ? 'small' : '', it.name ? 'name' : ''].join(' ');
  return `<button class="${cls}" data-qd="say" data-i="${i}"><span class="qd-ar" dir="rtl" lang="ar">${it.ar}</span>${it.name ? `<span class="qd-nm">${esc(B() ? it.bn : it.en)}</span>` : sound ? `<span class="qd-snd">${esc(sound)}</span>` : ''}${it.mean ? `<span class="qd-mean">${esc(tr2(it.mean))}</span>` : ''}</button>`;
}

async function qdLesson(l, tok) {
  const st = qdSt();
  QD.items = [];
  const i = qdNum(l);
  const nextL = LESSONS[i];
  const legend = (l.legend || []).map((k) => `<span class="qd-chip c-${k}"><i></i>${esc(qdt(k))}</span>`).join('');
  view.innerHTML = `<div class="p-page qd">${ptitle(tr2(l.t), '#/qaida')}
    <div class="qd-intro"><small>${esc(qdt('lesson'))} ${N(i)} / ${N(LESSONS.length)}</small><div class="qd-intro-ar" dir="rtl" lang="ar">${l.ar}</div><p>${qdInline(tr2(l.d))}</p>${legend ? `<div class="qd-legend">${legend}</div>` : ''}</div>
    <div id="qd-voice"></div>
    <div class="qd-acts ${l.quran ? 'one' : ''}"><button class="btn gold" id="qd-play" data-qd="play">${icon('play')}${esc(qdt('listen'))}</button>${l.quran ? '' : `<a class="btn ghost" href="#/qaida/${l.id}/quiz">${icon('target')}${esc(qdt('quiz'))}</a>`}</div>
    <p class="qd-hint">${esc(l.quran ? qdt('words_tap') : qdt('tap_hint'))}</p>
    <div id="qd-body"></div>
    <div class="qd-end">${l.quran ? `<button class="btn gold" data-qd="finish" data-id="${l.id}">${icon('check')}${esc(QDT.good[B() ? 1 : 0])}</button>` : `<a class="btn gold" href="#/qaida/${l.id}/quiz">${icon('target')}${esc(qdt('take_quiz'))}</a>`}
      ${nextL ? `<a class="qd-nextl" href="#/qaida/${nextL.id}"><small>${esc(qdt('next_lesson'))}</small><b>${esc(tr2(nextL.t))}</b>${icon('chevR')}</a>` : ''}</div></div>`;
  qdVoiceBanner();
  qdCheckVoice();
  const body = $('#qd-body');
  if (l.id === 'muqattaat') body.innerHTML = await qdMuqattaat(st);
  else if (l.id === 'reading') return qdReading(st, tok);
  else body.innerHTML = l.build().map((g) => qdGroup(g, st)).join('');
}

function qdGroup(g, st) {
  const head = g.h ? `<div class="p-head">${esc(tr2(g.h))}</div>` : '';
  const p = g.p ? `<p class="qd-gp">${esc(tr2(g.p))}</p>` : '';
  if (g.grid) return `${head}${p}<div class="qd-grid c${g.grid}" dir="rtl">${g.items.map((it) => qdTile(it, st)).join('')}</div>`;
  return `${head}${p}<div class="qd-rows">${g.rows.map((r) => `<div class="qd-row ${r.mark ? `m-${r.mark}` : ''}" dir="rtl" style="--n:${g.cols || r.items.length}">${r.items.map((it) => qdTile(it, st)).join('')}</div>`).join('')}</div>`;
}

async function qdMuqattaat(st) {
  await qMeta();
  const ars = await Promise.all(MUQ.map((m) => qAr(m.s)));
  return `<div class="qd-muq">${MUQ.map((m, k) => {
    const it = { ar: qdBare(ars[k][m.v - 1].i[0]), say: m.say, en: m.en, bn: m.bn, w: [m.s, m.v, 1] };
    const where = m.in.map((s) => cname(Q.meta.chapters[s - 1])).join(', ');
    return `<div class="qd-mq">${qdTile(it, st).replace('class="qd-t', 'class="qd-t muq')}<div class="qd-mq-t"><b>${esc(B() ? m.bn : m.en)}</b><small>${esc(qdt('opens'))} ${N(m.in.length)}${B() ? '' : ' '}${esc(B() ? qdt('surahs') : (m.in.length === 1 ? 'surah' : 'surahs'))}: ${esc(where)}</small></div></div>`;
  }).join('')}</div>`;
}

async function qdReading(st, tok) {
  await qMeta();
  const s = QD.surah;
  const [ar, wen, wbn] = await Promise.all([qAr(s), qWbw('en', s), qWbw('bn', s).catch(() => null)]);
  if (!live(tok)) return;
  QD.items = [];
  const chips = READ_SURAHS.map((k) => `<button class="${k === s ? 'on' : ''}" data-qd="surah" data-s="${k}">${esc(cname(Q.meta.chapters[k - 1]))}</button>`).join('');
  const verses = ar.map((a, vi) => `<div class="qd-verse" dir="rtl">${a.i.map((w, wi) => {
    const it = { ar: esc(qdBare(w)), w: [s, vi + 1, wi + 1], en: wen?.[vi]?.[wi]?.[1] || '', bn: wen?.[vi]?.[wi]?.[1] || '', mean: [wen?.[vi]?.[wi]?.[0] || '', wbn?.[vi]?.[wi] || wen?.[vi]?.[wi]?.[0] || ''], word: true };
    return qdTile(it, st);
  }).join('')}<span class="qd-vn">${AR_DIGITS(vi + 1)}</span></div>`).join('');
  $('#qd-body').innerHTML = `<div class="qd-surahs">${chips}</div>${s !== 1 && s !== 9 ? '<div class="qd-bism" dir="rtl" lang="ar">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>' : ''}<div class="qd-read">${verses}</div>`;
}

// ---------- The quiz ----------
const QN = 8;
function qdPool(l) {
  const out = [];
  for (const g of l.build()) for (const it of g.items || g.rows.flatMap((r) => r.items)) if (it && it.say) out.push(it);
  // Only one of each sound (the joined forms all say the same name).
  const seen = new Set();
  return out.filter((it) => !seen.has(it.say) && seen.add(it.say));
}
const qdShuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function qdQuiz(l) {
  const pool = qdPool(l);
  const picks = qdShuffle(pool.slice()).slice(0, QN);
  const qs = picks.map((ans, k) => {
    // Hard choices: the same letter with other vowels, or other letters with the same vowel.
    const near = pool.filter((x) => x !== ans && (x.letter === ans.letter || (x.en && ans.en && x.en.slice(-2) === ans.en.slice(-2))));
    const rest = pool.filter((x) => x !== ans && !near.includes(x));
    const opts = qdShuffle([ans, ...qdShuffle(near).slice(0, 2), ...qdShuffle(rest)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 4));
    // In the letters lesson, every other question shows the letter and asks its name.
    return { ans, opts, name: l.id === 'letters' && k % 2 === 1 };
  });
  QD.quiz = { l, qs, i: 0, right: 0, locked: false };
  view.innerHTML = `<div class="qd-quiz">
    <div class="sg-bar"><a class="sg-close" href="#/qaida/${l.id}" aria-label="close">${icon('x')}</a><b>${esc(tr2(l.t))}</b><span id="qd-count"></span></div>
    <div class="sg-seg">${qs.map((_, k) => `<i data-k="${k}"></i>`).join('')}</div>
    <div id="qd-q"></div></div>`;
  qdAsk();
}

function qdAsk() {
  const z = QD.quiz, q = z.qs[z.i];
  z.locked = false;
  $$('.qd-quiz .sg-seg i').forEach((el, k) => { if (k === z.i) el.classList.add('on'); });
  $('#qd-count').textContent = `${N(z.i + 1)} / ${N(z.qs.length)}`;
  const opt = (it, k) => q.name
    ? `<button class="qd-opt txt" data-qd="ans" data-k="${k}">${esc(B() ? it.bn : it.en)}</button>`
    : `<button class="qd-opt" data-qd="ans" data-k="${k}"><span dir="rtl" lang="ar">${it.ar}</span></button>`;
  $('#qd-q').innerHTML = `<div class="qd-qbox">
    <p class="qd-prompt">${esc(q.name ? qdt('which_name') : qdt('which'))}</p>
    ${q.name ? `<div class="qd-show" dir="rtl" lang="ar">${q.ans.ar}</div>` : `<button class="qd-listen" data-qd="replay" aria-label="${esc(qdt('again'))}">${icon('speaker')}<span>${esc(qdt('again'))}</span></button>`}
    <div class="qd-opts ${q.name ? 'names' : ''}">${q.opts.map(opt).join('')}</div></div>`;
  if (!q.name) setTimeout(() => qdReplay(), 350);
}

function qdReplay() {
  const b = $('.qd-listen');
  b?.classList.add('on');
  qdSay(QD.quiz.qs[QD.quiz.i].ans).finally(() => b?.classList.remove('on'));
}

async function qdAnswer(k, el) {
  const z = QD.quiz, q = z.qs[z.i];
  if (z.locked) return;
  z.locked = true;
  const ok = q.opts[k] === q.ans;
  const seg = $(`.qd-quiz .sg-seg i[data-k="${z.i}"]`);
  seg.className = ok ? 'done' : 'miss';
  el.classList.add(ok ? 'right' : 'wrong');
  if (!ok) $$('.qd-opt')[q.opts.indexOf(q.ans)].classList.add('right');
  nativeUi('haptic', ok ? '' : 'long');
  if (ok) z.right++;
  // Hear the right answer: a name question says the name; a wrong answer repeats the sound.
  if (q.name || !ok) await qdSay(q.ans);
  await qdSleep(ok ? 650 : 1100);
  if (!$('#qd-q')) return;
  if (++z.i < z.qs.length) qdAsk(); else qdResult();
}

function qdResult() {
  const z = QD.quiz, l = z.l, st = qdSt();
  const pass = z.right >= 6;
  if (pass) st.done[l.id] = Date.now();
  st.best[l.id] = Math.max(st.best[l.id] || 0, z.right);
  qdSave(st);
  nativeUi('haptic', 'long');
  const nextL = LESSONS[qdNum(l)];
  const R = 52, C = 2 * Math.PI * R;
  $('#qd-q').innerHTML = `<div class="qd-res ${pass ? 'pass' : ''}">
    <svg class="qd-ring big" viewBox="0 0 120 120"><circle cx="60" cy="60" r="${R}" class="bg"/><circle cx="60" cy="60" r="${R}" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="--to:${C * (1 - z.right / z.qs.length)}"/>
      <text x="60" y="58" text-anchor="middle">${N(z.right)}</text><text x="60" y="78" text-anchor="middle" class="sm">/ ${N(z.qs.length)}</text></svg>
    <h2>${esc(pass ? (z.right === z.qs.length ? qdt('great') : qdt('good')) : qdt('retry_t'))}</h2>
    ${pass ? '' : `<p>${esc(qdt('need'))}</p>`}
    <div class="qd-res-b">${pass && nextL ? `<a class="btn gold" href="#/qaida/${nextL.id}">${esc(qdt('next_lesson'))}${icon('chevR')}</a>` : ''}
      <button class="btn ${pass ? 'ghost' : 'gold'}" data-qd="retry">${icon('undo')}${esc(qdt('try_again'))}</button>
      <a class="btn ghost" href="#/qaida">${esc(qdt('back_list'))}</a></div></div>`;
  $$('.qd-quiz .sg-seg i').forEach((el) => el.classList.remove('on'));
  if (pass) toast(`${tr2(l.t)} ✓`);
}

// ---------- Events ----------
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-qd]');
  if (!a) return;
  const d = a.dataset;
  switch (d.qd) {
    case 'say': {
      if (QD.playing) qdStop();
      QD.run++;
      $$('.qd-t.on').forEach((el) => el.classList.remove('on', 'turn'));
      a.classList.add('on');
      nativeUi('haptic');
      await qdSay(QD.items[+d.i]);
      a.classList.remove('on');
      break;
    }
    case 'play': if (QD.playing) qdStop(); else qdPlayAll(); break;
    case 'surah': qdStop(); QD.surah = +d.s; qdReading(qdSt(), renderToken); break;
    case 'finish': { const st = qdSt(); st.done[d.id] = Date.now(); qdSave(st); nativeUi('haptic', 'long'); toast(`${tr2(LESSONS.find((x) => x.id === d.id).t)} ✓`); location.hash = '#/qaida'; break; }
    case 'replay': qdReplay(); break;
    case 'ans': qdAnswer(+d.k, a); break;
    case 'retry': qdQuiz(QD.quiz.l); break;
    case 'rate': { const st = qdSt(); st.rate = +d.v; qdSave(st); $$('[data-qd="rate"]').forEach((b) => b.classList.toggle('on', b === a)); qdVoice(LET[1].n); break; }
    case 'tl': { const st = qdSt(); st.tl = !st.tl; qdSave(st); a.classList.toggle('on', st.tl); a.setAttribute('aria-checked', st.tl); break; }
    case 'voice-fix': QD.voice = null; await post('/api/quran/voice-install'); break;
  }
});
// Coming back from the voice settings: look again.
document.addEventListener('visibilitychange', () => { if (!document.hidden && QD.voice === false && route() === 'qaida') { QD.voice = null; qdCheckVoice(); } });
