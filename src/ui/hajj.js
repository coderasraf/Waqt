'use strict';
// Waqt Hajj & Umrah guide (phones): Umrah and Hajj (tamattu', as most
// pilgrims from Bangladesh perform it) step by step, as taught in the Hanafi
// school, with pictures of each place; a Tawaf and Sa'i round counter that
// keeps the screen on and counts with the volume keys; a packing checklist;
// and reference pages. Loaded after salah.js (uses tr2, B and its flow styles).

const HJT = {
  title: ['Hajj & Umrah', 'হজ ও উমরা'], sub: ['Step by step, as taught in the Hanafi school', 'হানাফি মাযহাব অনুযায়ী, ধাপে ধাপে'],
  umrah: ['Umrah', 'উমরা'], umrah_d: ['From ihram to the final trim', 'ইহরাম থেকে চুল ছাঁটা পর্যন্ত'], hajj: ['Hajj', 'হজ'], hajj_d: ['The five days, 8–13 Dhul Hijjah', 'পাঁচ দিন, ৮–১৩ জিলহজ'],
  steps: ['steps', 'ধাপ'], start: ['Start', 'শুরু করুন'], again: ['Go through again', 'আবার দেখুন'],
  tools: ['On the journey', 'সফরে কাজে লাগবে'], tawaf_c: ['Tawaf counter', 'তাওয়াফ কাউন্টার'], sai_c: ['Sa\'i counter', 'সাঈ কাউন্টার'], check: ['Checklist', 'চেকলিস্ট'],
  learn: ['Learn', 'জানুন'], days: ['The days of Hajj', 'হজের দিনগুলো'], duas: ['Duas of Hajj & Umrah', 'হজ ও উমরার দোয়া'],
  next: ['Next', 'পরবর্তী'], back: ['Back', 'পেছনে'], finish: ['Finish', 'শেষ'], done: ['Done', 'সম্পন্ন'],
  women: ['For women', 'নারীদের জন্য'], open_counter: ['Open the counter', 'কাউন্টার খুলুন'], rules: ['What ihram forbids', 'ইহরামের নিষেধাজ্ঞা'],
  round: ['Round', 'চক্কর'], lap: ['Lap', 'চক্কর'], of7: ['of 7', '/ ৭'], tap: ['Tap anywhere, or press a volume key, at the end of each round', 'প্রতি চক্কর শেষে যেকোনো জায়গায় চাপ দিন, বা ভলিউম বোতাম চাপুন'],
  undo: ['Undo', 'ফিরিয়ে নিন'], reset: ['Start over', 'নতুন করে'], complete_t: ['Tawaf complete', 'তাওয়াফ সম্পন্ন'], complete_s: ['Sa\'i complete', 'সাঈ সম্পন্ন'],
  after_t: ['Now pray two rak\'ah, then drink Zamzam.', 'এখন দুই রাকাত নামাজ পড়ুন, তারপর জমজমের পানি পান করুন।'], after_s: ['Now shave or trim your hair.', 'এখন মাথা মুণ্ডন করুন বা চুল ছাঁটুন।'],
  to_marwah: ['Safa → Marwah', 'সাফা → মারওয়া'], to_safa: ['Marwah → Safa', 'মারওয়া → সাফা'],
  well_done: ['May Allah accept it from you', 'আল্লাহ আপনার পক্ষ থেকে কবুল করুন'], packed: ['packed', 'গোছানো হয়েছে'],
  note: ['As taught in the Hanafi school. Follow the scholar travelling with your group where practice differs. Pictures are illustrations.', 'হানাফি মাযহাব অনুযায়ী। কোনো বিষয়ে ভিন্নতা থাকলে আপনার কাফেলার আলেমের পরামর্শ মেনে চলুন। ছবিগুলো প্রতীকী।'],
  v1: ['"Whoever performs Hajj for Allah, without obscenity or wrongdoing, returns as on the day his mother bore him."', '"যে আল্লাহর জন্য হজ করে এবং অশ্লীলতা ও পাপাচার থেকে বিরত থাকে, সে সদ্য মাতৃগর্ভ থেকে ভূমিষ্ঠ শিশুর মতো ফিরে আসে।"'], v1s: ['Sahih al-Bukhari 1521', 'সহীহ বুখারী ১৫২১'],
};
const hjt = (k) => tr2(HJT[k]);

// ---------- Recitations ----------
const HREC = {
  niyyah_u: { ar: 'اللّٰهُمَّ إِنِّي أُرِيدُ الْعُمْرَةَ فَيَسِّرْهَا لِي وَتَقَبَّلْهَا مِنِّي', tr: 'Allāhumma innī urīdu-l-‘umrata fa-yassirhā lī wa taqabbalhā minnī.', en: 'O Allah, I intend to perform Umrah, so make it easy for me and accept it from me.', bn: 'হে আল্লাহ, আমি উমরার নিয়ত করছি; আমার জন্য তা সহজ করুন এবং আমার পক্ষ থেকে কবুল করুন।', src: ['The intention is made in the heart; these words may be said with it.', 'নিয়ত অন্তরে করতে হয়; সাথে এই বাক্যগুলো বলা যায়।'] },
  niyyah_h: { ar: 'اللّٰهُمَّ إِنِّي أُرِيدُ الْحَجَّ فَيَسِّرْهُ لِي وَتَقَبَّلْهُ مِنِّي', tr: 'Allāhumma innī urīdu-l-ḥajja fa-yassirhu lī wa taqabbalhu minnī.', en: 'O Allah, I intend to perform Hajj, so make it easy for me and accept it from me.', bn: 'হে আল্লাহ, আমি হজের নিয়ত করছি; আমার জন্য তা সহজ করুন এবং আমার পক্ষ থেকে কবুল করুন।', src: ['The intention is made in the heart; these words may be said with it.', 'নিয়ত অন্তরে করতে হয়; সাথে এই বাক্যগুলো বলা যায়।'] },
  talbiyah: { ar: 'لَبَّيْكَ اللّٰهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ', tr: 'Labbayka-llāhumma labbayk, labbayka lā sharīka laka labbayk, inna-l-ḥamda wa-n-ni‘mata laka wa-l-mulk, lā sharīka lak.',
    en: 'Here I am, O Allah, here I am. Here I am — You have no partner — here I am. All praise, all blessings and all dominion are Yours. You have no partner.', bn: 'আমি হাজির, হে আল্লাহ, আমি হাজির। আমি হাজির, আপনার কোনো শরীক নেই, আমি হাজির। নিশ্চয়ই সকল প্রশংসা, নিয়ামত ও রাজত্ব আপনারই। আপনার কোনো শরীক নেই।', src: 'Bukhari 1549, Muslim 1184', n: 3 },
  enter: { ar: 'بِسْمِ اللّٰهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللّٰهِ، اللّٰهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', tr: 'Bismillāhi wa-ṣ-ṣalātu wa-s-salāmu ‘alā rasūli-llāh. Allāhumma-ftaḥ lī abwāba raḥmatik.',
    en: 'In the name of Allah, and blessings and peace upon the Messenger of Allah. O Allah, open for me the doors of Your mercy.', bn: 'আল্লাহর নামে, এবং আল্লাহর রাসূলের উপর দরুদ ও সালাম। হে আল্লাহ, আমার জন্য আপনার রহমতের দরজাগুলো খুলে দিন।', src: 'Muslim 713, Ibn Majah 771' },
  istilam: { ar: 'بِسْمِ اللّٰهِ وَاللّٰهُ أَكْبَرُ', tr: 'Bismillāhi wa-llāhu akbar.', en: 'In the name of Allah; Allah is the Greatest.', bn: 'আল্লাহর নামে; আল্লাহ সবচেয়ে মহান।', src: 'Ibn Umar (al-Bayhaqi)' },
  rabbana: { ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', tr: 'Rabbanā ātinā fi-d-dunyā ḥasanatan wa fi-l-ākhirati ḥasanatan wa qinā ‘adhāba-n-nār.',
    en: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.', bn: 'হে আমাদের রব, আমাদের দুনিয়াতে কল্যাণ দিন, আখিরাতেও কল্যাণ দিন, এবং আমাদের জাহান্নামের আযাব থেকে রক্ষা করুন।', src: 'Al-Baqarah 2:201 · Abu Dawud 1892' },
  safa: { ar: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللّٰهِ، أَبْدَأُ بِمَا بَدَأَ اللّٰهُ بِهِ', tr: 'Inna-ṣ-ṣafā wa-l-marwata min sha‘ā’iri-llāh. Abda’u bimā bada’a-llāhu bih.',
    en: 'Indeed, Safa and Marwah are among the symbols of Allah. I begin with what Allah began with.', bn: 'নিশ্চয়ই সাফা ও মারওয়া আল্লাহর নিদর্শনসমূহের অন্তর্ভুক্ত। আল্লাহ যা দিয়ে শুরু করেছেন, আমিও তা দিয়ে শুরু করছি।', src: 'Al-Baqarah 2:158 · Muslim 1218' },
  safa_dhikr: { ar: 'اللّٰهُ أَكْبَرُ، اللّٰهُ أَكْبَرُ، اللّٰهُ أَكْبَرُ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الْأَحْزَابَ وَحْدَهُ',
    tr: 'Allāhu akbar (3×). Lā ilāha illa-llāhu waḥdahū lā sharīka lah, lahu-l-mulku wa lahu-l-ḥamdu wa huwa ‘alā kulli shay’in qadīr. Lā ilāha illa-llāhu waḥdah, anjaza wa‘dah, wa naṣara ‘abdah, wa hazama-l-aḥzāba waḥdah.',
    en: 'Allah is the Greatest (3×). There is no god but Allah alone, without partner; His is the dominion and His is the praise, and He has power over all things. There is no god but Allah alone; He fulfilled His promise, helped His servant, and alone defeated the confederates.',
    bn: 'আল্লাহ সবচেয়ে মহান (৩ বার)। আল্লাহ ছাড়া কোনো উপাস্য নেই, তিনি এক, তাঁর কোনো শরীক নেই; রাজত্ব ও প্রশংসা তাঁরই, তিনি সবকিছুর উপর ক্ষমতাবান। আল্লাহ ছাড়া কোনো উপাস্য নেই, তিনি এক; তিনি তাঁর প্রতিশ্রুতি পূর্ণ করেছেন, তাঁর বান্দাকে সাহায্য করেছেন এবং একাই সম্মিলিত বাহিনীকে পরাজিত করেছেন।', src: 'Muslim 1218' },
  zamzam: { ar: 'اللّٰهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا وَاسِعًا، وَشِفَاءً مِنْ كُلِّ دَاءٍ', tr: 'Allāhumma innī as’aluka ‘ilman nāfi‘an, wa rizqan wāsi‘an, wa shifā’an min kulli dā’.',
    en: 'O Allah, I ask You for beneficial knowledge, abundant provision, and healing from every illness.', bn: 'হে আল্লাহ, আমি আপনার কাছে উপকারী জ্ঞান, প্রশস্ত রিযিক এবং সকল রোগ থেকে আরোগ্য চাই।', src: 'Reported from Ibn Abbas (ad-Daraqutni)' },
  arafah: { ar: 'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', tr: 'Lā ilāha illa-llāhu waḥdahū lā sharīka lah, lahu-l-mulku wa lahu-l-ḥamd, wa huwa ‘alā kulli shay’in qadīr.',
    en: 'There is no god but Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things. — "The best supplication is that of the Day of Arafah."', bn: 'আল্লাহ ছাড়া কোনো উপাস্য নেই, তিনি এক, তাঁর কোনো শরীক নেই। রাজত্ব ও প্রশংসা তাঁরই, তিনি সবকিছুর উপর ক্ষমতাবান। — "সর্বোত্তম দোয়া হলো আরাফার দিনের দোয়া।"', src: 'Tirmidhi 3585' },
  rami: { ar: 'بِسْمِ اللّٰهِ، اللّٰهُ أَكْبَرُ', tr: 'Bismillāh, Allāhu akbar.', en: 'In the name of Allah, Allah is the Greatest — with each pebble.', bn: 'আল্লাহর নামে, আল্লাহ সবচেয়ে মহান — প্রতিটি কংকরের সাথে।', src: 'Bukhari 1753', n: 7 },
  salam: { ar: 'السَّلَامُ عَلَيْكَ يَا رَسُولَ اللّٰهِ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ', tr: 'As-salāmu ‘alayka yā rasūla-llāhi wa raḥmatu-llāhi wa barakātuh.', en: 'Peace be upon you, O Messenger of Allah, and the mercy of Allah and His blessings.', bn: 'হে আল্লাহর রাসূল, আপনার উপর সালাম, এবং আল্লাহর রহমত ও বরকত বর্ষিত হোক।' },
};
const hjRec = (id) => {
  const r = HREC[id];
  if (!r) return '';
  return `<div class="sg-rec">${r.n ? `<span class="sg-x">×${N(r.n)}</span>` : ''}<div class="sg-ar" dir="rtl" lang="ar">${r.ar}</div>
    <div class="sg-tr">${esc(r.tr)}</div><div class="sg-mean">${esc(B() ? r.bn : r.en)}</div>${r.src ? `<div class="sg-src">${esc(tr2(r.src))}</div>` : ''}</div>`;
};

// ---------- The guided flows ----------
// img the picture · day for Hajj · t title · ar the Arabic term · d what to do · w for women · rec recitations · count a counter to open
const HFLOWS = {
  umrah: { title: HJT.umrah, steps: [
    { img: 'ihram', t: ['Prepare for ihram', 'ইহরামের প্রস্তুতি'], ar: 'الْإِحْرَام', d: ['Trim your nails, remove unwanted hair and take a ghusl (or at least wudu). Perfume the body, not the ihram cloth. Men wear two plain white unstitched sheets — one around the waist to below the knees, one over the shoulders — and sandals that leave the top of the foot bare.', 'নখ কাটুন, অবাঞ্ছিত লোম পরিষ্কার করুন এবং গোসল করুন (অন্তত অজু)। সুগন্ধি শরীরে লাগান, ইহরামের কাপড়ে নয়। পুরুষরা দুটি সাদা সেলাইবিহীন চাদর পরবেন — একটি কোমর থেকে হাঁটুর নিচ পর্যন্ত, অন্যটি কাঁধের উপর — এবং এমন স্যান্ডেল, যাতে পায়ের পাতার উপরের অংশ খোলা থাকে।'],
      w: ['Women wear their usual loose, modest clothes in any colour, with socks if they like. Keep the face uncovered; the niqab must not touch the face.', 'নারীরা যেকোনো রঙের স্বাভাবিক ঢিলেঢালা শালীন পোশাক পরবেন, চাইলে মোজাও। মুখ খোলা রাখবেন; নিকাব যেন মুখে না লাগে।'] },
    { img: 'miqat', t: ['Intention at the Miqat', 'মীকাতে নিয়ত'], ar: 'النِّيَّة وَالتَّلْبِيَة', d: ['Enter ihram before you pass the miqat. Flights from Bangladesh to Jeddah cross it in the air, so put on the ihram cloth before boarding and make the intention when the crew announces the miqat. If you go to Madinah first, the miqat is Dhul-Hulayfah on the road to Makkah. Pray two rak\'ah if it is not a forbidden time, then make the intention and say the Talbiyah.', 'মীকাত পার হওয়ার আগেই ইহরাম বাঁধুন। বাংলাদেশ থেকে জেদ্দাগামী বিমান আকাশেই মীকাত অতিক্রম করে, তাই বিমানে ওঠার আগেই ইহরামের কাপড় পরে নিন এবং মীকাতের ঘোষণা হলে নিয়ত করুন। আগে মদিনা গেলে মক্কার পথে যুল-হুলাইফা মীকাত। নিষিদ্ধ সময় না হলে দুই রাকাত নামাজ পড়ে নিয়ত করুন এবং তালবিয়া পড়ুন।'], rec: ['niyyah_u', 'talbiyah'] },
    { img: 'ihram', t: ['In the state of ihram', 'ইহরাম অবস্থায়'], ar: 'مَحْظُورَاتُ الْإِحْرَام', rules: true, d: ['Say the Talbiyah often — men aloud, women softly. Until the Umrah is complete, avoid perfume, cutting hair or nails, covering the face (and, for men, the head and stitched clothes), hunting, quarrelling and marital relations.', 'বেশি বেশি তালবিয়া পড়ুন — পুরুষরা উচ্চস্বরে, নারীরা নিচু স্বরে। উমরা শেষ না হওয়া পর্যন্ত সুগন্ধি, চুল বা নখ কাটা, মুখ ঢাকা (পুরুষদের মাথা ঢাকা ও সেলাই করা কাপড়), শিকার, ঝগড়া-বিবাদ ও দাম্পত্য সম্পর্ক থেকে বিরত থাকুন।'] },
    { img: 'haram', t: ['Entering Masjid al-Haram', 'মসজিদুল হারামে প্রবেশ'], ar: 'دُخُولُ الْمَسْجِدِ الْحَرَام', d: ['Enter with your right foot, saying the dua. When you first see the Kaaba, raise your hands and ask Allah for what you need most. Make sure you have wudu — it is needed for tawaf.', 'ডান পা দিয়ে দোয়া পড়ে প্রবেশ করুন। কাবা প্রথম দেখামাত্র হাত তুলে আল্লাহর কাছে আপনার সবচেয়ে প্রয়োজনীয় জিনিসটি চান। অজু আছে কি না নিশ্চিত হোন — তাওয়াফের জন্য অজু লাগবে।'], rec: ['enter'] },
    { img: 'tawaf', t: ['Tawaf: at the Black Stone', 'তাওয়াফ: হাজরে আসওয়াদ থেকে শুরু'], ar: 'اسْتِلَامُ الْحَجَرِ الْأَسْوَد', d: ['Men uncover the right shoulder, putting the upper sheet under the right arm (idtiba\'). Stand on the line of the Black Stone — a green light on the wall marks it — and face it. Raise your hands as for takbir, then kiss or touch the Stone if you can without pushing anyone; otherwise point your palms at it and kiss them. Stop the Talbiyah now.', 'পুরুষরা ডান কাঁধ খোলা রাখবেন, চাদর ডান বগলের নিচ দিয়ে নেবেন (ইযতিবা)। হাজরে আসওয়াদের বরাবর দাঁড়িয়ে — দেয়ালের সবুজ বাতি জায়গাটি চিহ্নিত করে — সেদিকে মুখ করুন। তাকবিরের মতো হাত তুলুন, তারপর কাউকে ধাক্কা না দিয়ে সম্ভব হলে পাথরে চুমু দিন বা স্পর্শ করুন; না হলে হাতের তালু সেদিকে ইশারা করে চুমু খান। এখন তালবিয়া বন্ধ করুন।'], rec: ['istilam'] },
    { img: 'tawaf', t: ['Seven rounds', 'সাত চক্কর'], ar: 'الطَّوَاف', count: 'tawaf', d: ['Walk anticlockwise, the Kaaba on your left. Men walk briskly with short steps (raml) in the first three rounds. Touch the Yemeni Corner if you can — do not kiss it or point at it. Between it and the Black Stone recite the dua below. Each round ends at the Black Stone, where you point and say the takbir again. Between, make any dua in your own words.', 'কাবাকে বাম পাশে রেখে ঘড়ির কাঁটার বিপরীতে হাঁটুন। প্রথম তিন চক্করে পুরুষরা ছোট ছোট পদক্ষেপে দ্রুত হাঁটবেন (রমল)। সম্ভব হলে রুকনে ইয়ামানি স্পর্শ করুন — চুমু বা ইশারা নয়। রুকনে ইয়ামানি ও হাজরে আসওয়াদের মাঝে নিচের দোয়াটি পড়ুন। প্রতিটি চক্কর হাজরে আসওয়াদে শেষ হয়, সেখানে আবার ইশারা ও তাকবির। মাঝে নিজের ভাষায় যেকোনো দোয়া করুন।'],
      w: ['Women walk at a normal pace, without raml or idtiba\', and may keep to the outer edge, away from the crowd of men.', 'নারীরা রমল ও ইযতিবা ছাড়া স্বাভাবিকভাবে হাঁটবেন, এবং পুরুষদের ভিড় এড়িয়ে বাইরের দিকে থাকতে পারেন।'], rec: ['rabbana'] },
    { img: 'maqam', t: ['Two rak\'ah of Tawaf', 'তাওয়াফের দুই রাকাত'], ar: 'رَكْعَتَا الطَّوَاف', d: ['Cover the right shoulder again. Pray two rak\'ah (wajib) behind Maqam Ibrahim if there is room, otherwise anywhere in the mosque — Surah Al-Kafirun in the first and Al-Ikhlas in the second. Wait if it is a forbidden time.', 'আবার ডান কাঁধ ঢেকে নিন। জায়গা থাকলে মাকামে ইবরাহিমের পেছনে, নইলে মসজিদের যেকোনো জায়গায় দুই রাকাত (ওয়াজিব) নামাজ পড়ুন — প্রথম রাকাতে সূরা কাফিরূন, দ্বিতীয় রাকাতে সূরা ইখলাস। নিষিদ্ধ সময় হলে অপেক্ষা করুন।'] },
    { img: 'zamzam', t: ['Drink Zamzam', 'জমজমের পানি পান'], ar: 'مَاءُ زَمْزَم', d: ['Drink Zamzam water facing the Qibla, in three breaths, and make dua for anything you wish. "The water of Zamzam is for whatever it is drunk for." — Ibn Majah 3062', 'কিবলামুখী হয়ে তিন নিঃশ্বাসে জমজমের পানি পান করুন এবং যা ইচ্ছা দোয়া করুন। "জমজমের পানি যে উদ্দেশ্যে পান করা হয়, তা পূরণ হয়।" — ইবনে মাজাহ ৩০৬২'], rec: ['zamzam'] },
    { img: 'sai', t: ['Sa\'i: begin at Safa', 'সাঈ: সাফা থেকে শুরু'], ar: 'الصَّفَا', d: ['Go up Safa, recite the verse and face the Kaaba. Raise your hands as in dua — not as in takbir — and say the dhikr, then make your own dua.', 'সাফায় উঠে আয়াতটি পড়ুন এবং কাবার দিকে মুখ করুন। দোয়ার মতো হাত তুলুন — তাকবিরের মতো নয় — যিকিরটি পড়ুন, তারপর নিজের দোয়া করুন।'], rec: ['safa', 'safa_dhikr'] },
    { img: 'sai', t: ['Seven laps', 'সাত চক্কর'], ar: 'السَّعْي', count: 'sai', d: ['Walk to Marwah — that is the first lap — and back to Safa for the second. Men jog lightly between the two green lights. At Marwah, face the Kaaba and repeat the dhikr and dua. The seventh lap ends at Marwah. Wudu is recommended, but not required.', 'মারওয়া পর্যন্ত হাঁটুন — এটি প্রথম চক্কর — আবার সাফায় ফিরলে দ্বিতীয়। দুই সবুজ বাতির মাঝে পুরুষরা হালকা দৌড়াবেন। মারওয়ায় কাবার দিকে মুখ করে আবার যিকির ও দোয়া করুন। সপ্তম চক্কর মারওয়ায় শেষ হয়। অজু থাকা উত্তম, তবে জরুরি নয়।'],
      w: ['Women walk normally between the green lights too.', 'নারীরা সবুজ বাতির মাঝেও স্বাভাবিকভাবে হাঁটবেন।'] },
    { img: 'halq', end: true, t: ['Shave or trim', 'মাথা মুণ্ডন বা চুল ছাঁটা'], ar: 'الْحَلْق أَوِ التَّقْصِير', d: ['Men shave the whole head — the better choice — or cut at least a fingertip\'s length from the hair of at least a quarter of the head. Your Umrah is complete, and the restrictions of ihram end.', 'পুরুষরা পুরো মাথা মুণ্ডন করবেন — এটিই উত্তম — অথবা মাথার অন্তত এক-চতুর্থাংশের চুল আঙুলের এক কর পরিমাণ ছাঁটবেন। আপনার উমরা সম্পন্ন হলো, ইহরামের বিধিনিষেধও শেষ।'],
      w: ['Women gather their hair and cut a fingertip\'s length (about 2 cm) from its ends, in private.', 'নারীরা চুল একত্র করে আগা থেকে আঙুলের এক কর পরিমাণ (প্রায় ২ সেমি) কাটবেন, পর্দার সাথে।'] },
  ] },
  hajj: { title: HJT.hajj, steps: [
    { img: 'ihram', day: 8, t: ['Ihram for Hajj', 'হজের ইহরাম'], ar: 'يَوْمُ التَّرْوِيَة', d: ['On the 8th of Dhul Hijjah, prepare at your residence in Makkah as you did for Umrah: ghusl, the ihram cloth and two rak\'ah. Then make the intention for Hajj and say the Talbiyah.', '৮ জিলহজ মক্কায় নিজের আবাসস্থলে উমরার মতোই প্রস্তুতি নিন: গোসল, ইহরামের কাপড় ও দুই রাকাত নামাজ। তারপর হজের নিয়ত করে তালবিয়া পড়ুন।'], rec: ['niyyah_h', 'talbiyah'] },
    { img: 'mina', day: 8, t: ['To Mina', 'মিনায় গমন'], ar: 'مِنًى', d: ['Go to Mina and pray Dhuhr, Asr, Maghrib, Isha and the next Fajr there, as the Prophet ﷺ did. Spend the day in Talbiyah, dhikr, Quran and rest — the hardest days are ahead.', 'মিনায় যান এবং সেখানে যোহর, আসর, মাগরিব, এশা ও পরদিনের ফজর পড়ুন, যেমন নবী ﷺ পড়েছিলেন। দিনটি তালবিয়া, যিকির, কুরআন ও বিশ্রামে কাটান — সামনে কঠিন দিনগুলো।'] },
    { img: 'arafah', day: 9, t: ['Arafah — the heart of Hajj', 'আরাফা — হজের মূল'], ar: 'الْوُقُوفُ بِعَرَفَة', d: ['After sunrise, go to Arafah. Being at Arafah at any time between midday and dawn of the 10th is the greatest pillar of Hajj: whoever misses it has missed Hajj. Pray Dhuhr and Asr, then stay until sunset, facing the Qibla in dua and dhikr — standing if you can, hands raised. "Hajj is Arafah." — Tirmidhi 889', 'সূর্যোদয়ের পর আরাফায় যান। দুপুর থেকে ১০ তারিখের সুবহে সাদিক পর্যন্ত যেকোনো সময় আরাফায় অবস্থান হজের সবচেয়ে বড় রুকন: যার এটি ছুটে যায়, তার হজ হয় না। যোহর ও আসর পড়ে সূর্যাস্ত পর্যন্ত কিবলামুখী হয়ে দোয়া ও যিকিরে থাকুন — সম্ভব হলে দাঁড়িয়ে, হাত তুলে। "হজ হলো আরাফা।" — তিরমিযী ৮৮৯'], rec: ['arafah', 'rabbana'] },
    { img: 'muzdalifah', day: 9, t: ['The night at Muzdalifah', 'মুযদালিফায় রাত'], ar: 'الْمُزْدَلِفَة', d: ['After sunset, leave Arafah without praying Maghrib. At Muzdalifah, pray Maghrib and Isha together at the time of Isha, with one adhan and one iqamah. Spend the night there. After Fajr, stand in dhikr and dua until just before sunrise — this stay is wajib.', 'সূর্যাস্তের পর মাগরিব না পড়ে আরাফা ত্যাগ করুন। মুযদালিফায় এশার সময়ে এক আজান ও এক ইকামতে মাগরিব ও এশা একসাথে পড়ুন। রাত সেখানে কাটান। ফজরের পর সূর্যোদয়ের সামান্য আগ পর্যন্ত দাঁড়িয়ে যিকির ও দোয়া করুন — এই অবস্থান ওয়াজিব।'],
      w: ['Women, the elderly and the sick may leave Muzdalifah during the night, before Fajr, without penalty.', 'নারী, বয়স্ক ও অসুস্থরা ফজরের আগেই রাতে মুযদালিফা ত্যাগ করতে পারেন; এতে কোনো জরিমানা নেই।'] },
    { img: 'pebbles', day: 9, t: ['Collect the pebbles', 'কংকর সংগ্রহ'], ar: 'الْجِمَار', d: ['Pick up small pebbles, each about the size of a chickpea: 70 if you will stay in Mina until the 13th, or 49 for two days. Wash them if you like. Do not use stones from the Jamarat themselves.', 'ছোলার দানার মতো ছোট কংকর তুলে নিন: ১৩ তারিখ পর্যন্ত মিনায় থাকলে ৭০টি, দুই দিনের জন্য ৪৯টি। চাইলে ধুয়ে নিতে পারেন। জামারাতের নিক্ষিপ্ত পাথর ব্যবহার করবেন না।'] },
    { img: 'jamarat', day: 10, t: ['Stoning Jamrat al-Aqabah', 'জামরাতুল আকাবায় কংকর নিক্ষেপ'], ar: 'رَمْيُ جَمْرَةِ الْعَقَبَة', d: ['Back in Mina on the day of Eid, stone only the large Jamrah, best between sunrise and midday. Throw seven pebbles one by one, saying the takbir with each. Stop the Talbiyah with the first pebble.', 'ঈদের দিন মিনায় ফিরে শুধু বড় জামরায় কংকর মারুন — সূর্যোদয় থেকে দুপুরের মধ্যে উত্তম। প্রতিটির সাথে তাকবির বলে একটি একটি করে সাতটি কংকর নিক্ষেপ করুন। প্রথম কংকরের সাথেই তালবিয়া বন্ধ করুন।'],
      w: ['Women may stone later in the day or at night, when it is less crowded. Only those who truly cannot go may ask someone to stone for them.', 'নারীরা ভিড় কম থাকলে দিনের শেষে বা রাতে কংকর মারতে পারেন। একান্ত অক্ষম হলেই কেবল অন্যকে দিয়ে নিক্ষেপ করানো যাবে।'], rec: ['rami'] },
    { img: 'qurbani', day: 10, t: ['The sacrifice', 'কুরবানি'], ar: 'الْهَدْي', d: ['For tamattu\' and qiran a sacrifice is wajib: a sheep or goat, or a seventh share of a cow or camel. Most pilgrims buy it through the official bank voucher or their group. Make sure it has been done before you shave — in the Hanafi school the order stoning, sacrifice, shaving is wajib.', 'তামাত্তু ও কিরান হজে কুরবানি ওয়াজিব: একটি ভেড়া বা ছাগল, অথবা গরু বা উটের সাত ভাগের এক ভাগ। বেশিরভাগ হাজি সরকারি ব্যাংক কুপন বা কাফেলার মাধ্যমে তা আদায় করেন। মাথা মুণ্ডনের আগে কুরবানি হয়েছে কি না নিশ্চিত হোন — হানাফি মাযহাবে কংকর, কুরবানি ও মুণ্ডনের এই ক্রম ওয়াজিব।'] },
    { img: 'halq', day: 10, t: ['Shave or trim', 'মাথা মুণ্ডন বা চুল ছাঁটা'], ar: 'الْحَلْق', d: ['Once the sacrifice is done, men shave the head or trim it; women cut a fingertip\'s length. Now you may wear your own clothes and perfume: every restriction of ihram ends except marital relations.', 'কুরবানির পর পুরুষরা মাথা মুণ্ডন বা চুল ছাঁটবেন; নারীরা আঙুলের এক কর পরিমাণ কাটবেন। এখন নিজের পোশাক ও সুগন্ধি ব্যবহার করা যাবে: দাম্পত্য সম্পর্ক ছাড়া ইহরামের সব বিধিনিষেধ শেষ।'] },
    { img: 'tawaf', day: 10, t: ['Tawaf al-Ziyarah', 'তাওয়াফে যিয়ারত'], ar: 'طَوَافُ الزِّيَارَة', count: 'tawaf', d: ['Go to Makkah for this tawaf — a pillar of Hajj. It is best on the 10th and must be done before sunset on the 12th. Perform seven rounds as in Umrah, then the two rak\'ah. Men walk with raml in the first three rounds, as Sa\'i follows.', 'এই তাওয়াফের জন্য মক্কায় যান — এটি হজের রুকন। ১০ তারিখে উত্তম, আর ১২ তারিখের সূর্যাস্তের আগেই করতে হবে। উমরার মতো সাত চক্কর দিয়ে দুই রাকাত নামাজ পড়ুন। পরে সাঈ থাকায় পুরুষরা প্রথম তিন চক্করে রমল করবেন।'],
      w: ['A woman in her period waits until she is pure, however long it takes: this tawaf cannot be skipped or replaced.', 'ঋতুস্রাব চললে নারী পবিত্র হওয়া পর্যন্ত অপেক্ষা করবেন, যত দিনই লাগুক: এই তাওয়াফ বাদ দেওয়া বা অন্য কিছু দিয়ে পূরণ করা যায় না।'] },
    { img: 'sai', day: 10, t: ['Sa\'i of Hajj', 'হজের সাঈ'], ar: 'سَعْيُ الْحَجّ', count: 'sai', d: ['Perform Sa\'i between Safa and Marwah exactly as in Umrah. With this, Hajj\'s last restriction ends and marital relations become lawful.', 'উমরার মতোই সাফা ও মারওয়ার মাঝে সাঈ করুন। এর মাধ্যমে হজের শেষ বিধিনিষেধও শেষ হয়, দাম্পত্য সম্পর্ক বৈধ হয়।'] },
    { img: 'jamarat', day: 11, t: ['The days in Mina', 'মিনার দিনগুলো'], ar: 'أَيَّامُ التَّشْرِيق', d: ['Spend the nights of the 11th and 12th in Mina. Each day after midday, stone all three Jamarat in order — the small, the middle, then the large — seven pebbles each. After the first two, step aside, face the Qibla and make a long dua. You may leave Mina on the 12th before sunset; otherwise stay and stone again on the 13th.', '১১ ও ১২ তারিখের রাত মিনায় কাটান। প্রতিদিন দুপুরের পর ক্রমানুসারে তিন জামরায় — ছোট, মধ্যম, তারপর বড় — সাতটি করে কংকর মারুন। প্রথম দুটির পর একপাশে সরে কিবলামুখী হয়ে দীর্ঘ দোয়া করুন। ১২ তারিখ সূর্যাস্তের আগে মিনা ত্যাগ করা যায়; নইলে থেকে ১৩ তারিখও কংকর মারুন।'], rec: ['rami'] },
    { img: 'wada', day: 13, end: true, t: ['The farewell tawaf', 'বিদায়ী তাওয়াফ'], ar: 'طَوَافُ الْوَدَاع', count: 'tawaf', d: ['Before you leave Makkah, perform a last tawaf of seven rounds, without Sa\'i — it is wajib for pilgrims from outside Makkah. Drink Zamzam, make dua for yourself, your family and the Ummah, and leave with hope that your Hajj is accepted.', 'মক্কা ত্যাগের আগে সাঈ ছাড়া সাত চক্কর শেষ তাওয়াফ করুন — মক্কার বাইরের হাজিদের জন্য এটি ওয়াজিব। জমজম পান করুন, নিজের, পরিবারের ও উম্মাহর জন্য দোয়া করুন, এবং হজ কবুলের আশা নিয়ে বিদায় নিন।'],
      w: ['A woman in her period is excused from the farewell tawaf and may leave without it.', 'ঋতুস্রাব অবস্থায় নারী বিদায়ী তাওয়াফ থেকে অব্যাহতি পান; তা ছাড়াই রওনা হতে পারেন।'] },
  ] },
};
const HDAYS = { 8: ['8 Dhul Hijjah · Tarwiyah', '৮ জিলহজ · তারবিয়া'], 9: ['9 Dhul Hijjah · Arafah', '৯ জিলহজ · আরাফা'], 10: ['10 Dhul Hijjah · Eid', '১০ জিলহজ · ঈদ'], 11: ['11–12 Dhul Hijjah · Tashriq', '১১–১২ জিলহজ · তাশরিক'], 13: ['Before leaving Makkah', 'মক্কা ত্যাগের আগে'] };

// ---------- Reference pages ----------
const HPAGES = {
  types: { t: ['The three kinds of Hajj', 'হজের তিন প্রকার'], ic: 'kaaba', color: '#d99a1e', body: [
    { list: [['Tamattu\': Umrah first, leaving ihram afterwards, then a new ihram for Hajj on the 8th. A sacrifice is wajib. Most pilgrims from Bangladesh perform this kind — this guide follows it.', 'তামাত্তু: প্রথমে উমরা করে ইহরাম খুলে ফেলা, তারপর ৮ তারিখে হজের জন্য নতুন ইহরাম। কুরবানি ওয়াজিব। বাংলাদেশের বেশিরভাগ হাজি এভাবেই হজ করেন — এই গাইডও তা অনুসরণ করে।'],
      ['Qiran: Umrah and Hajj in one ihram, kept on until the 10th. A sacrifice is wajib.', 'কিরান: এক ইহরামে উমরা ও হজ, ১০ তারিখ পর্যন্ত ইহরাম অবস্থায় থাকা। কুরবানি ওয়াজিব।'],
      ['Ifrad: Hajj alone, without Umrah. No sacrifice is required.', 'ইফরাদ: উমরা ছাড়া শুধু হজ। কুরবানি জরুরি নয়।']] }] },
  pillars: { t: ['Fard and wajib', 'ফরজ ও ওয়াজিব'], ic: 'shield', color: '#30a46c', body: [
    { h: ['Fard of Hajj — without them, there is no Hajj', 'হজের ফরজ — এগুলো ছাড়া হজ হয় না'], list: [['Ihram — the intention with the Talbiyah', 'ইহরাম — তালবিয়াসহ নিয়ত'], ['Being at Arafah, from midday on the 9th to dawn on the 10th', 'আরাফায় অবস্থান, ৯ তারিখ দুপুর থেকে ১০ তারিখ সুবহে সাদিক পর্যন্ত'], ['Tawaf al-Ziyarah', 'তাওয়াফে যিয়ারত']] },
    { h: ['Wajib of Hajj — a sacrifice (dam) is due if one is missed', 'হজের ওয়াজিব — ছুটে গেলে দম (কুরবানি) দিতে হয়'], list: [['Staying at Muzdalifah after Fajr on the 10th', '১০ তারিখ ফজরের পর মুযদালিফায় অবস্থান'], ['Sa\'i between Safa and Marwah', 'সাফা-মারওয়ার সাঈ'], ['Stoning the Jamarat', 'জামারাতে কংকর নিক্ষেপ'], ['Shaving or trimming the hair', 'মাথা মুণ্ডন বা চুল ছাঁটা'], ['The sacrifice, for tamattu\' and qiran', 'তামাত্তু ও কিরানের কুরবানি'], ['The order on the 10th: stoning, sacrifice, then shaving', '১০ তারিখের ক্রম: কংকর, কুরবানি, তারপর মুণ্ডন'], ['The farewell tawaf, for those from outside Makkah', 'মক্কার বাইরের হাজিদের বিদায়ী তাওয়াফ']] },
    { h: ['Umrah', 'উমরা'], list: [['Fard: ihram and tawaf', 'ফরজ: ইহরাম ও তাওয়াফ'], ['Wajib: Sa\'i, and shaving or trimming', 'ওয়াজিব: সাঈ এবং মুণ্ডন বা চুল ছাঁটা']] }] },
  rules: { t: ['What ihram forbids', 'ইহরামের নিষেধাজ্ঞা'], ic: 'x', color: '#e5484d', body: [
    { h: ['For everyone', 'সবার জন্য'], list: [['Perfume, scented soap or oil', 'সুগন্ধি, সুগন্ধযুক্ত সাবান বা তেল'], ['Cutting or removing hair or nails', 'চুল, লোম বা নখ কাটা'], ['Covering the face', 'মুখ ঢাকা'], ['Hunting, or harming animals', 'শিকার করা বা প্রাণীকে কষ্ট দেওয়া'], ['Marital relations, and anything that leads to them', 'দাম্পত্য সম্পর্ক এবং এর দিকে নিয়ে যায় এমন কিছু'], ['Quarrelling, arguing and bad words', 'ঝগড়া, তর্ক ও মন্দ কথা']] },
    { h: ['For men', 'পুরুষদের জন্য'], list: [['Stitched clothes shaped to the body — shirts, trousers, underwear, socks', 'শরীরের মাপে সেলাই করা কাপড় — জামা, পায়জামা, অন্তর্বাস, মোজা'], ['Covering the head', 'মাথা ঢাকা'], ['Shoes that cover the top of the foot', 'পায়ের পাতার উপরের অংশ ঢেকে যায় এমন জুতা']] },
    { h: ['Allowed', 'যা করা যাবে'], list: [['Bathing with unscented soap, and changing the ihram cloth', 'সুগন্ধিহীন সাবানে গোসল ও ইহরামের কাপড় বদলানো'], ['A belt or money pouch, a watch, glasses and an umbrella', 'বেল্ট বা টাকার থলে, ঘড়ি, চশমা ও ছাতা'], ['Medicine and injections', 'ওষুধ ও ইনজেকশন']] },
    { p: ['If a rule is broken, by mistake or by need, ask a scholar: depending on what happened, a sacrifice (dam) or charity (sadaqah) may be due.', 'ভুলে বা প্রয়োজনে কোনো নিষেধাজ্ঞা ভঙ্গ হলে একজন আলেমকে জিজ্ঞেস করুন: পরিস্থিতি অনুযায়ী দম (কুরবানি) বা সদকা দিতে হতে পারে।'] }] },
  women: { t: ['For women', 'নারীদের জন্য'], ic: 'heart', color: '#e93d82', body: [
    { list: [['Travel for Hajj with your husband or a mahram, as the Hanafi school teaches.', 'হানাফি মাযহাব অনুযায়ী স্বামী বা মাহরামের সাথে হজে যান।'], ['Ihram is your usual modest clothing, in any colour; keep the face uncovered.', 'স্বাভাবিক শালীন পোশাকই আপনার ইহরাম, যেকোনো রঙের; মুখ খোলা রাখুন।'], ['Say the Talbiyah softly; do not do raml, idtiba\' or jog between the green lights.', 'নিচু স্বরে তালবিয়া পড়ুন; রমল, ইযতিবা বা সবুজ বাতির মাঝে দৌড়ানো নেই।'],
      ['During your period you may do everything except tawaf and its two rak\'ah. Wait until you are pure, then perform the tawaf.', 'ঋতুস্রাবের সময় তাওয়াফ ও তার দুই রাকাত ছাড়া সব কাজ করা যায়। পবিত্র হওয়া পর্যন্ত অপেক্ষা করে তারপর তাওয়াফ করুন।'], ['Tawaf al-Ziyarah must wait until you are pure. The farewell tawaf is excused.', 'তাওয়াফে যিয়ারত পবিত্র হওয়া পর্যন্ত অপেক্ষা করতে হবে। বিদায়ী তাওয়াফ মাফ।'], ['To finish, cut a fingertip\'s length from the ends of your hair, in private.', 'শেষে পর্দার সাথে চুলের আগা থেকে আঙুলের এক কর পরিমাণ কাটুন।']] }] },
  madinah: { t: ['Visiting Madinah', 'মদিনা জিয়ারত'], ic: 'mosque', color: '#12a594', img: 'madinah', body: [
    { p: ['Visiting the Prophet\'s ﷺ mosque is not part of Hajj, but it is a beloved Sunnah. "A prayer in this mosque of mine is better than a thousand prayers elsewhere, except Masjid al-Haram." — Bukhari 1190', 'নবী ﷺ-এর মসজিদ জিয়ারত হজের অংশ নয়, তবে এটি প্রিয় সুন্নত। "আমার এই মসজিদে এক নামাজ মসজিদুল হারাম ছাড়া অন্য যেকোনো মসজিদের এক হাজার নামাজের চেয়ে উত্তম।" — বুখারী ১১৯০'] },
    { h: ['When you visit', 'জিয়ারতের সময়'], steps: [['Enter Masjid an-Nabawi with the right foot and pray two rak\'ah.', 'ডান পা দিয়ে মসজিদে নববীতে প্রবেশ করে দুই রাকাত নামাজ পড়ুন।'], ['Pray in the Rawdah if you can get a permit. "Between my house and my pulpit is a garden of the gardens of Paradise." — Bukhari 1196', 'অনুমতি পেলে রওজায় নামাজ পড়ুন। "আমার ঘর ও মিম্বরের মাঝের স্থানটি জান্নাতের বাগানসমূহের একটি বাগান।" — বুখারী ১১৯৬'],
      ['At the grave, stand with respect and a low voice, and send salam on the Prophet ﷺ, then on Abu Bakr and Umar (may Allah be pleased with them).', 'রওজা মোবারকের সামনে আদব ও নিচু স্বরে দাঁড়িয়ে নবী ﷺ-কে সালাম দিন, তারপর আবু বকর ও উমর (রা.)-কে।'], ['Pray in Masjid Quba: a prayer there is like an Umrah. — Ibn Majah 1412', 'মসজিদে কুবায় নামাজ পড়ুন: সেখানে নামাজ পড়া একটি উমরার মতো। — ইবনে মাজাহ ১৪১২'], ['Visit al-Baqi\' and the martyrs of Uhud, and make dua for them.', 'জান্নাতুল বাকি ও উহুদের শহীদদের কবর জিয়ারত করে তাঁদের জন্য দোয়া করুন।']] },
    { rec: 'salam' }] },
};
const CHECK = [
  { h: ['Documents', 'কাগজপত্র'], items: [['Passport, valid for 6 months or more', 'পাসপোর্ট (অন্তত ৬ মাস মেয়াদ)'], ['Visa and Hajj or Umrah permit', 'ভিসা ও হজ বা উমরার অনুমতিপত্র'], ['Hajj ID card and group details', 'হজ আইডি কার্ড ও কাফেলার তথ্য'], ['Meningitis (ACWY) vaccination certificate', 'মেনিনজাইটিস (ACWY) টিকার সনদ'], ['Air tickets', 'বিমান টিকিট'], ['Money, card and photocopies of everything', 'টাকা, কার্ড ও সব কাগজের ফটোকপি']] },
  { h: ['Ihram and clothes', 'ইহরাম ও পোশাক'], items: [['Two sets of ihram (men)', 'দুই সেট ইহরাম (পুরুষ)'], ['Ihram belt or money pouch', 'ইহরামের বেল্ট বা টাকার থলে'], ['Sandals that leave the top of the foot bare', 'পায়ের পাতার উপর খোলা থাকে এমন স্যান্ডেল'], ['Loose modest clothes and hijabs (women)', 'ঢিলেঢালা শালীন পোশাক ও হিজাব (নারী)'], ['A light shawl for the nights', 'রাতের জন্য হালকা চাদর']] },
  { h: ['Health', 'স্বাস্থ্য'], items: [['Your regular medicines, with the prescription', 'নিয়মিত ওষুধ ও প্রেসক্রিপশন'], ['Oral saline, painkillers and plasters', 'খাবার স্যালাইন, ব্যথানাশক ও প্লাস্টার'], ['Unscented sunscreen and lip balm', 'সুগন্ধিহীন সানস্ক্রিন ও লিপ বাম'], ['Face masks and hand sanitiser', 'মাস্ক ও হ্যান্ড স্যানিটাইজার']] },
  { h: ['Useful', 'দরকারি জিনিস'], items: [['Unscented soap, shampoo and toothpaste', 'সুগন্ধিহীন সাবান, শ্যাম্পু ও টুথপেস্ট'], ['Nail clippers and scissors (use before ihram)', 'নেইল কাটার ও কাঁচি (ইহরামের আগে)'], ['A small prayer mat and a pebble pouch', 'ছোট জায়নামাজ ও কংকরের থলে'], ['A foldable umbrella and a water bottle', 'ভাঁজ করা ছাতা ও পানির বোতল'], ['Phone charger and power bank', 'ফোনের চার্জার ও পাওয়ার ব্যাংক'], ['A small bag for the days in Mina', 'মিনার দিনগুলোর জন্য ছোট ব্যাগ']] },
];
const hjStore = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } } };
const HJ = { flow: null, i: 0 };
const hjImg = (name) => `/hajj/${name}.webp`;

// =====================================================================
// Views
// =====================================================================
VIEWS.hajj = async () => {
  const parts = location.hash.replace(/^#\/?hajj\/?/, '').split('/').filter(Boolean);
  const page = parts[0] || '';
  const flow = HFLOWS[page];
  document.body.classList.toggle('focus', !!flow || page === 'count');
  if (flow) return hjFlow(page, +parts[1] || 0);
  if (page === 'count') return hjCounter(parts[1] === 'sai' ? 'sai' : 'tawaf');
  if (page === 'check') return hjCheck();
  if (page === 'duas') return hjDuas();
  if (HPAGES[page]) return hjPage(page);
  return hjHome();
};

function hjHome() {
  const done = hjStore.get('hajj-done', {});
  const card = (k, img, sub) => `<a class="hj-card" href="#/hajj/${k}" style="--img:url('${hjImg(img)}')">
    <span class="hj-card-t"><small>${N(HFLOWS[k].steps.length)} ${esc(hjt('steps'))}</small><b>${esc(hjt(k))}</b><span>${esc(sub)}</span></span>
    <span class="btn gold small">${icon('play')}${esc(done[k] ? hjt('again') : hjt('start'))}</span></a>`;
  const row = (href, ic, color, label, extra = '') => `<a class="p-row tap" href="${href}">${tile(ic, color)}<span class="p-lab"><b>${esc(tr2(label))}</b></span>${extra}${chev()}</a>`;
  const checked = Object.values(hjStore.get('hajj-check', {})).filter(Boolean).length;
  const total = CHECK.reduce((a, g) => a + g.items.length, 0);
  const days = [8, 9, 10, 11, 13].map((d) => {
    const i = HFLOWS.hajj.steps.findIndex((s) => s.day === d);
    return `<a class="hj-day" href="#/hajj/hajj/${i}"><b>${d === 13 ? icon('kaaba') : esc(N(d))}</b><small>${esc(d === 13 ? (B() ? 'বিদায়' : 'Farewell') : tr2(HDAYS[d]).split(' · ')[1])}</small></a>`;
  }).join('');
  view.innerHTML = `<div class="p-page hj">${ptitle(hjt('title'))}<p class="p-sub">${esc(hjt('sub'))}</p>
    ${card('umrah', 'tawaf', hjt('umrah_d'))}${card('hajj', 'arafah', hjt('hajj_d'))}
    <div class="p-head">${esc(hjt('days'))}</div><div class="hj-days">${days}</div>
    <div class="p-head">${esc(hjt('tools'))}</div>
    <div class="nm-acts"><a class="nm-act" href="#/hajj/count/tawaf">${tile('kaaba', '#d99a1e')}<b>${esc(hjt('tawaf_c'))}</b><small>${esc(B() ? '৭ চক্কর' : '7 rounds')}</small></a>
      <a class="nm-act" href="#/hajj/count/sai">${tile('walk', '#0091ff')}<b>${esc(hjt('sai_c'))}</b><small>${esc(B() ? 'সাফা ↔ মারওয়া' : 'Safa ↔ Marwah')}</small></a>
      <a class="nm-act" href="#/hajj/check">${tile('check', '#30a46c')}<b>${esc(hjt('check'))}</b><small>${N(checked)} / ${N(total)}</small></a></div>
    <div class="p-head">${esc(hjt('learn'))}</div><div class="p-group">
      ${['types', 'pillars', 'rules', 'women', 'madinah'].map((k) => row(`#/hajj/${k}`, HPAGES[k].ic, HPAGES[k].color, HPAGES[k].t)).join('')}${row('#/hajj/duas', 'dua', '#8e4ec6', HJT.duas)}</div>
    <blockquote class="nm-quote">${esc(hjt('v1'))}<cite>${esc(hjt('v1s'))}</cite></blockquote>
    <div class="p-foot">${esc(hjt('note'))}</div></div>`;
}

// ---------- A guided flow ----------
function hjFlow(name, i) {
  const f = HFLOWS[name];
  HJ.flow = name; HJ.i = Math.min(Math.max(0, i), f.steps.length - 1);
  // Load the pictures ahead, so moving between steps is instant.
  for (const s of new Set(f.steps.map((x) => x.img))) { const im = new Image(); im.src = hjImg(s); }
  view.innerHTML = `<div class="sg-flow hj-flow">
    <div class="sg-bar"><a class="sg-close" href="#/hajj" aria-label="close">${icon('x')}</a><b>${esc(tr2(f.title))}</b><span id="hj-count"></span></div>
    <div class="sg-seg">${f.steps.map((_, k) => `<i data-k="${k}"></i>`).join('')}</div>
    <div class="sg-stage hj-stage"><img class="on" alt=""><img alt=""><span class="hj-daychip" id="hj-day"></span></div>
    <div class="sg-body" id="hj-body"></div>
    <div class="sg-nav"><button class="btn ghost" data-hj="prev">${icon('chevL')}${esc(hjt('back'))}</button><button class="btn gold" data-hj="next" id="hj-next"></button></div></div>`;
  hjStep(0);
  const st = $('.hj-flow');
  let x0 = null;
  st.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  st.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 60) hjMove(dx < 0 ? 1 : -1);
  }, { passive: true });
}

/// Crossfades the stage to the step's picture.
function hjPicture(name) {
  const [a, b] = $$('.hj-stage img');
  const front = a.classList.contains('on') ? a : b, back = front === a ? b : a;
  const src = hjImg(name);
  if (front.getAttribute('src') === src) return;
  if (!front.getAttribute('src')) { front.src = src; return; }
  back.onload = () => { back.classList.add('on'); front.classList.remove('on'); };
  back.src = src;
  if (back.complete && back.naturalWidth) back.onload();
}

function hjStep(dir) {
  const f = HFLOWS[HJ.flow], s = f.steps[HJ.i], last = HJ.i === f.steps.length - 1;
  $$('.hj-flow .sg-seg i').forEach((el, k) => el.className = k < HJ.i ? 'done' : k === HJ.i ? 'on' : '');
  $('#hj-count').textContent = `${N(HJ.i + 1)} / ${N(f.steps.length)}`;
  $('#hj-next').innerHTML = last ? `${icon('check')}${esc(hjt('finish'))}` : `${esc(hjt('next'))}${icon('chevR')}`;
  $('[data-hj="prev"]').style.visibility = HJ.i ? 'visible' : 'hidden';
  hjPicture(s.img);
  const day = $('#hj-day');
  day.textContent = s.day ? tr2(HDAYS[s.day]) : '';
  day.hidden = !s.day;
  $('#hj-body').innerHTML = `<div class="sg-step ${dir > 0 ? 'fwd' : dir < 0 ? 'bwd' : ''}"><div class="sg-term ar" dir="rtl">${s.ar}</div><h2>${esc(tr2(s.t))}</h2><p>${esc(tr2(s.d))}</p>
    ${s.w ? `<div class="hj-women">${icon('heart')}<div><b>${esc(hjt('women'))}</b><span>${esc(tr2(s.w))}</span></div></div>` : ''}
    ${s.count ? `<a class="hj-open" href="#/hajj/count/${s.count}">${tile(s.count === 'sai' ? 'walk' : 'kaaba', s.count === 'sai' ? '#0091ff' : '#d99a1e')}<b>${esc(s.count === 'sai' ? hjt('sai_c') : hjt('tawaf_c'))}</b>${chev()}</a>` : ''}
    ${s.rules ? `<a class="hj-open" href="#/hajj/rules">${tile('x', '#e5484d')}<b>${esc(hjt('rules'))}</b>${chev()}</a>` : ''}
    ${(s.rec || []).map(hjRec).join('')}${last ? `<div class="sg-end">${icon('sparkle')}${esc(hjt('well_done'))}</div>` : ''}</div>`;
  $('#scroll').scrollTop = 0;
}

function hjMove(d) {
  const f = HFLOWS[HJ.flow];
  const n = HJ.i + d;
  if (n < 0) return;
  nativeUi('haptic');
  if (n >= f.steps.length) {
    const done = hjStore.get('hajj-done', {}); done[HJ.flow] = Date.now(); hjStore.set('hajj-done', done);
    nativeUi('haptic', 'long');
    toast(`${tr2(f.title)} · ${hjt('done')} ✓`);
    location.hash = '#/hajj';
    return;
  }
  HJ.i = n;
  history.replaceState(null, '', `#/hajj/${HJ.flow}/${HJ.i}`);
  hjStep(d);
}

// ---------- Tawaf and Sa'i counter ----------
function hjCounter(k) {
  const c = hjStore.get('hajj-count', {});
  const n = c[k] || 0;
  nativeUi('keepScreenOn', 1);
  nativeUi('volumeTasbih', 1);
  const segs = Array.from({ length: 7 }, (_, i) => {
    const a0 = (i / 7) * 360 - 90 + 2.5, a1 = ((i + 1) / 7) * 360 - 90 - 2.5;
    const p = (a) => [100 + 86 * Math.cos((a * Math.PI) / 180), 100 + 86 * Math.sin((a * Math.PI) / 180)].map((v) => v.toFixed(1)).join(' ');
    return `<path d="M ${p(a0)} A 86 86 0 0 1 ${p(a1)}" class="${i < n ? 'on' : ''}" data-i="${i}"/>`;
  }).join('');
  const full = n >= 7;
  const dir = k === 'sai' ? (n % 2 === 0 ? hjt('to_marwah') : hjt('to_safa')) : '';
  view.innerHTML = `<div class="hj-counter ${k}" data-hj="tap">
    <div class="sg-bar"><a class="sg-close" href="#/hajj" aria-label="close">${icon('x')}</a><b>${esc(k === 'sai' ? hjt('sai_c') : hjt('tawaf_c'))}</b><span></span></div>
    <div class="hj-ring"><svg viewBox="0 0 200 200">${segs}</svg>
      <div class="hj-ring-t">${full ? `${icon('check')}<b>${esc(k === 'sai' ? hjt('complete_s') : hjt('complete_t'))}</b>` : `<small>${esc(k === 'sai' ? hjt('lap') : hjt('round'))}</small><b>${N(n + 1)}</b><small>${esc(hjt('of7'))}</small>`}</div></div>
    <p class="hj-dir">${full ? esc(k === 'sai' ? hjt('after_s') : hjt('after_t')) : esc(dir || (n < 3 ? (B() ? 'পুরুষ: প্রথম তিন চক্করে রমল' : 'Men: raml in the first three rounds') : (B() ? 'স্বাভাবিক গতিতে হাঁটুন' : 'Walk at a normal pace')))}</p>
    ${k === 'tawaf' && !full ? `<div class="hj-c-rec">${hjRec('rabbana')}</div>` : ''}
    ${!full ? `<p class="hj-tap">${esc(hjt('tap'))}</p>` : ''}
    <div class="hj-c-b"><button class="btn ghost" data-hj="undo" ${n ? '' : 'disabled'}>${icon('undo')}${esc(hjt('undo'))}</button><button class="btn ghost" data-hj="reset" ${n ? '' : 'disabled'}>${icon('reset')}${esc(hjt('reset'))}</button></div></div>`;
}
function hjCount(d) {
  const k = location.hash.includes('/sai') ? 'sai' : 'tawaf';
  const c = hjStore.get('hajj-count', {});
  const n = Math.max(0, Math.min(7, (c[k] || 0) + d));
  if (n === c[k]) return;
  c[k] = n;
  hjStore.set('hajj-count', c);
  nativeUi('haptic', n === 7 ? 'long' : '');
  hjCounter(k);
}
// The volume keys count rounds on the counter, as on the tasbih.
const hjVolumeBase = window.onVolumeKey;
window.onVolumeKey = (d) => {
  if (location.hash.startsWith('#/hajj/count')) hjCount(d > 0 ? 1 : -1);
  else hjVolumeBase?.(d);
};

// ---------- Checklist, duas, reference ----------
function hjCheck() {
  const st = hjStore.get('hajj-check', {});
  const total = CHECK.reduce((a, g) => a + g.items.length, 0);
  const got = CHECK.reduce((a, g, gi) => a + g.items.filter((_, ii) => st[`${gi}.${ii}`]).length, 0);
  view.innerHTML = `<div class="p-page hj">${ptitle(hjt('check'), '#/hajj')}
    <div class="sg-progress"><div class="hx-prog"><i style="width:${(got / total) * 100}%"></i></div><small>${N(got)} / ${N(total)} ${esc(hjt('packed'))}</small></div>
    ${CHECK.map((g, gi) => `<div class="p-head">${esc(tr2(g.h))}</div><div class="p-group">${g.items.map((it, ii) => {
      const on = !!st[`${gi}.${ii}`];
      return `<button class="p-row tap hj-ck ${on ? 'on' : ''}" data-hj="ck" data-k="${gi}.${ii}"><span class="hj-box">${icon('check')}</span><span class="p-lab"><b>${esc(tr2(it))}</b></span></button>`;
    }).join('')}</div>`).join('')}</div>`;
}

function hjDuas() {
  const order = ['niyyah_u', 'niyyah_h', 'talbiyah', 'enter', 'istilam', 'rabbana', 'zamzam', 'safa', 'safa_dhikr', 'arafah', 'rami', 'salam'];
  view.innerHTML = `<div class="p-page hj sg">${ptitle(hjt('duas'), '#/hajj')}<div class="sg-list">${order.map(hjRec).join('')}</div></div>`;
}

function hjPage(k) {
  const pg = HPAGES[k];
  const blocks = pg.body.map((b) => {
    if (b.rec) return hjRec(b.rec);
    if (b.list) return `${b.h ? `<div class="p-head">${esc(tr2(b.h))}</div>` : ''}<div class="p-group">${b.list.map((x) => `<div class="p-row"><span class="sg-dot"></span><span class="p-lab"><b>${esc(tr2(x))}</b></span></div>`).join('')}</div>`;
    if (b.steps) return `<div class="p-head">${esc(tr2(b.h))}</div><div class="p-group">${b.steps.map((x, i) => `<div class="p-row"><span class="sg-num">${N(i + 1)}</span><span class="p-lab"><b>${esc(tr2(x))}</b></span></div>`).join('')}</div>`;
    return `<p class="sg-para">${esc(tr2(b.p))}</p>`;
  }).join('');
  const top = pg.img ? `<div class="hj-banner" style="--img:url('${hjImg(pg.img)}')"></div>` : `<div class="sg-badge">${tile(pg.ic, pg.color).replace('p-tile', 'p-tile big')}</div>`;
  view.innerHTML = `<div class="p-page sg hj">${ptitle(tr2(pg.t), '#/hajj')}${top}${blocks}<div class="p-foot">${esc(hjt('note'))}</div></div>`;
}

// ---------- Events ----------
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-hj]');
  if (!a) return;
  const d = a.dataset;
  switch (d.hj) {
    case 'next': hjMove(1); break;
    case 'prev': hjMove(-1); break;
    case 'tap': if (!e.target.closest('a, button')) hjCount(1); break;
    case 'undo': hjCount(-1); break;
    case 'reset': { const c = hjStore.get('hajj-count', {}); c[location.hash.includes('/sai') ? 'sai' : 'tawaf'] = 0; hjStore.set('hajj-count', c); hjCounter(location.hash.includes('/sai') ? 'sai' : 'tawaf'); break; }
    case 'ck': {
      const st = hjStore.get('hajj-check', {});
      st[d.k] = !st[d.k]; hjStore.set('hajj-check', st);
      nativeUi('haptic');
      // In place, so the list keeps its scroll position.
      a.classList.toggle('on', st[d.k]);
      const total = CHECK.reduce((n, g) => n + g.items.length, 0), got = Object.values(st).filter(Boolean).length;
      $('.hj .hx-prog i').style.width = `${(got / total) * 100}%`;
      $('.hj .sg-progress small').textContent = `${N(got)} / ${N(total)} ${hjt('packed')}`;
      break;
    }
  }
});
