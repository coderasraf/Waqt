'use strict';
// Waqt Kids (phones): a bright, simple space for children — learn to read
// (the Qaida), memorise short surahs with a reciter, everyday duas and the
// Kalima, stories of the prophets, a daily good-deeds chart and an easy quiz,
// with stars for everything learned. Kids mode locks the app here: the app
// opens in Kids, the usual bars are hidden, a home button always leads back,
// and only a two-second press on the lock lets a parent out. Kids pages
// always use their own warm, light palette.

const KD = { quiz: null, hold: 0 };
const kdLoad = () => { try { return JSON.parse(localStorage.getItem('kids') || '{}'); } catch { return {}; } };
const kdSt = () => ({ name: '', mode: false, duas: {}, surahs: {}, deeds: {}, qz: 0, ...kdLoad() });
const kdSave = (st) => { try { localStorage.setItem('kids', JSON.stringify(st)); } catch { /* private mode */ } };
const kb = (pair) => pair[L() === 'bn' ? 1 : 0];
const kdToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/// Stars: 3 for each dua or kalima learned, 5 for each surah, 1 for each good deed and each right answer.
const kdStars = (st) => Object.keys(st.duas).length * 3 + Object.keys(st.surahs).length * 5 + Object.values(st.deeds).reduce((a, d) => a + Object.keys(d).length, 0) + (st.qz || 0);

const KT = {
  title: ['Kids', 'শিশুদের জন্য'], hi: ['Assalamu alaikum', 'আসসালামু আলাইকুম'], friend: ['little friend', 'ছোট্ট বন্ধু'], stars: ['stars', 'টি তারা'],
  learn: ['Learn', 'শিখি'], grow: ['Every day', 'প্রতিদিন'],
  qaida: ['Learn to read', 'কুরআন পড়া শিখি'], qaida_d: ['Alif, ba, ta…', 'আলিফ, বা, তা…'],
  surahs: ['Short surahs', 'ছোট সূরা'], surahs_d: ['Listen and say it with the qari', 'কারির সাথে শুনে বলি'],
  duas: ['Little duas', 'ছোট দোয়া'], duas_d: ['For eating, sleeping and more', 'খাওয়া, ঘুম ও আরও'],
  kalima: ['The Kalima', 'কালিমা'], kalima_d: ['The words of our faith', 'আমাদের ঈমানের কথা'],
  stories: ['Prophet stories', 'নবীদের গল্প'], stories_d: ['Listen like a bedtime story', 'ঘুমের আগের গল্পের মতো শুনি'],
  salah: ['Learn salah', 'নামাজ শিখি'], salah_d: ['Step by step', 'ধাপে ধাপে'],
  names: ['Names of Allah', 'আল্লাহর নাম'], names_d: ['99 beautiful names', '৯৯টি সুন্দর নাম'],
  deeds: ['My good deeds', 'আমার ভালো কাজ'], deeds_d: ['Collect a star for each', 'প্রতিটির জন্য একটি তারা'],
  quiz: ['Quiz time', 'কুইজ খেলি'], quiz_d: ['10 easy questions', '১০টি সহজ প্রশ্ন'],
  learned: ['I learned it!', 'শিখে ফেলেছি!'], learned_on: ['Learned', 'শেখা হয়েছে'], know: ['I can say it!', 'মুখস্থ হয়েছে!'], listen: ['Listen', 'শুনি'], stop: ['Stop', 'থামি'],
  how: ['Say it like this', 'এভাবে বলি'], means: ['It means', 'এর অর্থ'], today: ['Today', 'আজ'], week: ['This week', 'এই সপ্তাহ'],
  great: ['Masha\'Allah!', 'মাশাআল্লাহ!'], right: ['Right!', 'সঠিক!'], oops: ['Not quite — the answer is', 'হয়নি — সঠিক উত্তর'], again: ['Play again', 'আবার খেলি'], home: ['Home', 'হোম'],
  done_q: ['You got', 'তুমি পেয়েছ'], of10: ['of 10', '/ ১০'],
  parents: ['For parents', 'অভিভাবকদের জন্য'], name: ['Child\'s name', 'শিশুর নাম'], name_ph: ['Name', 'নাম'],
  lock: ['Kids mode', 'কিডস মোড'], lock_d: ['Waqt opens here, the usual menus are hidden, and only a parent can leave by pressing and holding the lock for two seconds.', 'ওয়াক্ত এখানেই খুলবে, সাধারণ মেনু লুকানো থাকবে, আর তালা দুই সেকেন্ড চেপে ধরে শুধু অভিভাবক বের হতে পারবেন।'],
  hold: ['Hold to leave Kids mode', 'কিডস মোড ছাড়তে চেপে ধরুন'], leave: ['Leave Kids', 'শিশুদের অংশ থেকে বের হন'], left: ['Kids mode is off', 'কিডস মোড বন্ধ'], on: ['Kids mode is on', 'কিডস মোড চালু'],
};
const kt = (k) => kb(KT[k]);

// ---------- Content ----------
// Short, everyday duas, each from the Quran or an authentic hadith.
const KDUAS = [
  { k: 'eat', ic: '#ff8a3d', t: ['Before eating', 'খাওয়ার আগে'], ar: 'بِسْمِ اللّٰهِ', tr: 'Bismillāh', en: 'In the name of Allah.', bn: 'আল্লাহর নামে।', src: 'Tirmidhi 1858', note: ['If you forget, say: Bismillāhi awwalahū wa ākhirah.', 'ভুলে গেলে বলো: বিসমিল্লাহি আউয়ালাহু ওয়া আখিরাহু।'] },
  { k: 'ate', ic: '#30a46c', t: ['After eating', 'খাওয়ার পরে'], ar: 'الْحَمْدُ لِلّٰهِ الَّذِي أَطْعَمَنِي هٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', tr: 'Al-ḥamdu lillāhil-ladhī aṭ‘amanī hādhā wa razaqanīhi min ghayri ḥawlin minnī wa lā quwwah.', en: 'All praise is for Allah, who fed me this and gave it to me without any power or strength of my own.', bn: 'সব প্রশংসা আল্লাহর, যিনি আমাকে এটি খাইয়েছেন এবং আমার কোনো শক্তি ও সামর্থ্য ছাড়াই আমাকে এটি দিয়েছেন।', src: 'Abu Dawud 4023, Tirmidhi 3458' },
  { k: 'sleep', ic: '#5b5bd6', t: ['Before sleeping', 'ঘুমানোর আগে'], ar: 'بِاسْمِكَ اللّٰهُمَّ أَمُوتُ وَأَحْيَا', tr: 'Bismika-llāhumma amūtu wa aḥyā.', en: 'In Your name, O Allah, I die and I live.', bn: 'হে আল্লাহ, তোমার নামেই আমি মরি ও বাঁচি।', src: 'Sahih al-Bukhari 6324' },
  { k: 'wake', ic: '#f5b83d', t: ['When I wake up', 'ঘুম থেকে উঠে'], ar: 'الْحَمْدُ لِلّٰهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', tr: 'Al-ḥamdu lillāhil-ladhī aḥyānā ba‘da mā amātanā wa ilayhin-nushūr.', en: 'All praise is for Allah, who gave us life after He made us die, and to Him is the return.', bn: 'সব প্রশংসা আল্লাহর, যিনি আমাদের মৃত্যুর (ঘুমের) পর জীবিত করেছেন, আর তাঁর কাছেই ফিরে যেতে হবে।', src: 'Sahih al-Bukhari 6324' },
  { k: 'home', ic: '#0091ff', t: ['Leaving home', 'ঘর থেকে বের হওয়ার সময়'], ar: 'بِسْمِ اللّٰهِ، تَوَكَّلْتُ عَلَى اللّٰهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ', tr: 'Bismillāh, tawakkaltu ‘ala-llāh, wa lā ḥawla wa lā quwwata illā billāh.', en: 'In the name of Allah, I trust in Allah, and there is no power or strength except with Allah.', bn: 'আল্লাহর নামে, আল্লাহর ওপর ভরসা করলাম; আল্লাহর সাহায্য ছাড়া কোনো শক্তি ও সামর্থ্য নেই।', src: 'Abu Dawud 5095, Tirmidhi 3426' },
  { k: 'toilet', ic: '#12a594', t: ['Entering the toilet', 'টয়লেটে ঢোকার আগে'], ar: 'اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ', tr: 'Allāhumma innī a‘ūdhu bika minal-khubuthi wal-khabā’ith.', en: 'O Allah, I seek Your protection from all bad and evil things.', bn: 'হে আল্লাহ, আমি তোমার কাছে সব অপবিত্র ও খারাপ জিনিস থেকে আশ্রয় চাই।', src: 'Sahih al-Bukhari 142' },
  { k: 'toilet_out', ic: '#12a594', t: ['Leaving the toilet', 'টয়লেট থেকে বের হয়ে'], ar: 'غُفْرَانَكَ', tr: 'Ghufrānak.', en: 'I ask for Your forgiveness.', bn: 'আমি তোমার ক্ষমা চাই।', src: 'Abu Dawud 30, Tirmidhi 7' },
  { k: 'sneeze', ic: '#e93d82', t: ['When I sneeze', 'হাঁচি দিলে'], ar: 'الْحَمْدُ لِلّٰهِ', tr: 'Al-ḥamdu lillāh.', en: 'All praise is for Allah.', bn: 'সব প্রশংসা আল্লাহর।', src: 'Sahih al-Bukhari 6224', note: ['Whoever hears it says: Yarḥamuka-llāh (May Allah have mercy on you).', 'যে শোনে সে বলবে: ইয়ারহামুকাল্লাহ (আল্লাহ তোমার প্রতি রহম করুন)।'] },
  { k: 'salam', ic: '#30a46c', t: ['Greeting', 'সালাম'], ar: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ', tr: 'As-salāmu ‘alaykum wa raḥmatu-llāhi wa barakātuh.', en: 'Peace be upon you, and the mercy of Allah and His blessings.', bn: 'তোমার ওপর শান্তি, আল্লাহর রহমত ও বরকত বর্ষিত হোক।', src: 'Abu Dawud 5195, Tirmidhi 2689', note: ['The reply: Wa ‘alaykumus-salām wa raḥmatu-llāhi wa barakātuh.', 'উত্তর: ওয়া আলাইকুমুস সালাম ওয়া রাহমাতুল্লাহি ওয়া বারাকাতুহ।'] },
  { k: 'parents', ic: '#ff6b61', t: ['For my parents', 'মা-বাবার জন্য'], ar: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', tr: 'Rabbir-ḥamhumā kamā rabbayānī ṣaghīrā.', en: 'My Lord, have mercy on them as they raised me when I was small.', bn: 'হে আমার রব, তাঁদের প্রতি দয়া করো, যেমন তাঁরা ছোটবেলায় আমাকে লালন-পালন করেছেন।', src: 'Al-Isra 17:24' },
  { k: 'learn', ic: '#8e4ec6', t: ['To learn more', 'জ্ঞান বাড়ানোর জন্য'], ar: 'رَبِّ زِدْنِي عِلْمًا', tr: 'Rabbi zidnī ‘ilmā.', en: 'My Lord, increase me in knowledge.', bn: 'হে আমার রব, আমার জ্ঞান বাড়িয়ে দাও।', src: 'Ta-Ha 20:114' },
  { k: 'thanks', ic: '#d99a1e', t: ['Saying thank you', 'ধন্যবাদ জানাতে'], ar: 'جَزَاكَ اللّٰهُ خَيْرًا', tr: 'Jazāka-llāhu khayrā.', en: 'May Allah reward you with good.', bn: 'আল্লাহ তোমাকে উত্তম প্রতিদান দিন।', src: 'Tirmidhi 2035' },
  { k: 'angry', ic: '#6b7690', t: ['When I feel angry', 'রাগ হলে'], ar: 'أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', tr: 'A‘ūdhu billāhi minash-shayṭānir-rajīm.', en: 'I seek protection with Allah from Shaytan, the rejected one.', bn: 'আমি বিতাড়িত শয়তান থেকে আল্লাহর আশ্রয় চাই।', src: 'Sahih al-Bukhari 3282' },
];
const KALIMA = [
  { k: 'kalima1', ic: '#30a46c', t: ['Kalima Tayyibah', 'কালিমা তাইয়্যিবা'], ar: 'لَا إِلٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَسُولُ اللّٰهِ', tr: 'Lā ilāha illa-llāhu Muḥammadur-rasūlu-llāh.', en: 'There is no god but Allah; Muhammad is the Messenger of Allah.', bn: 'আল্লাহ ছাড়া কোনো উপাস্য নেই, মুহাম্মাদ ﷺ আল্লাহর রাসূল।', src: '' },
  { k: 'kalima2', ic: '#0091ff', t: ['Kalima Shahadah', 'কালিমা শাহাদাত'], ar: 'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', tr: 'Ash-hadu an lā ilāha illa-llāhu wa ash-hadu anna Muḥammadan ‘abduhū wa rasūluh.', en: 'I bear witness that there is no god but Allah, and I bear witness that Muhammad is His servant and Messenger.', bn: 'আমি সাক্ষ্য দিচ্ছি যে আল্লাহ ছাড়া কোনো উপাস্য নেই, এবং সাক্ষ্য দিচ্ছি যে মুহাম্মাদ ﷺ তাঁর বান্দা ও রাসূল।', src: 'Sahih Muslim 234' },
];
const KSURAHS = [1, 112, 113, 114, 108, 103, 110, 111, 109, 105, 106, 107];
const KDEEDS = [
  ['pray', ['I prayed my salah', 'নামাজ পড়েছি'], 'pray', '#30a46c'], ['quran', ['I read Quran', 'কুরআন পড়েছি'], 'book', '#0091ff'],
  ['bismillah', ['I said Bismillah', 'বিসমিল্লাহ বলেছি'], 'sparkle', '#f5b83d'], ['parents', ['I helped my parents', 'মা-বাবাকে সাহায্য করেছি'], 'heart', '#e93d82'],
  ['salam', ['I gave salam', 'সালাম দিয়েছি'], 'bubble', '#12a594'], ['truth', ['I told the truth', 'সত্য কথা বলেছি'], 'check', '#5b5bd6'],
  ['kind', ['I was kind to someone', 'কারও সাথে ভালো ব্যবহার করেছি'], 'hand', '#ff8a3d'], ['sleepdua', ['I read my bedtime dua', 'ঘুমের দোয়া পড়েছি'], 'moonz', '#3f3db8'],
];
// [question, answer, wrong, wrong] in English and Bengali.
const KQUIZ = [
  [['How many daily prayers are there?', 'দিনে কত ওয়াক্ত নামাজ?'], ['5', '৫'], ['3', '৩'], ['7', '৭']],
  [['Which is the first prayer of the day?', 'দিনের প্রথম নামাজ কোনটি?'], ['Fajr', 'ফজর'], ['Isha', 'এশা'], ['Asr', 'আসর']],
  [['What is our holy book?', 'আমাদের পবিত্র কিতাবের নাম কী?'], ['The Quran', 'কুরআন'], ['A storybook', 'গল্পের বই'], ['A dictionary', 'অভিধান']],
  [['How many surahs are in the Quran?', 'কুরআনে কয়টি সূরা আছে?'], ['114', '১১৪'], ['30', '৩০'], ['99', '৯৯']],
  [['Which is the first surah of the Quran?', 'কুরআনের প্রথম সূরা কোনটি?'], ['Al-Fatiha', 'আল-ফাতিহা'], ['Al-Ikhlas', 'আল-ইখলাস'], ['An-Nas', 'আন-নাস']],
  [['In which month do we fast?', 'কোন মাসে আমরা রোজা রাখি?'], ['Ramadan', 'রমজান'], ['Muharram', 'মুহাররম'], ['Shawwal', 'শাওয়াল']],
  [['Who is the last prophet?', 'শেষ নবী কে?'], ['Muhammad ﷺ', 'মুহাম্মাদ ﷺ'], ['Musa (AS)', 'মূসা (আ.)'], ['Nuh (AS)', 'নূহ (আ.)']],
  [['Who built the ark?', 'কে নৌকা (কিশতি) বানিয়েছিলেন?'], ['Nuh (AS)', 'নূহ (আ.)'], ['Yusuf (AS)', 'ইউসুফ (আ.)'], ['Dawud (AS)', 'দাউদ (আ.)']],
  [['Who was swallowed by a big fish?', 'কাকে বড় মাছ গিলে ফেলেছিল?'], ['Yunus (AS)', 'ইউনুস (আ.)'], ['Ibrahim (AS)', 'ইবরাহিম (আ.)'], ['Isa (AS)', 'ঈসা (আ.)']],
  [['Who built the Kaaba with his son?', 'কে ছেলের সাথে কাবা নির্মাণ করেছিলেন?'], ['Ibrahim (AS)', 'ইবরাহিম (আ.)'], ['Adam (AS)', 'আদম (আ.)'], ['Sulayman (AS)', 'সুলাইমান (আ.)']],
  [['Who was the first human?', 'প্রথম মানুষ কে?'], ['Adam (AS)', 'আদম (আ.)'], ['Nuh (AS)', 'নূহ (আ.)'], ['Idris (AS)', 'ইদরিস (আ.)']],
  [['Which prophet understood the ants and the birds?', 'কোন নবী পিঁপড়া ও পাখির কথা বুঝতেন?'], ['Sulayman (AS)', 'সুলাইমান (আ.)'], ['Harun (AS)', 'হারুন (আ.)'], ['Yahya (AS)', 'ইয়াহইয়া (আ.)']],
  [['Who was the mother of Isa (AS)?', 'ঈসা (আ.)-এর মায়ের নাম কী?'], ['Maryam', 'মারইয়াম'], ['Hajar', 'হাজেরা'], ['Asiyah', 'আসিয়া']],
  [['Which way do we face when we pray?', 'নামাজে আমরা কোন দিকে মুখ করি?'], ['Towards the Kaaba', 'কাবার দিকে'], ['Towards the sun', 'সূর্যের দিকে'], ['Any way', 'যেকোনো দিকে']],
  [['What do we say before eating?', 'খাওয়ার আগে কী বলি?'], ['Bismillah', 'বিসমিল্লাহ'], ['Alhamdulillah', 'আলহামদুলিল্লাহ'], ['Allahu Akbar', 'আল্লাহু আকবার']],
  [['What do we say when we sneeze?', 'হাঁচি দিলে কী বলি?'], ['Alhamdulillah', 'আলহামদুলিল্লাহ'], ['Bismillah', 'বিসমিল্লাহ'], ['Subhanallah', 'সুবহানাল্লাহ']],
  [['How do Muslims greet each other?', 'মুসলিমরা একে অপরকে কীভাবে সম্ভাষণ করে?'], ['Assalamu alaikum', 'আসসালামু আলাইকুম'], ['Good morning', 'শুভ সকাল'], ['Hello', 'হ্যালো']],
  [['In which city was the Prophet ﷺ born?', 'নবী ﷺ কোন শহরে জন্মগ্রহণ করেন?'], ['Makkah', 'মক্কা'], ['Madinah', 'মদিনা'], ['Dhaka', 'ঢাকা']],
  [['Which angel brought the Quran to the Prophet ﷺ?', 'কোন ফেরেশতা নবী ﷺ-এর কাছে কুরআন এনেছিলেন?'], ['Jibril', 'জিবরাইল'], ['Mikail', 'মিকাইল'], ['Israfil', 'ইসরাফিল']],
  [['How many pillars does Islam have?', 'ইসলামের স্তম্ভ কয়টি?'], ['5', '৫'], ['4', '৪'], ['10', '১০']],
  [['Which night is better than a thousand months?', 'কোন রাত হাজার মাসের চেয়ে উত্তম?'], ['Laylatul Qadr', 'শবে কদর'], ['New Year\'s night', 'নববর্ষের রাত'], ['Every Friday night', 'প্রতি শুক্রবার রাত']],
  [['Which Eid comes after Ramadan?', 'রমজানের পর কোন ঈদ আসে?'], ['Eid al-Fitr', 'ঈদুল ফিতর'], ['Eid al-Adha', 'ঈদুল আজহা'], ['No Eid', 'কোনো ঈদ না']],
  [['How many rak\'ah is the fard of Fajr?', 'ফজরের ফরজ কত রাকাত?'], ['2', '২'], ['4', '৪'], ['3', '৩']],
  [['What do we do before salah to be clean?', 'নামাজের আগে পবিত্র হতে কী করি?'], ['Wudu', 'অজু'], ['Sleep', 'ঘুমাই'], ['Eat', 'খাই']],
  [['Which is the shortest surah?', 'সবচেয়ে ছোট সূরা কোনটি?'], ['Al-Kawthar', 'আল-কাউসার'], ['Al-Baqarah', 'আল-বাকারা'], ['Yasin', 'ইয়াসিন']],
  [['What is the special prayer on Friday?', 'শুক্রবারের বিশেষ নামাজ কোনটি?'], ['Jumu\'ah', 'জুমা'], ['Eid', 'ঈদ'], ['Tahajjud', 'তাহাজ্জুদ']],
  [['What do we give from our wealth every year?', 'প্রতি বছর সম্পদ থেকে আমরা কী দিই?'], ['Zakat', 'যাকাত'], ['Nothing', 'কিছুই না'], ['A gift to ourselves', 'নিজেকে উপহার']],
  [['In which city is the Prophet\'s ﷺ mosque?', 'নবী ﷺ-এর মসজিদ কোন শহরে?'], ['Madinah', 'মদিনা'], ['Makkah', 'মক্কা'], ['Cairo', 'কায়রো']],
];

// ---------- The kids palette, the lock and the way home ----------
const KID_ROUTES = ['kids', 'qaida', 'salah', 'names', 'prophets', 'quran'];
/// Entering Kids starts the children's space: everything opened from it is for
/// children too, until you leave for a page outside it. Kids mode (the lock)
/// keeps you in it.
const kdSpace = { get: () => { try { return sessionStorage.getItem('kids-space') === '1'; } catch { return false; } },
  set: (v) => { try { if (v) sessionStorage.setItem('kids-space', '1'); else sessionStorage.removeItem('kids-space'); } catch { /* private mode */ } } };
/// Returns false when it has sent the child back to Kids instead.
function kdSync() {
  const st = kdSt();
  const r = route();
  const onKids = r === 'kids';
  const root = document.documentElement;
  if (onKids) kdSpace.set(true);
  else if (!KID_ROUTES.includes(r) && !st.mode) kdSpace.set(false);
  // In the children's space every page uses the warm palette, the children's pictures and child-sized controls.
  const kidLook = KID_ROUTES.includes(r) && (onKids || st.mode || kdSpace.get());
  if (kidLook && !root.hasAttribute('data-kids')) {
    root.dataset.kidsPrev = `${root.dataset.theme || ''}|${root.hasAttribute('data-light') ? 1 : 0}`;
    root.setAttribute('data-kids', '');
    root.setAttribute('data-light', '');
    nativeUi('theme', 'light,#fff8ee');
  } else if (!kidLook && root.hasAttribute('data-kids')) {
    root.removeAttribute('data-kids');
    if (root.dataset.kidsPrev?.endsWith('|0')) root.removeAttribute('data-light');
    delete root.dataset.kidsPrev;
    applyTheme();
  }
  document.body.classList.toggle('kidsmode', !!st.mode);
  document.body.classList.toggle('kidspace', kidLook);
  // In Kids mode, only the children's pages; a home button on the ones outside Kids.
  if (st.mode && !KID_ROUTES.includes(r)) { location.hash = '#/kids'; return false; }
  let home = $('#kd-home');
  if (kidLook && !onKids) {
    if (!home) { home = document.createElement('a'); home.id = 'kd-home'; home.href = '#/kids'; document.body.appendChild(home); }
    home.innerHTML = `<img src="/kids/kalima.webp" alt=""><span>${esc(kt('home'))}</span>`;
  } else home?.remove();
  return true;
}
window.addEventListener('hashchange', () => setTimeout(kdSync, 0));
// Every page sets the look before it draws, so the first frame is already right.
for (const k of Object.keys(VIEWS)) {
  const base = VIEWS[k];
  VIEWS[k] = (tok) => (kdSync() === false ? undefined : base(tok));
}
// Opening the app in Kids mode starts in Kids.
if (kdSt().mode && route() === 'today') location.hash = '#/kids';
setTimeout(kdSync, 0);

// =====================================================================
// Views
// =====================================================================
VIEWS.kids = async (tok) => {
  kdSync();
  const [page, arg] = location.hash.replace(/^#\/?kids\/?/, '').split('/');
  document.body.classList.toggle('focus', page === 'quiz');
  if (page === 'duas') return arg ? kdDua(KDUAS.find((d) => d.k === arg)) : kdDuas();
  if (page === 'kalima') return kdKalima();
  if (page === 'surahs') return arg ? kdSurah(+arg, tok) : kdSurahs(tok);
  if (page === 'deeds') return kdDeeds();
  if (page === 'quiz') return kdQuiz();
  return kdHome();
};

const kdCard = (href, img, title, sub, c1, c2, badge = '') => `<a class="kd-card" href="${href}" style="--c1:${c1};--c2:${c2}">
  <img src="/kids/${img}.webp" alt="" loading="lazy"><b>${esc(title)}</b><small>${esc(sub)}</small>${badge ? `<span class="kd-badge">${badge}</span>` : ''}</a>`;

function kdHome() {
  const st = kdSt();
  const today = st.deeds[kdToday()] || {};
  const dn = (rec, list) => list.filter((x) => rec[x]).length;
  view.innerHTML = `<div class="kd">
    <div class="kd-top">
      <div class="kd-hi"><small>${esc(kt('hi'))}</small><b>${esc(st.name || kt('friend'))}</b></div>
      <div class="kd-stars"><img src="/kids/star.webp" alt=""><b>${N(kdStars(st))}</b></div>
      ${st.mode ? `<button class="kd-lock" id="kd-lock" aria-label="${esc(kt('hold'))}">${icon('shield')}<svg class="kd-hold" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18"/></svg></button>` : `<a class="kd-lock" href="#/today" aria-label="${esc(kt('leave'))}">${icon('x')}</a>`}
    </div>
    <a class="kd-hero" href="#/kids/deeds">
      <img src="/kids/deeds.webp" alt="">
      <span><small>${esc(kt('today'))}</small><b>${esc(kt('deeds'))}</b><span class="kd-hbar"><i style="width:${(Object.keys(today).length / KDEEDS.length) * 100}%"></i></span>
        <em>${N(Object.keys(today).length)} / ${N(KDEEDS.length)}</em></span></a>
    <h3 class="kd-h">${esc(kt('learn'))}</h3>
    <div class="kd-grid">
      ${kdCard('#/qaida', 'qaida', kt('qaida'), kt('qaida_d'), '#ffb26b', '#ff7a45')}
      ${kdCard('#/kids/surahs', 'surahs', kt('surahs'), kt('surahs_d'), '#7ed9a8', '#2fae6b', `${N(dn(st.surahs, KSURAHS))}/${N(KSURAHS.length)}`)}
      ${kdCard('#/kids/duas', 'duas', kt('duas'), kt('duas_d'), '#8fc8ff', '#3d8bff', `${N(dn(st.duas, KDUAS.map((d) => d.k)))}/${N(KDUAS.length)}`)}
      ${kdCard('#/kids/kalima', 'kalima', kt('kalima'), kt('kalima_d'), '#c3a6ff', '#8a5cf0', `${N(dn(st.duas, KALIMA.map((d) => d.k)))}/${N(KALIMA.length)}`)}
      ${kdCard('#/prophets', 'stories', kt('stories'), kt('stories_d'), '#ffd27a', '#f0a020')}
      ${kdCard('#/salah', 'salah', kt('salah'), kt('salah_d'), '#7fe0d4', '#16a596')}
      ${kdCard('#/names', 'star', kt('names'), kt('names_d'), '#ffb3cf', '#ef5b93')}
      ${kdCard('#/kids/quiz', 'quiz', kt('quiz'), kt('quiz_d'), '#d6b3ff', '#a35cf0')}
    </div>
    <h3 class="kd-h">${esc(kt('parents'))}</h3>
    <div class="kd-parents">
      <label class="kd-name"><span>${esc(kt('name'))}</span><input id="kd-name" maxlength="24" placeholder="${esc(kt('name_ph'))}" value="${esc(st.name)}"></label>
      <div class="kd-mode"><span><b>${esc(kt('lock'))}</b><small>${esc(kt('lock_d'))}</small></span>${st.mode ? '' : `<button class="toggle" data-kd="mode" role="switch" aria-checked="false"></button>`}</div>
      ${st.mode ? `<p class="kd-holdhint">${icon('shield')}${esc(kt('hold'))}</p>` : ''}
    </div></div>`;
  $('#kd-name').addEventListener('change', (e) => { const s = kdSt(); s.name = e.target.value.trim(); kdSave(s); render(); });
  kdLockHold();
}

/// Leaving Kids mode: press and hold the lock for two seconds.
function kdLockHold() {
  const b = $('#kd-lock');
  if (!b) return;
  const start = (e) => {
    e.preventDefault();
    b.classList.add('holding');
    nativeUi('haptic');
    KD.hold = setTimeout(() => {
      const s = kdSt(); s.mode = false; kdSave(s);
      nativeUi('haptic', 'long'); toast(kt('left')); kdSync(); render();
    }, 2000);
  };
  const end = () => { clearTimeout(KD.hold); b.classList.remove('holding'); };
  b.addEventListener('touchstart', start, { passive: false });
  b.addEventListener('mousedown', start);
  ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach((ev) => b.addEventListener(ev, end));
}

const kdBack = (title, href = '#/kids') => `<div class="kd-bar"><a class="kd-back" href="${href}" aria-label="back">${icon('chevL')}</a><b>${esc(title)}</b><span class="kd-stars sm"><img src="/kids/star.webp" alt=""><b>${N(kdStars(kdSt()))}</b></span></div>`;

// ---------- Duas and the Kalima ----------
function kdDuaRows(list, base) {
  const st = kdSt();
  return list.map((d) => `<a class="kd-row" href="${base}${d.k}" style="--dc:${d.ic}"><span class="kd-dot">${st.duas[d.k] ? icon('check') : ''}</span>
    <span class="kd-row-t"><b>${esc(kb(d.t))}</b><small dir="rtl" lang="ar">${d.ar}</small></span>${icon('chevR')}</a>`).join('');
}
function kdDuas() {
  view.innerHTML = `<div class="kd">${kdBack(kt('duas'))}<img class="kd-art" src="/kids/duas.webp" alt=""><div class="kd-list">${kdDuaRows(KDUAS, '#/kids/duas/')}</div></div>`;
}
function kdDuaCard(d) {
  const st = kdSt();
  return `<div class="kd-dcard" style="--dc:${d.ic}"><span class="kd-dtitle">${esc(kb(d.t))}</span>
    <div class="kd-ar" dir="rtl" lang="ar">${d.ar}</div>
    <div class="kd-sec"><small>${esc(kt('how'))}</small><p>${esc(d.tr)}</p></div>
    <div class="kd-sec"><small>${esc(kt('means'))}</small><p>${esc(L() === 'bn' ? d.bn : d.en)}</p>${d.note ? `<p class="kd-note">${esc(kb(d.note))}</p>` : ''}</div>
    ${d.src ? `<div class="kd-src">${esc(d.src)}</div>` : ''}
    <button class="kd-learn ${st.duas[d.k] ? 'on' : ''}" data-kd="learn" data-k="${d.k}">${st.duas[d.k] ? `${icon('check')}${esc(kt('learned_on'))}` : `<img src="/kids/star.webp" alt="">${esc(kt('learned'))}`}</button></div>`;
}
function kdDua(d) {
  if (!d) { location.hash = '#/kids/duas'; return; }
  const i = KDUAS.indexOf(d), next = KDUAS[i + 1];
  view.innerHTML = `<div class="kd">${kdBack(kb(d.t), '#/kids/duas')}${kdDuaCard(d)}
    ${next ? `<a class="kd-next" href="#/kids/duas/${next.k}"><span><small>${esc(L() === 'bn' ? 'পরের দোয়া' : 'Next dua')}</small><b>${esc(kb(next.t))}</b></span>${icon('chevR')}</a>` : ''}</div>`;
}
function kdKalima() {
  view.innerHTML = `<div class="kd">${kdBack(kt('kalima'))}<img class="kd-art" src="/kids/kalima.webp" alt="">${KALIMA.map(kdDuaCard).join('')}</div>`;
}

// ---------- Short surahs ----------
async function kdSurahs(tok) {
  await qMeta();
  if (!live(tok)) return;
  const st = kdSt();
  view.innerHTML = `<div class="kd">${kdBack(kt('surahs'))}<img class="kd-art" src="/kids/surahs.webp" alt="">
    <div class="kd-list">${KSURAHS.map((s, i) => { const c = Q.meta.chapters[s - 1]; return `<a class="kd-row" href="#/kids/surahs/${s}" style="--dc:${['#2fae6b', '#3d8bff', '#8a5cf0', '#ef5b93', '#f0a020', '#16a596'][i % 6]}">
      <span class="kd-dot">${st.surahs[s] ? icon('check') : N(i + 1)}</span><span class="kd-row-t"><b>${esc(cname(c))}</b><small>${N(c.verses)} ${esc(L() === 'bn' ? 'আয়াত' : 'verses')}</small></span>
      <span class="kd-sar" dir="rtl" lang="ar">${c.ar}</span>${icon('chevR')}</a>`; }).join('')}</div></div>`;
}
async function kdSurah(s, tok) {
  await qMeta();
  const [ar, wb, mean] = await Promise.all([qAr(s), qWbw('en', s), qTr(L() === 'bn' ? 161 : 20, s)]);
  if (!live(tok)) return;
  const c = Q.meta.chapters[s - 1], st = kdSt();
  const verses = ar.map((a, i) => `<div class="kd-v"><div class="kd-ar sm" dir="rtl" lang="ar">${a.u.map(plainAr).join(' ')} <span class="kd-vn">${AR_DIGITS(i + 1)}</span></div>
    <p class="kd-vt">${esc((wb[i] || []).map((w) => w[1]).join(' '))}</p><p class="kd-vm">${esc(String(mean[i]).replace(/<sup[^>]*>.*?<\/sup>/g, '').replace(/<[^>]+>/g, ''))}</p></div>`).join('');
  view.innerHTML = `<div class="kd">${kdBack(cname(c), '#/kids/surahs')}
    <div class="kd-shead"><span class="kd-sar big" dir="rtl" lang="ar">${c.ar}</span><button class="kd-play" data-kd="play" data-s="${s}" data-n="${c.verses}">${icon('play')}${esc(kt('listen'))}</button></div>
    <div class="kd-dcard" style="--dc:#2fae6b">${s !== 1 && s !== 9 ? '<div class="kd-bism" dir="rtl" lang="ar">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ</div>' : ''}${verses}
      <button class="kd-learn ${st.surahs[s] ? 'on' : ''}" data-kd="surah" data-s="${s}">${st.surahs[s] ? `${icon('check')}${esc(kt('learned_on'))}` : `<img src="/kids/star.webp" alt="">${esc(kt('know'))}`}</button></div></div>`;
}

// ---------- Good deeds ----------
function kdDeeds() {
  const st = kdSt(), key = kdToday(), today = st.deeds[key] || {};
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const week = days.map((d) => {
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const n = Object.keys(st.deeds[k] || {}).length;
    return `<div class="kd-day ${k === key ? 'on' : ''}"><span class="kd-dstar" style="--f:${n / KDEEDS.length}"><img src="/kids/star.webp" alt=""></span><b>${N(n)}</b><small>${esc(WD_SHORT[L()][d.getDay()])}</small></div>`;
  }).join('');
  view.innerHTML = `<div class="kd">${kdBack(kt('deeds'))}
    <div class="kd-deeds">${KDEEDS.map(([k, label, ic, color]) => `<button class="kd-deed ${today[k] ? 'on' : ''}" data-kd="deed" data-k="${k}" style="--dc:${color}">
      <span class="kd-dic">${icon(ic)}</span><b>${esc(kb(label))}</b><span class="kd-check">${today[k] ? '<img src="/kids/star.webp" alt="">' : ''}</span></button>`).join('')}</div>
    <h3 class="kd-h">${esc(kt('week'))}</h3><div class="kd-week">${week}</div></div>`;
}

// ---------- Quiz ----------
const kdShuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function kdQuiz() {
  KD.quiz = { qs: kdShuffle(KQUIZ.slice()).slice(0, 10).map((q) => ({ q: q[0], a: q[1], opts: kdShuffle([q[1], q[2], q[3]]) })), i: 0, right: 0, locked: false };
  view.innerHTML = `<div class="kd kd-quiz">${kdBack(kt('quiz'))}<div class="kd-qseg">${KD.quiz.qs.map((_, i) => `<i data-i="${i}"></i>`).join('')}</div><div id="kd-q"></div></div>`;
  kdAsk();
}
function kdAsk() {
  const z = KD.quiz, q = z.qs[z.i];
  z.locked = false;
  $$('.kd-qseg i').forEach((el, i) => el.classList.toggle('cur', i === z.i));
  $('#kd-q').innerHTML = `<div class="kd-qbox"><img src="/kids/quiz.webp" alt=""><h2>${esc(kb(q.q))}</h2>
    <div class="kd-opts">${q.opts.map((o, i) => `<button class="kd-opt" data-kd="ans" data-i="${i}">${esc(kb(o))}</button>`).join('')}</div><p class="kd-fb" id="kd-fb"></p></div>`;
}
function kdAnswer(i, el) {
  const z = KD.quiz, q = z.qs[z.i];
  if (z.locked) return;
  z.locked = true;
  const ok = q.opts[i] === q.a;
  el.classList.add(ok ? 'right' : 'wrong');
  $(`.kd-qseg i[data-i="${z.i}"]`).classList.add(ok ? 'ok' : 'no');
  if (ok) { z.right++; kdBurst(el); nativeUi('haptic'); $('#kd-fb').textContent = kt('right'); }
  else { $$('.kd-opt')[q.opts.indexOf(q.a)].classList.add('right'); nativeUi('haptic', 'long'); $('#kd-fb').textContent = `${kt('oops')}: ${kb(q.a)}`; }
  setTimeout(() => {
    if (!$('#kd-q')) return;
    if (++z.i < z.qs.length) return kdAsk();
    const st = kdSt(); st.qz = (st.qz || 0) + z.right; kdSave(st);
    $$('.kd-qseg i').forEach((el2) => el2.classList.remove('cur'));
    $('#kd-q').innerHTML = `<div class="kd-qbox done"><img src="/kids/deeds.webp" alt=""><h2>${esc(z.right >= 7 ? kt('great') : kt('done_q'))}</h2>
      <div class="kd-score"><b>${N(z.right)}</b><span>${esc(kt('of10'))}</span></div><p class="kd-plus"><img src="/kids/star.webp" alt=""> +${N(z.right)}</p>
      <div class="kd-qend"><button class="kd-learn" data-kd="replay">${icon('undo')}${esc(kt('again'))}</button><a class="kd-learn ghost" href="#/kids">${esc(kt('home'))}</a></div></div>`;
    if (z.right >= 7) kdBurst($('.kd-score'), 40);
  }, ok ? 900 : 1700);
}

/// A burst of little stars and colours.
function kdBurst(from, n = 18) {
  const r = from.getBoundingClientRect();
  const colors = ['#f5b83d', '#ff7a45', '#2fae6b', '#3d8bff', '#ef5b93', '#8a5cf0'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'kd-conf';
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110;
    p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${colors[i % colors.length]};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d - 40}px;--r:${Math.random() * 540}deg`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}

// ---------- Events ----------
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-kd]');
  if (!a) return;
  const d = a.dataset, st = kdSt();
  switch (d.kd) {
    case 'learn': {
      if (st.duas[d.k]) delete st.duas[d.k]; else { st.duas[d.k] = Date.now(); kdBurst(a); nativeUi('haptic', 'long'); }
      kdSave(st); render(); break;
    }
    case 'surah': {
      if (st.surahs[d.s]) delete st.surahs[d.s]; else { st.surahs[d.s] = Date.now(); kdBurst(a, 26); nativeUi('haptic', 'long'); }
      kdSave(st); render(); break;
    }
    case 'deed': {
      const k = kdToday(); const day = st.deeds[k] || (st.deeds[k] = {});
      if (day[d.k]) delete day[d.k]; else { day[d.k] = 1; kdBurst(a, 10); nativeUi('haptic'); }
      kdSave(st); render(); break;
    }
    case 'play': {
      if (a.classList.contains('on')) { await post('/api/quran/cmd', { cmd: 'stop' }); a.classList.remove('on'); a.innerHTML = `${icon('play')}${esc(kt('listen'))}`; break; }
      try {
        await post('/api/quran/play', { reciter: Q.st?.reciter || 7, s: +d.s, v: 1, to: +d.n, repeat: 1, loop: 2, gap: 0, meaning: '', next: false, speed: 1 });
        a.classList.add('on'); a.innerHTML = `${icon('stop')}${esc(kt('stop'))}`;
      } catch (err) { toast(err.message); }
      break;
    }
    case 'mode': {
      st.mode = true; kdSave(st);
      nativeUi('haptic', 'long'); toast(kt('on')); kdSync(); render(); break;
    }
    case 'ans': kdAnswer(+d.i, a); break;
    case 'replay': kdQuiz(); break;
  }
});
