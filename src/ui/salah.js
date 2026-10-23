'use strict';
// Waqt Salah guide (phones): learn to pray, step by step, as taught in the
// Hanafi school followed in Bangladesh. Guided flows (prayer, wudu, ghusl,
// tayammum) show one step per screen with an illustrated figure that moves
// from posture to posture; reference pages cover rak'at, conditions,
// breakers and special prayers. Loaded after phone.js (uses its list helpers).

const SG = { flow: null, i: 0 };
/// Who the guide shows: a man (m) or a woman (f).
const sgWho = () => { try { return localStorage.getItem('salah-who') === 'f' ? 'f' : 'm'; } catch { return 'm'; } };
const sgFemale = () => sgWho() === 'f';
const sgDone = () => { try { return JSON.parse(localStorage.getItem('salah-done') || '{}'); } catch { return {}; } };
const sgMark = (k) => { const d = sgDone(); d[k] = Date.now(); try { localStorage.setItem('salah-done', JSON.stringify(d)); } catch { /* ignore */ } };
const B = () => L() === 'bn';
/// [English, Bengali] → the one for the app's language.
const tr2 = (pair) => (Array.isArray(pair) ? pair[B() ? 1 : 0] : pair);

const SGT = {
  title: ['Salah guide', 'নামাজ শিক্ষা'], sub: ['Learn to pray, step by step', 'ধাপে ধাপে নামাজ শিখুন'],
  learn: ['Learn to pray', 'নামাজ শিখুন'], learn_d: ['A two-rak\'ah prayer, one step at a time', 'দুই রাকাত নামাজ, এক এক ধাপে'],
  start: ['Start', 'শুরু করুন'], again: ['Go through again', 'আবার দেখুন'], steps: ['steps', 'ধাপ'],
  g_before: ['Before salah', 'নামাজের আগে'], g_prayer: ['The prayer', 'নামাজ'], g_special: ['Special prayers', 'বিশেষ নামাজ'], g_learn: ['Learn by heart', 'মুখস্থ করুন'],
  next: ['Next', 'পরবর্তী'], back: ['Back', 'পেছনে'], done: ['Done', 'সম্পন্ন'], finish: ['Finish', 'শেষ'],
  times: ['times', 'বার'], listen: ['Listen', 'শুনুন'], learned: ['Learned', 'শেখা হয়েছে'],
  hanafi: ['As taught in the Hanafi school, followed in Bangladesh. Other schools differ in small details.', 'হানাফি মাযহাব অনুযায়ী, যা বাংলাদেশে প্রচলিত। অন্যান্য মাযহাবে ছোটখাটো পার্থক্য আছে।'],
  surahs_d: ['Short surahs to recite after Al-Fatiha. Tap ▶ to hear one on repeat.', 'সূরা ফাতিহার পর পড়ার ছোট সূরা। ▶ চাপলে বারবার শোনা যাবে।'],
  recitations: ['All recitations', 'নামাজের সব দোয়া'], recitations_d: ['Every word said in salah, in one place', 'নামাজে যা পড়া হয় সব এক জায়গায়'],
  fard: ['Fard', 'ফরজ'], sunnah: ['Sunnah', 'সুন্নত'], wajib: ['Wajib', 'ওয়াজিব'], nafl: ['Nafl', 'নফল'], sunnah_g: ['Sunnah (optional)', 'সুন্নত (গায়রে মুয়াক্কাদা)'],
  men: ['Men', 'পুরুষ'], women: ['Women', 'নারী'], who_d: ['Show the method for', 'কার নিয়ম দেখাবে'],
  well_done: ['Masha\'Allah — well done', 'মাশাআল্লাহ — চমৎকার'], open_quran: ['Open in Quran', 'কুরআনে খুলুন'],
};
const sgt = (k) => tr2(SGT[k]);

// ---------- Recitations ----------
const REC = {
  takbir: { ar: 'اللّٰهُ أَكْبَرُ', tr: 'Allāhu Akbar', en: 'Allah is the Greatest.', bn: 'আল্লাহ সবচেয়ে মহান।' },
  thana: { ar: 'سُبْحَانَكَ اللّٰهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلٰهَ غَيْرُكَ', tr: 'Subḥānaka Allāhumma wa biḥamdika, wa tabāraka-smuka, wa ta‘ālā jadduka, wa lā ilāha ghayruk.',
    en: 'Glory be to You, O Allah, and all praise is Yours. Blessed is Your name, exalted is Your majesty, and there is no god but You.', bn: 'হে আল্লাহ! আপনি পবিত্র, সকল প্রশংসা আপনার। আপনার নাম বরকতময়, আপনার মর্যাদা সমুচ্চ, আর আপনি ছাড়া কোনো উপাস্য নেই।', src: 'Abu Dawud 775, Tirmidhi 243' },
  taawwudh: { ar: 'أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', tr: 'A‘ūdhu billāhi mina-sh-shayṭāni-r-rajīm', en: 'I seek refuge in Allah from Satan, the accursed.', bn: 'বিতাড়িত শয়তান থেকে আমি আল্লাহর আশ্রয় চাই।' },
  bismillah: { ar: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ', tr: 'Bismillāhi-r-raḥmāni-r-raḥīm', en: 'In the name of Allah, the Most Gracious, the Most Merciful.', bn: 'পরম করুণাময়, অতি দয়ালু আল্লাহর নামে।' },
  amin: { ar: 'آمِين', tr: 'Āmīn', en: 'O Allah, accept.', bn: 'হে আল্লাহ, কবুল করুন।' },
  ruku: { ar: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ', tr: 'Subḥāna Rabbiya-l-‘Aẓīm', en: 'Glory be to my Lord, the Most Great.', bn: 'আমার মহান রবের পবিত্রতা ঘোষণা করছি।', n: 3, src: 'Muslim 772' },
  tasmi: { ar: 'سَمِعَ اللّٰهُ لِمَنْ حَمِدَهُ', tr: 'Sami‘a-llāhu liman ḥamidah', en: 'Allah hears the one who praises Him.', bn: 'যে আল্লাহর প্রশংসা করে, আল্লাহ তা শোনেন।', src: 'Bukhari 789' },
  tahmid: { ar: 'رَبَّنَا لَكَ الْحَمْدُ', tr: 'Rabbanā laka-l-ḥamd', en: 'Our Lord, to You belongs all praise.', bn: 'হে আমাদের রব, সকল প্রশংসা আপনারই।' },
  sujud: { ar: 'سُبْحَانَ رَبِّيَ الْأَعْلَى', tr: 'Subḥāna Rabbiya-l-A‘lā', en: 'Glory be to my Lord, the Most High.', bn: 'আমার সর্বোচ্চ রবের পবিত্রতা ঘোষণা করছি।', n: 3, src: 'Muslim 772' },
  jalsa: { ar: 'رَبِّ اغْفِرْ لِي', tr: 'Rabbi-ghfir lī', en: 'My Lord, forgive me.', bn: 'হে আমার রব, আমাকে ক্ষমা করুন।', src: 'Abu Dawud 874' },
  tashahhud: { ar: 'التَّحِيَّاتُ لِلّٰهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللّٰهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    tr: 'At-taḥiyyātu lillāhi wa-ṣ-ṣalawātu wa-ṭ-ṭayyibāt. As-salāmu ‘alayka ayyuha-n-nabiyyu wa raḥmatu-llāhi wa barakātuh. As-salāmu ‘alaynā wa ‘alā ‘ibādi-llāhi-ṣ-ṣāliḥīn. Ash-hadu an lā ilāha illa-llāhu wa ash-hadu anna Muḥammadan ‘abduhū wa rasūluh.',
    en: 'All greetings, prayers and good things are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god but Allah, and I bear witness that Muhammad is His servant and Messenger.',
    bn: 'সকল সম্মান, সকল ইবাদত ও সকল পবিত্র বিষয় আল্লাহর জন্য। হে নবী, আপনার প্রতি সালাম এবং আল্লাহর রহমত ও বরকত বর্ষিত হোক। সালাম আমাদের প্রতি এবং আল্লাহর নেক বান্দাদের প্রতি। আমি সাক্ষ্য দিচ্ছি যে আল্লাহ ছাড়া কোনো উপাস্য নেই এবং সাক্ষ্য দিচ্ছি যে মুহাম্মাদ ﷺ তাঁর বান্দা ও রাসূল।', src: 'Bukhari 831' },
  durood: { ar: 'اللّٰهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ. اللّٰهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
    tr: 'Allāhumma ṣalli ‘alā Muḥammadin wa ‘alā āli Muḥammad, kamā ṣallayta ‘alā Ibrāhīma wa ‘alā āli Ibrāhīm, innaka Ḥamīdun Majīd. Allāhumma bārik ‘alā Muḥammadin wa ‘alā āli Muḥammad, kamā bārakta ‘alā Ibrāhīma wa ‘alā āli Ibrāhīm, innaka Ḥamīdun Majīd.',
    en: 'O Allah, send prayers upon Muhammad and the family of Muhammad, as You sent prayers upon Ibrahim and the family of Ibrahim; You are Praiseworthy, Glorious. O Allah, bless Muhammad and the family of Muhammad, as You blessed Ibrahim and the family of Ibrahim; You are Praiseworthy, Glorious.',
    bn: 'হে আল্লাহ! মুহাম্মাদ ও তাঁর পরিবারের প্রতি রহমত বর্ষণ করুন, যেমন আপনি ইবরাহীম ও তাঁর পরিবারের প্রতি রহমত বর্ষণ করেছেন; নিশ্চয়ই আপনি প্রশংসিত, মহিমান্বিত। হে আল্লাহ! মুহাম্মাদ ও তাঁর পরিবারের প্রতি বরকত দান করুন, যেমন আপনি ইবরাহীম ও তাঁর পরিবারের প্রতি বরকত দান করেছেন; নিশ্চয়ই আপনি প্রশংসিত, মহিমান্বিত।', src: 'Bukhari 3370' },
  masura: { ar: 'اللّٰهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا، وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ، وَارْحَمْنِي، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ',
    tr: 'Allāhumma innī ẓalamtu nafsī ẓulman kathīran, wa lā yaghfiru-dh-dhunūba illā anta, faghfir lī maghfiratan min ‘indika, wa-rḥamnī, innaka anta-l-Ghafūru-r-Raḥīm.',
    en: 'O Allah, I have wronged myself greatly, and none forgives sins but You. So forgive me with forgiveness from You and have mercy on me; You are the Forgiving, the Merciful.',
    bn: 'হে আল্লাহ! আমি নিজের উপর অনেক জুলুম করেছি, আর আপনি ছাড়া কেউ গুনাহ ক্ষমা করতে পারে না। অতএব আপনার পক্ষ থেকে আমাকে ক্ষমা করুন এবং আমার প্রতি দয়া করুন; নিশ্চয়ই আপনি ক্ষমাশীল, পরম দয়ালু।', src: 'Bukhari 834' },
  salam: { ar: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللّٰهِ', tr: 'As-salāmu ‘alaykum wa raḥmatu-llāh', en: 'Peace and the mercy of Allah be upon you.', bn: 'আপনাদের উপর শান্তি ও আল্লাহর রহমত বর্ষিত হোক।', src: 'Abu Dawud 996' },
  shahada: { ar: 'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', tr: 'Ash-hadu an lā ilāha illa-llāhu waḥdahū lā sharīka lah, wa ash-hadu anna Muḥammadan ‘abduhū wa rasūluh.',
    en: 'I bear witness that there is no god but Allah alone, without partner, and I bear witness that Muhammad is His servant and Messenger.', bn: 'আমি সাক্ষ্য দিচ্ছি যে আল্লাহ ছাড়া কোনো উপাস্য নেই, তিনি এক, তাঁর কোনো শরীক নেই; এবং সাক্ষ্য দিচ্ছি যে মুহাম্মাদ ﷺ তাঁর বান্দা ও রাসূল।', src: 'Muslim 234' },
  qunut: { ar: 'اللّٰهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنُؤْمِنُ بِكَ وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ، وَنَشْكُرُكَ وَلَا نَكْفُرُكَ، وَنَخْلَعُ وَنَتْرُكُ مَنْ يَفْجُرُكَ. اللّٰهُمَّ إِيَّاكَ نَعْبُدُ، وَلَكَ نُصَلِّي وَنَسْجُدُ، وَإِلَيْكَ نَسْعَى وَنَحْفِدُ، وَنَرْجُو رَحْمَتَكَ وَنَخْشَى عَذَابَكَ، إِنَّ عَذَابَكَ بِالْكُفَّارِ مُلْحِقٌ',
    tr: 'Allāhumma innā nasta‘īnuka wa nastaghfiruka wa nu’minu bika wa natawakkalu ‘alayka wa nuthnī ‘alayka-l-khayr, wa nashkuruka wa lā nakfuruk, wa nakhla‘u wa natruku man yafjuruk. Allāhumma iyyāka na‘budu wa laka nuṣallī wa nasjud, wa ilayka nas‘ā wa naḥfid, wa narjū raḥmataka wa nakhshā ‘adhābak, inna ‘adhābaka bil-kuffāri mulḥiq.',
    en: 'O Allah, we seek Your help and Your forgiveness, we believe in You, rely on You and praise You with all good. We thank You and are not ungrateful, and we cast off and leave whoever disobeys You. O Allah, You alone we worship, to You we pray and prostrate, to You we hasten. We hope for Your mercy and fear Your punishment; Your punishment will surely reach the disbelievers.',
    bn: 'হে আল্লাহ! আমরা আপনার সাহায্য চাই, আপনার কাছে ক্ষমা চাই, আপনার প্রতি ঈমান আনি, আপনার উপর ভরসা করি এবং আপনার উত্তম প্রশংসা করি। আমরা আপনার কৃতজ্ঞতা প্রকাশ করি, অকৃতজ্ঞ হই না; যে আপনার অবাধ্য হয় তাকে আমরা ত্যাগ করি। হে আল্লাহ! আমরা আপনারই ইবাদত করি, আপনার জন্যই নামাজ পড়ি ও সিজদা করি, আপনার দিকেই ধাবিত হই; আপনার রহমতের আশা রাখি ও আপনার শাস্তিকে ভয় করি; নিশ্চয়ই আপনার শাস্তি কাফিরদের উপর আপতিত হবে।', src: 'Ibn Abi Shaybah, al-Bayhaqi' },
  janazah: { ar: 'اللّٰهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا وَشَاهِدِنَا وَغَائِبِنَا وَصَغِيرِنَا وَكَبِيرِنَا وَذَكَرِنَا وَأُنْثَانَا، اللّٰهُمَّ مَنْ أَحْيَيْتَهُ مِنَّا فَأَحْيِهِ عَلَى الْإِسْلَامِ، وَمَنْ تَوَفَّيْتَهُ مِنَّا فَتَوَفَّهُ عَلَى الْإِيمَانِ',
    tr: 'Allāhumma-ghfir li-ḥayyinā wa mayyitinā wa shāhidinā wa ghā’ibinā wa ṣaghīrinā wa kabīrinā wa dhakarinā wa unthānā. Allāhumma man aḥyaytahū minnā fa-aḥyihī ‘ala-l-islām, wa man tawaffaytahū minnā fa-tawaffahū ‘ala-l-īmān.',
    en: 'O Allah, forgive our living and our dead, those present and those absent, our young and our old, our men and our women. O Allah, whoever of us You keep alive, keep him alive in Islam, and whoever of us You take, take him in faith.',
    bn: 'হে আল্লাহ! আমাদের জীবিত ও মৃত, উপস্থিত ও অনুপস্থিত, ছোট ও বড়, পুরুষ ও নারী সবাইকে ক্ষমা করুন। হে আল্লাহ! আমাদের মধ্যে যাকে জীবিত রাখেন তাকে ইসলামের উপর জীবিত রাখুন, আর যাকে মৃত্যু দেন তাকে ঈমানের সাথে মৃত্যু দিন।', src: 'Tirmidhi 1024' },
  istikhara: { ar: 'اللّٰهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ. اللّٰهُمَّ إِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ خَيْرٌ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي فَاقْدُرْهُ لِي وَيَسِّرْهُ لِي ثُمَّ بَارِكْ لِي فِيهِ، وَإِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ شَرٌّ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي فَاصْرِفْهُ عَنِّي وَاصْرِفْنِي عَنْهُ، وَاقْدُرْ لِيَ الْخَيْرَ حَيْثُ كَانَ ثُمَّ أَرْضِنِي بِهِ',
    tr: 'Allāhumma innī astakhīruka bi‘ilmik, wa astaqdiruka biqudratik, wa as’aluka min faḍlika-l-‘aẓīm, fa innaka taqdiru wa lā aqdir, wa ta‘lamu wa lā a‘lam, wa anta ‘allāmu-l-ghuyūb. Allāhumma in kunta ta‘lamu anna hādha-l-amra khayrun lī fī dīnī wa ma‘āshī wa ‘āqibati amrī faqdurhu lī wa yassirhu lī thumma bārik lī fīh. Wa in kunta ta‘lamu anna hādha-l-amra sharrun lī fī dīnī wa ma‘āshī wa ‘āqibati amrī faṣrifhu ‘annī waṣrifnī ‘anh, waqdur liya-l-khayra ḥaythu kāna thumma arḍinī bih.',
    en: 'O Allah, I ask You to guide me by Your knowledge and to give me ability by Your power, and I ask of Your great bounty; You are able and I am not, You know and I do not, and You know the unseen. O Allah, if You know this matter is good for me in my religion, my life and its outcome, decree it for me, make it easy for me and bless it for me. And if You know it is bad for me in my religion, my life and its outcome, turn it away from me and turn me away from it, and decree good for me wherever it is, and make me content with it.',
    bn: 'হে আল্লাহ! আমি আপনার জ্ঞানের ভিত্তিতে আপনার কাছে কল্যাণ চাই, আপনার শক্তির মাধ্যমে শক্তি চাই এবং আপনার মহা অনুগ্রহ প্রার্থনা করি। আপনি সক্ষম, আমি অক্ষম; আপনি জানেন, আমি জানি না; আপনি গায়েবের সব জানেন। হে আল্লাহ! যদি আপনি জানেন এই কাজটি আমার দ্বীন, জীবিকা ও পরিণামে আমার জন্য কল্যাণকর, তবে তা আমার জন্য নির্ধারণ করুন, সহজ করুন এবং তাতে বরকত দিন। আর যদি জানেন এটি আমার দ্বীন, জীবিকা ও পরিণামে অকল্যাণকর, তবে তা আমার থেকে ফিরিয়ে দিন এবং আমাকেও তা থেকে ফিরিয়ে রাখুন; আর যেখানে কল্যাণ আছে তা আমার জন্য নির্ধারণ করুন এবং তাতে আমাকে সন্তুষ্ট রাখুন।', src: 'Bukhari 1162' },
};

// ---------- The figure: illustrated postures that crossfade ----------
/// Each step's posture, and the picture that shows it.
const POSE_IMG = { stand: 'qiyam', niyyah: 'rest', rest: 'rest', takbir: 'takbir', ruku: 'ruku', sujud: 'sujud', sit: 'sit', tashahhud: 'tashahhud', salam: 'salam' };
const poseSrc = (name) => `/salah/${sgFemale() ? 'f-' : ''}${POSE_IMG[name] || 'qiyam'}.webp`;
// Load them all once, so moving between steps is instant.
let posesLoaded = '';
function preloadPoses() {
  if (posesLoaded === sgWho()) return;
  posesLoaded = sgWho();
  for (const f of new Set(Object.values(POSE_IMG))) { const im = new Image(); im.src = `/salah/${sgFemale() ? 'f-' : ''}${f}.webp`; }
}

function sgFigure() {
  preloadPoses();
  return `<div class="sg-photo" aria-hidden="true"><div class="sg-floor"></div><img class="on" alt="" src="${poseSrc('stand')}"><img alt=""></div>`;
}

function sgPose(name) {
  const box = $('.sg-photo');
  if (!box) return;
  const src = poseSrc(name);
  const [a, b] = $$('img', box);
  const front = a.classList.contains('on') ? a : b, back = front === a ? b : a;
  if (front.getAttribute('src') === src) return;
  box.dataset.pose = name;
  back.onload = () => { back.classList.add('on'); front.classList.remove('on'); };
  back.src = src;
  if (back.complete && back.naturalWidth) back.onload();
}

// ---------- Wudu, ghusl and tayammum: illustrated steps ----------
/// Each step's picture (ghusl's whole-body wash reuses the arm).
const ART_IMG = { body: 'arm' };
/// Women's pictures: for the head and ears only the wet hands are shown.
const ART_IMG_F = { body: 'arm', head: 'wet', ear: 'wet' };
function sgArt(kind, n) {
  return `<div class="sg-photo"><div class="sg-floor"></div><img class="on" alt="" src="/salah/${sgFemale() ? `fw-${ART_IMG_F[kind] || kind}` : `w-${ART_IMG[kind] || kind}`}.webp"></div>${n ? `<span class="sg-times">×${N(n)}</span>` : ''}`;
}

// ---------- The guided flows ----------
const FLOWS = {
  prayer: { key: 'learn', title: SGT.learn, steps: [
    { pose: 'niyyah', t: ['Intention', 'নিয়ত'], ar: 'النِّيَّة', d: ['Stand facing the Qibla, clean and in wudu. Make the intention in your heart for the prayer you are about to pray — for example, two rak\'ah fard of Fajr. No set words are needed.', 'পবিত্র অবস্থায়, অজু করে কিবলার দিকে মুখ করে দাঁড়ান। মনে মনে নিয়ত করুন কোন নামাজ পড়ছেন — যেমন ফজরের দুই রাকাত ফরজ। নির্দিষ্ট শব্দ বলা জরুরি নয়।'] },
    { pose: 'takbir', t: ['Opening takbir', 'তাকবিরে তাহরিমা'], ar: 'تَكْبِيرَةُ الْإِحْرَام', d: ['Raise both hands, palms towards the Qibla, thumbs near the earlobes, and say:', 'দুই হাত তুলুন, হাতের তালু কিবলার দিকে, বৃদ্ধাঙ্গুল কানের লতির কাছে, এবং বলুন:'],
      dw: ['Raise both hands to the shoulders, palms towards the Qibla and fingers together, keeping them inside your scarf, and say:', 'দুই হাত কাঁধ পর্যন্ত তুলুন, হাতের তালু কিবলার দিকে, আঙুল মিলিয়ে, ওড়নার ভেতরে রেখে, এবং বলুন:'], rec: ['takbir'] },
    { pose: 'stand', t: ['Standing: Thana', 'কিয়াম: সানা'], ar: 'الثَّنَاء', d: ['Fold your hands, right over left, below the navel. Look at the place of sujud, and quietly recite:', 'ডান হাত বাম হাতের উপর রেখে নাভির নিচে বাঁধুন। সিজদার জায়গায় দৃষ্টি রেখে নীরবে পড়ুন:'],
      dw: ['Place your right hand over the left on your chest. Look at the place of sujud, and quietly recite:', 'ডান হাত বাম হাতের উপর রেখে বুকের উপর রাখুন। সিজদার জায়গায় দৃষ্টি রেখে নীরবে পড়ুন:'], rec: ['thana'] },
    { pose: 'stand', t: ['Seeking refuge', 'আউযুবিল্লাহ ও বিসমিল্লাহ'], ar: 'التَّعَوُّذ وَالْبَسْمَلَة', d: ['Still standing, quietly say:', 'দাঁড়িয়ে থেকেই নীরবে পড়ুন:'], rec: ['taawwudh', 'bismillah'] },
    { pose: 'stand', t: ['Surah Al-Fatiha', 'সূরা আল-ফাতিহা'], ar: 'الْفَاتِحَة', d: ['Recite Al-Fatiha, the opening chapter, in every rak\'ah. At the end, say Āmīn quietly.', 'প্রতি রাকাতে সূরা ফাতিহা পড়ুন। শেষে নীরবে "আমীন" বলুন।'], fatiha: true, rec: ['amin'] },
    { pose: 'stand', t: ['Another surah', 'আরেকটি সূরা'], ar: 'ضَمُّ السُّورَة', d: ['In the first two rak\'ah, recite a surah or at least three short verses after Al-Fatiha — for example, Al-Ikhlas:', 'প্রথম দুই রাকাতে ফাতিহার পর একটি সূরা বা অন্তত তিনটি ছোট আয়াত পড়ুন — যেমন সূরা ইখলাস:'], surah: 112 },
    { pose: 'ruku', t: ['Bowing: Ruku', 'রুকু'], ar: 'الرُّكُوع', dw: ['Say Allāhu Akbar and bow a little, just enough for your hands to reach your knees. Rest your hands on the knees with fingers together, keep your arms close to your body and the knees slightly bent, and say three times:', '"আল্লাহু আকবার" বলে অল্প ঝুঁকে রুকু করুন, যেন হাত হাঁটু পর্যন্ত পৌঁছায়। আঙুল মিলিয়ে হাত হাঁটুর উপর রাখুন, বাহু শরীরের সাথে লাগিয়ে রাখুন, হাঁটু সামান্য বাঁকা রাখুন, এবং তিনবার বলুন:'],
      d: ['Say Allāhu Akbar and bow. Hold your knees with spread fingers, back straight and level with your head, and say three times:', '"আল্লাহু আকবার" বলে রুকুতে যান। আঙুল ছড়িয়ে হাঁটু ধরুন, পিঠ ও মাথা সমান রাখুন, এবং তিনবার বলুন:'], rec: ['ruku'] },
    { pose: 'rest', t: ['Rising: Qawmah', 'কওমা'], ar: 'الْقَوْمَة', d: ['Rise until you stand straight, hands at your sides, saying the first phrase as you rise and the second once upright:', 'রুকু থেকে উঠে সোজা হয়ে দাঁড়ান, হাত দুই পাশে। উঠতে উঠতে প্রথমটি এবং দাঁড়িয়ে দ্বিতীয়টি বলুন:'], rec: ['tasmi', 'tahmid'] },
    { pose: 'sujud', t: ['Prostration: Sujud', 'সিজদা'], ar: 'السُّجُود', dw: ['Say Allāhu Akbar and go down into a compact sujud: forehead and nose on the ground, forearms resting on the ground close to your sides, stomach close to your thighs, everything gathered and covered. Say three times:', '"আল্লাহু আকবার" বলে জড়সড় হয়ে সিজদা করুন: কপাল ও নাক মাটিতে, দুই বাহু শরীরের সাথে লাগিয়ে মাটিতে রাখুন, পেট উরুর সাথে লাগিয়ে রাখুন, সব গুটিয়ে ও ঢাকা থাকবে। তিনবার বলুন:'],
      d: ['Say Allāhu Akbar and go down: knees first, then hands, then nose and forehead. Seven parts touch the ground — forehead with nose, both hands, both knees and the toes of both feet. Say three times:', '"আল্লাহু আকবার" বলে সিজদায় যান: প্রথমে হাঁটু, তারপর হাত, তারপর নাক ও কপাল। সাতটি অঙ্গ মাটিতে লাগবে — নাকসহ কপাল, দুই হাত, দুই হাঁটু ও দুই পায়ের আঙুল। তিনবার বলুন:'], rec: ['sujud'] },
    { pose: 'sit', t: ['Sitting: Jalsa', 'জলসা'], ar: 'الْجَلْسَة', dw: ['Say Allāhu Akbar and sit up on your left hip with both feet tucked out to the right, hands on your thighs with fingers together. Pause calmly; you may say:', '"আল্লাহু আকবার" বলে বাম নিতম্বের উপর বসুন, দুই পা ডান দিকে বের করে রাখুন, আঙুল মিলিয়ে হাত উরুর উপর রাখুন। একটু স্থির হয়ে বসুন; চাইলে বলতে পারেন:'],
      d: ['Say Allāhu Akbar and sit up on your left foot, the right foot upright, hands on your thighs. Pause calmly; you may say:', '"আল্লাহু আকবার" বলে বাম পায়ের উপর বসুন, ডান পা খাড়া রাখুন, হাত উরুর উপর। একটু স্থির হয়ে বসুন; চাইলে বলতে পারেন:'], rec: ['jalsa'] },
    { pose: 'sujud', t: ['Second sujud', 'দ্বিতীয় সিজদা'], ar: 'السَّجْدَةُ الثَّانِيَة', d: ['Say Allāhu Akbar and make a second sujud just like the first, saying three times:', '"আল্লাহু আকবার" বলে আগের মতোই দ্বিতীয় সিজদা করুন এবং তিনবার বলুন:'], rec: ['sujud'] },
    { pose: 'stand', t: ['The second rak\'ah', 'দ্বিতীয় রাকাত'], ar: 'الرَّكْعَةُ الثَّانِيَة', d: ['Say Allāhu Akbar and stand up. Pray the second rak\'ah the same way — Bismillah, Al-Fatiha, a surah, ruku, qawmah and two sujud — but without Thana.', '"আল্লাহু আকবার" বলে দাঁড়ান। একইভাবে দ্বিতীয় রাকাত পড়ুন — বিসমিল্লাহ, ফাতিহা, সূরা, রুকু, কওমা ও দুই সিজদা — তবে সানা পড়বেন না।'], rec: ['bismillah'] },
    { pose: 'tashahhud', t: ['Sitting: Tashahhud', 'বৈঠক: তাশাহহুদ'], ar: 'التَّشَهُّد', dw: ['After the second sujud, sit on your left hip with both feet to the right, and recite the Tashahhud. Raise your right index finger at "lā ilāha" and lower it at "illa-llāh".', 'দ্বিতীয় সিজদার পর বাম নিতম্বের উপর দুই পা ডান দিকে বের করে বসুন এবং তাশাহহুদ পড়ুন। "লা ইলাহা" বলার সময় ডান হাতের শাহাদাত আঙুল তুলুন এবং "ইল্লাল্লাহ" বলার সময় নামান।'],
      d: ['After the second sujud, sit and recite the Tashahhud. Raise your right index finger at "lā ilāha" and lower it at "illa-llāh".', 'দ্বিতীয় সিজদার পর বসে তাশাহহুদ পড়ুন। "লা ইলাহা" বলার সময় ডান হাতের শাহাদাত আঙুল তুলুন এবং "ইল্লাল্লাহ" বলার সময় নামান।'], rec: ['tashahhud'] },
    { pose: 'sit', t: ['Durood Ibrahim', 'দরুদ শরীফ'], ar: 'الصَّلَاةُ الْإِبْرَاهِيمِيَّة', d: ['Still sitting, send blessings on the Prophet ﷺ:', 'বসে থেকেই নবী ﷺ-এর উপর দরুদ পড়ুন:'], rec: ['durood'] },
    { pose: 'sit', t: ['A supplication', 'দোয়া মাসূরা'], ar: 'الدُّعَاء', d: ['Then make a supplication from the Quran or Sunnah, such as the one the Prophet ﷺ taught Abu Bakr:', 'তারপর কুরআন বা সুন্নাহর একটি দোয়া পড়ুন, যেমন নবী ﷺ আবু বকর (রা.)-কে যা শিখিয়েছিলেন:'], rec: ['masura'] },
    { pose: 'salam', t: ['Ending: Salam', 'সালাম'], ar: 'التَّسْلِيم', d: ['Turn your face to the right and say the salam, then to the left and say it again. Your prayer is complete.', 'ডান দিকে মুখ ফিরিয়ে সালাম বলুন, তারপর বাম দিকে ফিরিয়ে আবার বলুন। নামাজ শেষ হলো।'], rec: ['salam'] },
    { pose: 'rest', t: ['Three and four rak\'ah', 'তিন ও চার রাকাতের নামাজ'], ar: 'ثَلَاث وَأَرْبَع', end: true, d: ['For Maghrib (3) and Dhuhr, Asr and Isha (4): after the second rak\'ah, sit and recite only the Tashahhud, then say Allāhu Akbar and stand for the next rak\'ah. In the third and fourth rak\'ah of a fard prayer, recite only Al-Fatiha. In the final sitting, recite Tashahhud, Durood and the supplication, then the salam.', 'মাগরিব (৩ রাকাত) এবং যোহর, আসর ও এশা (৪ রাকাত): দ্বিতীয় রাকাতের পর বসে শুধু তাশাহহুদ পড়ুন, তারপর "আল্লাহু আকবার" বলে পরের রাকাতের জন্য দাঁড়ান। ফরজ নামাজের তৃতীয় ও চতুর্থ রাকাতে শুধু সূরা ফাতিহা পড়ুন। শেষ বৈঠকে তাশাহহুদ, দরুদ ও দোয়া পড়ে সালাম ফেরান।'] },
  ] },
  wudu: { key: 'wudu', title: ['Wudu', 'অজু'], steps: [
    { art: 'intent', t: ['Intention and Bismillah', 'নিয়ত ও বিসমিল্লাহ'], ar: 'النِّيَّة وَالتَّسْمِيَة', d: ['Intend in your heart to purify yourself for prayer, and begin with:', 'মনে মনে নামাজের জন্য পবিত্র হওয়ার নিয়ত করুন এবং শুরু করুন:'], rec: ['bismillah'] },
    { art: 'hands', n: 3, t: ['Wash the hands', 'দুই হাত ধোয়া'], ar: 'غَسْلُ الْكَفَّيْن', d: ['Wash both hands up to the wrists three times, washing between the fingers.', 'দুই হাত কবজি পর্যন্ত তিনবার ধুয়ে নিন, আঙুলের ফাঁকেও পানি পৌঁছান।'] },
    { art: 'mouth', n: 3, t: ['Rinse the mouth', 'কুলি করা'], ar: 'الْمَضْمَضَة', d: ['Take water in your right hand and rinse your mouth three times. Using a miswak is Sunnah.', 'ডান হাতে পানি নিয়ে তিনবার কুলি করুন। মিসওয়াক করা সুন্নত।'] },
    { art: 'nose', n: 3, t: ['Clean the nose', 'নাকে পানি দেওয়া'], ar: 'الِاسْتِنْشَاق', d: ['Sniff water into the nose with the right hand and blow it out with the left, three times.', 'ডান হাতে নাকে পানি দিন এবং বাম হাতে ঝেড়ে পরিষ্কার করুন, তিনবার।'] },
    { art: 'face', n: 3, t: ['Wash the face', 'মুখমণ্ডল ধোয়া'], ar: 'غَسْلُ الْوَجْه', d: ['Wash the whole face three times — from the hairline to below the chin, and from ear to ear. Run wet fingers through a thick beard. (Fard)', 'পুরো মুখমণ্ডল তিনবার ধুয়ে নিন — কপালের চুলের গোড়া থেকে থুতনির নিচ পর্যন্ত এবং এক কান থেকে আরেক কান পর্যন্ত। ঘন দাড়ি থাকলে ভেজা আঙুল দিয়ে খিলাল করুন। (ফরজ)'] },
    { art: 'arm', n: 3, t: ['Wash the arms', 'দুই হাত কনুইসহ ধোয়া'], ar: 'غَسْلُ الْيَدَيْن', d: ['Wash the right arm, then the left, from the fingertips up to and including the elbows, three times each. (Fard)', 'প্রথমে ডান হাত, তারপর বাম হাত আঙুলের মাথা থেকে কনুইসহ তিনবার করে ধুয়ে নিন। (ফরজ)'] },
    { art: 'head', t: ['Wipe the head', 'মাথা মাসেহ'], ar: 'مَسْحُ الرَّأْس', dw: ['With wet hands, wipe over the hair itself once (not over the scarf), from the front to the back. Wiping at least a quarter of the head is fard.', 'ভেজা হাতে একবার চুলের উপর মাসেহ করুন (ওড়না বা হিজাবের উপর নয়), সামনে থেকে পেছনে। মাথার অন্তত এক-চতুর্থাংশ মাসেহ করা ফরজ।'],
      d: ['Wipe over the head once with wet hands, from the front to the back and back again. Wiping at least a quarter of the head is fard.', 'ভেজা হাতে একবার মাথা মাসেহ করুন — সামনে থেকে পেছনে এবং আবার সামনে। মাথার অন্তত এক-চতুর্থাংশ মাসেহ করা ফরজ।'] },
    { art: 'ear', t: ['Wipe the ears', 'কান মাসেহ'], ar: 'مَسْحُ الْأُذُنَيْن', d: ['With the same wet hands, wipe inside the ears with the index fingers and behind them with the thumbs. Wiping the back of the neck is also recommended.', 'একই ভেজা হাতে শাহাদাত আঙুল দিয়ে কানের ভেতর এবং বৃদ্ধাঙ্গুল দিয়ে কানের পেছন মাসেহ করুন। ঘাড় মাসেহ করাও মুস্তাহাব।'] },
    { art: 'feet', n: 3, t: ['Wash the feet', 'দুই পা টাখনুসহ ধোয়া'], ar: 'غَسْلُ الرِّجْلَيْن', d: ['Wash the right foot, then the left, up to and including the ankles, three times each. Wash between the toes with the little finger. (Fard)', 'প্রথমে ডান পা, তারপর বাম পা টাখনুসহ তিনবার করে ধুয়ে নিন। কনিষ্ঠ আঙুল দিয়ে পায়ের আঙুলের ফাঁক খিলাল করুন। (ফরজ)'] },
    { art: 'dua', t: ['The supplication after wudu', 'অজুর পরের দোয়া'], ar: 'الدُّعَاءُ بَعْدَ الْوُضُوء', end: true, d: ['When you finish, say the testimony of faith. Whoever says it, the eight gates of Paradise are opened for him.', 'অজু শেষে কালিমা শাহাদাত পড়ুন। যে তা পড়ে, তার জন্য জান্নাতের আটটি দরজা খুলে দেওয়া হয়।'], rec: ['shahada'] },
  ] },
  ghusl: { key: 'ghusl', title: ['Ghusl', 'গোসল'], steps: [
    { art: 'intent', t: ['Intention', 'নিয়ত'], ar: 'النِّيَّة', d: ['Intend in your heart to remove the major impurity, and say Bismillah.', 'মনে মনে বড় অপবিত্রতা দূর করার নিয়ত করুন এবং বিসমিল্লাহ বলুন।'], rec: ['bismillah'] },
    { art: 'hands', n: 3, t: ['Wash hands and private parts', 'হাত ও লজ্জাস্থান ধোয়া'], ar: 'غَسْلُ الْيَدَيْن وَالْفَرْج', d: ['Wash both hands, then wash the private parts and remove any impurity from the body.', 'দুই হাত ধুয়ে নিন, তারপর লজ্জাস্থান ধুয়ে শরীরে লেগে থাকা নাপাকি দূর করুন।'] },
    { art: 'face', t: ['Make wudu', 'অজু করা'], ar: 'الْوُضُوء', d: ['Perform a complete wudu as for prayer.', 'নামাজের মতো পূর্ণ অজু করুন।'] },
    { art: 'mouth', t: ['Mouth and nose', 'কুলি ও নাকে পানি'], ar: 'الْمَضْمَضَة وَالِاسْتِنْشَاق', d: ['Rinse the mouth thoroughly and clean the nose with water — both are fard in ghusl.', 'ভালোভাবে কুলি করুন এবং নাকে পানি দিন — গোসলে দুটোই ফরজ।'] },
    { art: 'head', n: 3, t: ['Pour water over the head', 'মাথায় পানি ঢালা'], ar: 'إِفَاضَةُ الْمَاءِ عَلَى الرَّأْس', d: ['Pour water over your head three times, letting it reach the roots of the hair.', 'মাথায় তিনবার পানি ঢালুন, যেন চুলের গোড়া পর্যন্ত পৌঁছায়।'] },
    { art: 'body', end: true, t: ['Wash the whole body', 'সারা শরীর ধোয়া'], ar: 'غَسْلُ الْبَدَن', d: ['Pour water over the right side, then the left, then the whole body, so that not a single spot is left dry. (Fard)', 'প্রথমে ডান পাশে, তারপর বাম পাশে, তারপর সারা শরীরে পানি ঢালুন, যেন একটুও শুকনো না থাকে। (ফরজ)'] },
  ] },
  tayammum: { key: 'tayammum', title: ['Tayammum', 'তায়াম্মুম'], steps: [
    { art: 'intent', t: ['When and intention', 'কখন ও নিয়ত'], ar: 'النِّيَّة', d: ['Tayammum replaces wudu or ghusl when water cannot be found or using it would cause harm. Intend purification for prayer and say Bismillah.', 'পানি না পাওয়া গেলে বা ব্যবহারে ক্ষতির আশঙ্কা থাকলে অজু বা গোসলের পরিবর্তে তায়াম্মুম করা যায়। নামাজের জন্য পবিত্রতার নিয়ত করে বিসমিল্লাহ বলুন।'], rec: ['bismillah'] },
    { art: 'earth', t: ['Strike clean earth', 'পবিত্র মাটিতে হাত মারা'], ar: 'الضَّرْبَة', d: ['Strike both palms lightly on clean earth, sand or stone, and shake off the excess.', 'দুই হাতের তালু পবিত্র মাটি, বালি বা পাথরে আলতোভাবে মারুন এবং অতিরিক্ত ধুলা ঝেড়ে ফেলুন।'] },
    { art: 'face', t: ['Wipe the face', 'মুখ মাসেহ'], ar: 'مَسْحُ الْوَجْه', d: ['Wipe the whole face with both palms.', 'দুই তালু দিয়ে পুরো মুখমণ্ডল মাসেহ করুন।'] },
    { art: 'earth', t: ['Strike again', 'আবার হাত মারা'], ar: 'الضَّرْبَةُ الثَّانِيَة', d: ['Strike the earth a second time with both palms.', 'দ্বিতীয়বার মাটিতে দুই হাত মারুন।'] },
    { art: 'arm', end: true, t: ['Wipe the arms', 'দুই হাত মাসেহ'], ar: 'مَسْحُ الْيَدَيْن', d: ['Wipe the right arm with the left hand up to the elbow, then the left arm with the right. Tayammum is broken by whatever breaks wudu, and by finding water.', 'বাম হাত দিয়ে ডান হাত কনুই পর্যন্ত, তারপর ডান হাত দিয়ে বাম হাত মাসেহ করুন। যা অজু ভঙ্গ করে তা তায়াম্মুমও ভঙ্গ করে; পানি পাওয়া গেলেও তায়াম্মুম ভেঙে যায়।'] },
  ] },
};

// ---------- Reference pages ----------
const RAKAT = [
  { k: 'fajr', p: [['sunnah', 2], ['fard', 2]] },
  { k: 'dhuhr', p: [['sunnah', 4], ['fard', 4], ['sunnah', 2], ['nafl', 2]] },
  { k: 'asr', p: [['sunnah_g', 4], ['fard', 4]] },
  { k: 'maghrib', p: [['fard', 3], ['sunnah', 2], ['nafl', 2]] },
  { k: 'isha', p: [['sunnah_g', 4], ['fard', 4], ['sunnah', 2], ['nafl', 2], ['wajib', 3]] },
  { k: 'jumuah', p: [['sunnah', 4], ['fard', 2], ['sunnah', 4], ['sunnah', 2]] },
];
const PAGES = {
  rakat: { t: ['Rak\'at of each prayer', 'প্রতি নামাজের রাকাত'], ic: 'table', color: '#5b5bd6' },
  conditions: { t: ['Conditions and pillars', 'নামাজের শর্ত ও রুকন'], ic: 'shield', color: '#30a46c', body: [
    { h: ['Before you start (shurut)', 'নামাজের বাইরের শর্ত (আহকাম)'], list: [['Purity of the body — wudu, or ghusl when required', 'শরীর পবিত্র থাকা — অজু, প্রয়োজনে গোসল'], ['Clean clothes', 'কাপড় পবিত্র থাকা'], ['A clean place to pray', 'নামাজের জায়গা পবিত্র থাকা'], ['Covering the awrah — men: navel to knees; women: all but face, hands and feet', 'সতর ঢাকা — পুরুষের নাভি থেকে হাঁটু; নারীর মুখ, হাত ও পা ছাড়া সারা শরীর'], ['The prayer\'s time has begun', 'নামাজের ওয়াক্ত হওয়া'], ['Facing the Qibla', 'কিবলামুখী হওয়া'], ['Intention', 'নিয়ত করা']] },
    { h: ['Inside the prayer (arkan)', 'নামাজের ভেতরের ফরজ (আরকান)'], list: [['The opening takbir', 'তাকবিরে তাহরিমা'], ['Standing (qiyam)', 'কিয়াম (দাঁড়ানো)'], ['Recitation (qira\'ah)', 'কিরাত (পড়া)'], ['Bowing (ruku)', 'রুকু'], ['Both prostrations (sujud)', 'দুই সিজদা'], ['The final sitting for the length of the Tashahhud', 'শেষ বৈঠক (তাশাহহুদ পরিমাণ)']] },
  ] },
  breakers: { t: ['What breaks salah and wudu', 'যা নামাজ ও অজু ভঙ্গ করে'], ic: 'x', color: '#e5484d', body: [
    { h: ['Salah is broken by', 'নামাজ ভঙ্গের কারণ'], list: [['Talking, even a little', 'কথা বলা, অল্প হলেও'], ['Eating or drinking', 'খাওয়া বা পান করা'], ['Laughing aloud', 'শব্দ করে হাসা'], ['Turning the chest away from the Qibla', 'বুক কিবলা থেকে ঘুরে যাওয়া'], ['Many movements unrelated to the prayer', 'নামাজের বাইরের অনেক নড়াচড়া'], ['Losing wudu', 'অজু ভেঙে যাওয়া'], ['Leaving out a fard part', 'কোনো ফরজ ছুটে যাওয়া']] },
    { h: ['Wudu is broken by', 'অজু ভঙ্গের কারণ'], list: [['Anything leaving the front or back passage, including wind', 'পেশাব-পায়খানার রাস্তা দিয়ে কিছু বের হওয়া, বায়ুসহ'], ['Blood or pus flowing from the body', 'শরীর থেকে রক্ত বা পুঁজ বের হয়ে গড়িয়ে পড়া'], ['Vomiting a mouthful', 'মুখভরে বমি করা'], ['Sleeping lying down or leaning', 'শুয়ে বা হেলান দিয়ে ঘুমানো'], ['Fainting or losing consciousness', 'অজ্ঞান হওয়া'], ['Laughing aloud during salah', 'নামাজে শব্দ করে হাসা']] },
  ] },
  sahw: { t: ['Sajdah of forgetfulness', 'সিজদায়ে সাহু'], ic: 'undo', color: '#f76b15', body: [
    { p: ['If you forget a wajib part of the prayer — such as the first sitting, or reciting a surah after Al-Fatiha — the prayer can be mended with two extra prostrations.', 'নামাজে ভুলবশত কোনো ওয়াজিব ছুটে গেলে — যেমন প্রথম বৈঠক, বা ফাতিহার পর সূরা মেলানো — দুটি অতিরিক্ত সিজদা দিয়ে নামাজ সংশোধন করা যায়।'] },
    { h: ['How', 'নিয়ম'], steps: [['In the final sitting, recite only the Tashahhud.', 'শেষ বৈঠকে শুধু তাশাহহুদ পড়ুন।'], ['Give one salam, to the right.', 'ডান দিকে একবার সালাম ফেরান।'], ['Make two sujud, as in prayer.', 'নামাজের মতো দুটি সিজদা করুন।'], ['Sit and recite Tashahhud, Durood and the supplication, then end with the salam.', 'বসে তাশাহহুদ, দরুদ ও দোয়া পড়ে সালাম ফিরিয়ে নামাজ শেষ করুন।']] },
  ] },
  witr: { t: ['Witr', 'বিতর'], ic: 'moon', color: '#5b5bd6', body: [
    { p: ['Witr is wajib: three rak\'ah after Isha, prayed before Fajr begins, with one salam at the end.', 'বিতর নামাজ ওয়াজিব: এশার পর তিন রাকাত, ফজরের আগে, শেষে এক সালামে।'] },
    { h: ['How', 'নিয়ম'], steps: [['Pray two rak\'ah and sit for the Tashahhud only.', 'দুই রাকাত পড়ে বসে শুধু তাশাহহুদ পড়ুন।'], ['Stand for the third; recite Al-Fatiha and a surah.', 'তৃতীয় রাকাতের জন্য দাঁড়িয়ে ফাতিহা ও সূরা পড়ুন।'], ['Say Allāhu Akbar raising your hands to the ears, fold them again, and recite Du\'a al-Qunut.', 'কান পর্যন্ত হাত তুলে "আল্লাহু আকবার" বলুন, আবার হাত বেঁধে দোয়া কুনুত পড়ুন।'], ['Then ruku, sujud and the final sitting as usual.', 'তারপর স্বাভাবিকভাবে রুকু, সিজদা ও শেষ বৈঠক।']] },
    { rec: 'qunut' },
  ] },
  jumuah: { t: ['Jumu\'ah', 'জুমার নামাজ'], ic: 'mosque', color: '#30a46c', body: [
    { p: ['On Friday, Jumu\'ah replaces Dhuhr. It is fard for adult, resident men and is prayed in congregation: the imam gives the khutbah, then leads two rak\'ah aloud.', 'শুক্রবার যোহরের পরিবর্তে জুমা পড়া হয়। প্রাপ্তবয়স্ক, মুকিম পুরুষের জন্য জামাতে জুমা ফরজ: ইমাম খুতবা দেন, তারপর উচ্চস্বরে দুই রাকাত পড়ান।'] },
    { h: ['The Sunnah of Friday', 'জুমার দিনের সুন্নত'], list: [['Ghusl, clean clothes and perfume', 'গোসল, পরিষ্কার কাপড় ও সুগন্ধি'], ['Going early and listening silently to the khutbah', 'আগে আগে মসজিদে যাওয়া ও চুপ করে খুতবা শোনা'], ['Reciting Surah Al-Kahf', 'সূরা কাহফ তিলাওয়াত'], ['Much Durood on the Prophet ﷺ', 'নবী ﷺ-এর উপর বেশি বেশি দরুদ'], ['Making dua in the last hour before Maghrib', 'আসরের পর মাগরিবের আগে দোয়া করা']] },
  ] },
  eid: { t: ['Eid prayer', 'ঈদের নামাজ'], ic: 'star', color: '#d99a1e', body: [
    { p: ['Two rak\'ah in the morning of Eid, in congregation, with six extra takbirs. There is no adhan or iqamah; the khutbah comes after the prayer.', 'ঈদের সকালে জামাতে দুই রাকাত, ছয়টি অতিরিক্ত তাকবিরসহ। আজান ও ইকামত নেই; খুতবা নামাজের পরে।'] },
    { h: ['How', 'নিয়ম'], steps: [['Opening takbir, then Thana.', 'তাকবিরে তাহরিমা, তারপর সানা।'], ['Three extra takbirs: raise the hands each time and let them fall; fold them after the third.', 'তিনটি অতিরিক্ত তাকবির: প্রতিবার হাত তুলে ছেড়ে দিন; তৃতীয়টির পর হাত বাঁধুন।'], ['The imam recites; ruku and sujud as usual.', 'ইমাম কিরাত পড়বেন; তারপর স্বাভাবিক রুকু ও সিজদা।'], ['In the second rak\'ah, after the recitation, three extra takbirs with the hands raised, then a fourth takbir to go into ruku.', 'দ্বিতীয় রাকাতে কিরাতের পর হাত তুলে তিনটি অতিরিক্ত তাকবির, তারপর চতুর্থ তাকবির বলে রুকুতে যান।'], ['Complete the prayer, then listen to the khutbah.', 'নামাজ শেষ করে খুতবা শুনুন।']] },
  ] },
  janazah: { t: ['Janazah', 'জানাযার নামাজ'], ic: 'heart', color: '#6b7690', body: [
    { p: ['The funeral prayer is fard kifayah: prayed standing, in congregation, with four takbirs and no ruku or sujud.', 'জানাযার নামাজ ফরজে কিফায়া: দাঁড়িয়ে, জামাতে, চার তাকবিরে; রুকু-সিজদা নেই।'] },
    { h: ['How', 'নিয়ম'], steps: [['First takbir with the hands raised, then Thana (adding "wa jalla thanā\'uk").', 'প্রথম তাকবির হাত তুলে, তারপর সানা ("ওয়া জাল্লা সানাউকা" যোগ করে)।'], ['Second takbir, then the Durood Ibrahim.', 'দ্বিতীয় তাকবির, তারপর দরুদ শরীফ।'], ['Third takbir, then the supplication for the deceased.', 'তৃতীয় তাকবির, তারপর মৃতের জন্য দোয়া।'], ['Fourth takbir, then the salam to the right and the left.', 'চতুর্থ তাকবির, তারপর ডানে ও বামে সালাম।']] },
    { rec: 'janazah' },
  ] },
  tahajjud: { t: ['Tahajjud', 'তাহাজ্জুদ'], ic: 'isha', color: '#8e4ec6', body: [
    { p: ['The night prayer, prayed after Isha and best in the last third of the night (see Today for its time). Pray in sets of two rak\'ah, commonly 2 to 8, then Witr if you have not prayed it.', 'রাতের নামাজ, এশার পর, রাতের শেষ তৃতীয়াংশে সবচেয়ে উত্তম (সময় "আজ" পাতায় দেখুন)। দুই রাকাত করে, সাধারণত ২ থেকে ৮ রাকাত, তারপর বিতর না পড়ে থাকলে বিতর।'] },
    { p: ['"Our Lord descends every night to the lowest heaven in the last third of the night and says: Who will call upon Me, that I may answer him?" — Bukhari 1145', '"আমাদের রব প্রতি রাতের শেষ তৃতীয়াংশে নিকটবর্তী আসমানে নেমে আসেন এবং বলেন: কে আমাকে ডাকবে, আমি তার ডাকে সাড়া দেব?" — বুখারী ১১৪৫'], quote: true },
  ] },
  istikhara: { t: ['Istikhara', 'ইস্তিখারা'], ic: 'sparkle', color: '#12a594', body: [
    { p: ['When facing a decision, pray two rak\'ah of nafl, then make this supplication, naming your matter where it says "this matter". Then proceed with what feels right and trust Allah.', 'কোনো সিদ্ধান্তের আগে দুই রাকাত নফল নামাজ পড়ে এই দোয়া করুন; "এই কাজটি" বলার সময় নিজের বিষয়টি মনে করুন। তারপর যা ভালো মনে হয় তা করুন এবং আল্লাহর উপর ভরসা রাখুন।'] },
    { rec: 'istikhara' },
  ] },
  travel: { t: ['Prayer while travelling', 'সফরের নামাজ'], ic: 'plane', color: '#0091ff', body: [
    { p: ['When you travel 48 miles (about 78 km) or more from home, intending to stay fewer than 15 days, shorten the four-rak\'ah fard prayers — Dhuhr, Asr and Isha — to two (qasr). Fajr and Maghrib stay the same; Witr is still prayed.', 'বাড়ি থেকে ৪৮ মাইল (প্রায় ৭৮ কিমি) বা তার বেশি দূরে সফরে গেলে এবং সেখানে ১৫ দিনের কম থাকার নিয়ত হলে চার রাকাতের ফরজ — যোহর, আসর ও এশা — দুই রাকাত (কসর) পড়ুন। ফজর ও মাগরিব অপরিবর্তিত; বিতরও পড়তে হবে।'] },
    { p: ['Sunnah prayers may be left when hurried, except the Sunnah of Fajr. Waqt\'s Travel mode tells you when you have gone far enough.', 'তাড়াহুড়ায় সুন্নত ছাড়া যায়, তবে ফজরের সুন্নত নয়। ওয়াক্তের "সফর মোড" আপনাকে জানাবে কখন যথেষ্ট দূরে এসেছেন।'] },
  ] },
};
const SURAHS = [1, 112, 113, 114, 108, 103, 109, 110, 111, 105, 106, 107, 102];

Object.assign(IC, {
  pray: '<circle cx="18" cy="15" r="2.2"/><path d="M3 20h18M5.5 20 9 13l5 1.5 2.4 3.5"/><path d="M9 13 7 9"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>',
  wave: '<path d="M3 9c2 0 2-2 4.5-2S10 9 12 9s2-2 4.5-2S19 9 21 9M3 15c2 0 2-2 4.5-2S10 15 12 15s2-2 4.5-2S19 15 21 15"/>',
  hand: '<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11V4.5a1.5 1.5 0 0 1 3 0V11V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6c-3 0-4.5-1.5-6-4l-2-3.5a1.5 1.5 0 0 1 2.6-1.5L8 13"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
});

// =====================================================================
// Views
// =====================================================================
VIEWS.salah = async (tok) => {
  const parts = location.hash.replace(/^#\/?salah\/?/, '').split('/').filter(Boolean);
  const page = parts[0] || '';
  const flow = { learn: 'prayer', wudu: 'wudu', ghusl: 'ghusl', tayammum: 'tayammum' }[page];
  document.body.classList.toggle('focus', !!flow);
  if (flow) return sgFlow(flow, +parts[1] || 0);
  if (page === 'rakat') return sgRakat();
  if (page === 'surahs') return sgSurahs(tok);
  if (page === 'recitations') return sgRecitations();
  if (PAGES[page]) return sgPage(page);
  return sgHome();
};
// Full-screen flows (salah steps, azkar sessions) hide the bars; leaving them shows the bars again.
window.addEventListener('hashchange', () => { if (!/^#\/(salah\/(learn|wudu|ghusl|tayammum)|azkar\/s\/|quran\/hifz\/p\/)/.test(location.hash)) document.body.classList.remove('focus'); });

function sgHome() {
  const done = sgDone();
  const topics = ['learn', 'wudu', 'ghusl', 'tayammum'];
  const n = topics.filter((k) => done[k]).length;
  const row = (href, ic, color, label, key) => `<a class="p-row tap" href="${href}">${tile(ic, color)}<span class="p-lab"><b>${esc(tr2(label))}</b></span>${key && done[key] ? `<span class="sg-tick">${icon('check')}</span>` : ''}${chev()}</a>`;
  const pg = (k) => row(`#/salah/${k}`, PAGES[k].ic, PAGES[k].color, PAGES[k].t);
  view.innerHTML = `<div class="p-page sg">${ptitle(sgt('title'))}<p class="p-sub">${esc(sgt('sub'))}</p>
    <a class="sg-hero" href="#/salah/learn">
      <div class="sg-hero-art">${sgFigure()}</div>
      <div class="sg-hero-t"><small>${esc(N(FLOWS.prayer.steps.length))} ${esc(sgt('steps'))}</small><b>${esc(sgt('learn'))}</b><span>${esc(sgt('learn_d'))}</span>
        <span class="btn gold small">${icon('play')}${esc(done.learn ? sgt('again') : sgt('start'))}</span></div></a>
    <div class="sg-who"><span>${esc(sgt('who_d'))}</span><div class="p-seg"><button class="${sgFemale() ? '' : 'on'}" data-sa="who" data-v="m">${esc(sgt('men'))}</button><button class="${sgFemale() ? 'on' : ''}" data-sa="who" data-v="f">${esc(sgt('women'))}</button></div></div>
    <div class="sg-progress"><div class="hx-prog"><i style="width:${(n / topics.length) * 100}%"></i></div><small>${esc(sgt('learned'))}: ${N(n)} / ${N(topics.length)}</small></div>
    <div class="p-head">${esc(sgt('g_before'))}</div><div class="p-group">
      ${row('#/salah/wudu', 'drop', '#0091ff', FLOWS.wudu.title, 'wudu')}${row('#/salah/ghusl', 'wave', '#12a594', FLOWS.ghusl.title, 'ghusl')}${row('#/salah/tayammum', 'hand', '#a18072', FLOWS.tayammum.title, 'tayammum')}${pg('conditions')}</div>
    <div class="p-head">${esc(sgt('g_prayer'))}</div><div class="p-group">
      ${row('#/salah/learn', 'pray', '#d99a1e', SGT.learn, 'learn')}${pg('rakat')}${pg('breakers')}${pg('sahw')}</div>
    <div class="p-head">${esc(sgt('g_special'))}</div><div class="p-group">${['witr', 'jumuah', 'eid', 'janazah', 'tahajjud', 'istikhara', 'travel'].map(pg).join('')}</div>
    <div class="p-head">${esc(sgt('g_learn'))}</div><div class="p-group">
      ${row('#/salah/surahs', 'book', '#30a46c', [`Surahs for salah`, 'নামাজের সূরা'])}${row('#/salah/recitations', 'list', '#8e4ec6', SGT.recitations)}</div>
    <div class="p-foot">${esc(sgt('hanafi'))}</div></div>`;
  // The hero's figure bows gently, over and over.
  sgPose('stand');
  let i = 0;
  const cycle = ['stand', 'ruku', 'rest', 'sujud', 'sit', 'sujud', 'stand'];
  clearInterval(SG.demo);
  SG.demo = setInterval(() => { if (!$('.sg-hero')) { clearInterval(SG.demo); return; } sgPose(cycle[++i % cycle.length]); }, 1800);
}

/// One recitation: Arabic, transliteration, meaning, how many times, source.
function recCard(id, extra = '') {
  const r = REC[id];
  if (!r) return '';
  return `<div class="sg-rec">${r.n ? `<span class="sg-x">×${N(r.n)}</span>` : ''}<div class="sg-ar" dir="rtl" lang="ar">${r.ar}</div>
    <div class="sg-tr">${esc(r.tr)}</div><div class="sg-mean">${esc(B() ? r.bn : r.en)}</div>${r.src ? `<div class="sg-src">${esc(r.src)}</div>` : ''}${extra}</div>`;
}

async function surahCard(s) {
  const [ar, en, bn, wb] = await Promise.all([qAr(s), qTr(20, s), qTr(161, s), qWbw('en', s)]);
  const c = Q.meta?.chapters[s - 1] || (await qMeta()).chapters[s - 1];
  const arText = ar.map((a, i) => `${a.u.map(plainAr).join(' ')} <span class="qend">${AR_DIGITS(i + 1)}</span>`).join(' ');
  const trText = wb.map((v) => v.map((w) => w[1]).join(' ')).join(' · ');
  const mean = (B() ? bn : en).map((x, i) => `${N(i + 1)}. ${x}`).join(' ');
  return `<div class="sg-rec"><div class="sg-rec-h"><b>${esc(cname(c))}</b><button class="sg-play" data-sa="play" data-s="${s}" data-n="${c.verses}">${icon('play')}${esc(sgt('listen'))}</button></div>
    <div class="sg-ar quran" dir="rtl" lang="ar">${arText}</div><div class="sg-tr">${esc(trText)}</div><div class="sg-mean">${esc(mean)}</div></div>`;
}

// ---------- A guided flow ----------
function sgFlow(name, i) {
  const f = FLOWS[name];
  SG.flow = name; SG.i = Math.min(Math.max(0, i), f.steps.length - 1);
  view.innerHTML = `<div class="sg-flow ${f.steps[0].art ? 'arty' : ''}">
    <div class="sg-bar"><a class="sg-close" href="#/salah" aria-label="close">${icon('x')}</a><b>${esc(tr2(f.title))}</b><span id="sg-count"></span></div>
    <div class="sg-seg">${f.steps.map((_, k) => `<i data-k="${k}"></i>`).join('')}</div>
    <div class="sg-stage" id="sg-stage">${f.steps[0].art ? '<div id="sg-art"></div>' : sgFigure()}</div>
    <div class="sg-body" id="sg-body"></div>
    <div class="sg-nav"><button class="btn ghost" data-sa="prev">${icon('chevL')}${esc(sgt('back'))}</button><button class="btn gold" data-sa="next" id="sg-next"></button></div></div>`;
  sgStep(0);
  // Swipe left or right to move between steps.
  const st = $('.sg-flow');
  let x0 = null;
  st.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  st.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 60) sgMove(dx < 0 ? 1 : -1);
  }, { passive: true });
}

async function sgStep(dir) {
  const f = FLOWS[SG.flow], s = f.steps[SG.i], last = SG.i === f.steps.length - 1;
  $$('.sg-seg i').forEach((el, k) => el.className = k < SG.i ? 'done' : k === SG.i ? 'on' : '');
  $('#sg-count').textContent = `${N(SG.i + 1)} / ${N(f.steps.length)}`;
  $('#sg-next').innerHTML = last ? `${icon('check')}${esc(sgt('finish'))}` : `${esc(sgt('next'))}${icon('chevR')}`;
  $('[data-sa="prev"]').style.visibility = SG.i ? 'visible' : 'hidden';
  if (s.pose) sgPose(s.pose);
  if (s.art) { const a = $('#sg-art'); a.innerHTML = sgArt(s.art, s.n); a.classList.remove('in'); void a.offsetWidth; a.classList.add('in'); }
  if (s.pose && dir === 0 && !SG.posed) { SG.posed = true; }
  const body = $('#sg-body');
  const recs = (s.rec || []).map((id) => recCard(id)).join('');
  body.innerHTML = `<div class="sg-step ${dir > 0 ? 'fwd' : dir < 0 ? 'bwd' : ''}"><div class="sg-term ar" dir="rtl">${s.ar}</div><h2>${esc(tr2(s.t))}</h2><p>${esc(tr2(sgFemale() && s.dw ? s.dw : s.d))}</p>
    <div id="sg-extra"></div>${recs}${last ? `<div class="sg-end">${icon('sparkle')}${esc(sgt('well_done'))}</div>` : ''}</div>`;
  $('#scroll').scrollTop = 0;
  if (s.fatiha || s.surah) {
    await qMeta();
    const html = await surahCard(s.fatiha ? 1 : s.surah);
    const ex = $('#sg-extra'); if (ex) ex.innerHTML = html;
  }
}

function sgMove(d) {
  const f = FLOWS[SG.flow];
  const n = SG.i + d;
  if (n < 0) return;
  nativeUi('haptic');
  if (n >= f.steps.length) {
    sgMark(f.key);
    nativeUi('haptic', 'long');
    toast(`${tr2(f.title)} · ${sgt('done')} ✓`);
    location.hash = '#/salah';
    return;
  }
  SG.i = n;
  history.replaceState(null, '', `#/salah/${{ prayer: 'learn' }[SG.flow] || SG.flow}/${SG.i}`);
  sgStep(d);
}

// ---------- Reference pages ----------
function sgRakat() {
  const pill = ([kind, n]) => `<span class="sg-pill k-${kind}"><b>${N(n)}</b>${esc(sgt(kind))}</span>`;
  const rows = RAKAT.map((r) => `<div class="sg-rk"><div class="sg-rk-h">${icon(r.k === 'jumuah' ? 'mosque' : r.k)}<b>${esc(r.k === 'jumuah' ? PN.jumuah[L()] : pname(r.k))}</b><span class="ar">${PN[r.k].ar}</span>
      <span class="sg-rk-n">${N(r.p.filter(([k]) => k === 'fard').reduce((a, [, n]) => a + n, 0))} ${esc(sgt('fard'))}</span></div><div class="sg-pills">${r.p.map(pill).join('<i>→</i>')}</div></div>`).join('');
  const legend = [['fard', ['Obligatory — must be prayed', 'অবশ্যই পড়তে হবে']], ['wajib', ['Necessary — like fard in practice', 'আবশ্যক — কার্যত ফরজের মতো']], ['sunnah', ['Sunnah mu\'akkadah — the Prophet ﷺ kept it', 'সুন্নতে মুয়াক্কাদা — নবী ﷺ নিয়মিত পড়তেন']], ['sunnah_g', ['Recommended, sometimes left', 'মুস্তাহাব ধরনের, মাঝে মাঝে ছাড়তেন']], ['nafl', ['Voluntary, extra reward', 'ঐচ্ছিক, অতিরিক্ত সওয়াব']]];
  view.innerHTML = `<div class="p-page sg">${ptitle(tr2(PAGES.rakat.t), '#/salah')}<div class="sg-rks">${rows}</div>
    <div class="p-head">${esc(B() ? 'চিহ্নের অর্থ' : 'What the colours mean')}</div><div class="p-group">${legend.map(([k, d]) => `<div class="p-row"><span class="sg-pill k-${k}">${esc(sgt(k))}</span><span class="p-lab"><small>${esc(tr2(d))}</small></span></div>`).join('')}</div>
    <div class="p-foot">${esc(sgt('hanafi'))}</div></div>`;
}

function sgPage(k) {
  const pg = PAGES[k];
  const blocks = pg.body.map((b) => {
    if (b.rec) return recCard(b.rec);
    if (b.list) return `<div class="p-head">${esc(tr2(b.h))}</div><div class="p-group">${b.list.map((x) => `<div class="p-row"><span class="sg-dot"></span><span class="p-lab"><b>${esc(tr2(x))}</b></span></div>`).join('')}</div>`;
    if (b.steps) return `<div class="p-head">${esc(tr2(b.h))}</div><div class="p-group">${b.steps.map((x, i) => `<div class="p-row"><span class="sg-num">${N(i + 1)}</span><span class="p-lab"><b>${esc(tr2(x))}</b></span></div>`).join('')}</div>`;
    return `<p class="sg-para ${b.quote ? 'quote' : ''}">${esc(tr2(b.p))}</p>`;
  }).join('');
  view.innerHTML = `<div class="p-page sg">${ptitle(tr2(pg.t), '#/salah')}<div class="sg-badge">${tile(pg.ic, pg.color).replace('p-tile', 'p-tile big')}</div>${blocks}<div class="p-foot">${esc(sgt('hanafi'))}</div></div>`;
}

async function sgSurahs(tok) {
  await qMeta();
  view.innerHTML = `<div class="p-page sg">${ptitle(B() ? 'নামাজের সূরা' : 'Surahs for salah', '#/salah')}<p class="p-sub">${esc(sgt('surahs_d'))}</p><div id="sg-surahs" class="sg-list"></div></div>`;
  for (const s of SURAHS) {
    if (!live(tok)) return;
    const html = await surahCard(s);
    $('#sg-surahs')?.insertAdjacentHTML('beforeend', html);
  }
}

function sgRecitations() {
  const order = ['takbir', 'thana', 'taawwudh', 'bismillah', 'ruku', 'tasmi', 'tahmid', 'sujud', 'jalsa', 'tashahhud', 'durood', 'masura', 'salam', 'qunut', 'shahada'];
  view.innerHTML = `<div class="p-page sg">${ptitle(sgt('recitations'), '#/salah')}<p class="p-sub">${esc(sgt('recitations_d'))}</p><div class="sg-list">${order.map((id) => recCard(id)).join('')}</div></div>`;
}

// ---------- Events ----------
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-sa]');
  if (!a) return;
  const d = a.dataset;
  if (d.sa === 'who') { try { localStorage.setItem('salah-who', d.v); } catch { /* private mode */ } nativeUi('haptic'); render(); return; }
  if (d.sa === 'next') sgMove(1);
  else if (d.sa === 'prev') sgMove(-1);
  else if (d.sa === 'play') {
    // Hear the surah, repeated, to learn it.
    try {
      await post('/api/quran/play', { reciter: Q.st?.reciter || 7, s: +d.s, v: 1, to: +d.n, repeat: 1, loop: 2, gap: 0, meaning: '', next: false, speed: 1 });
      a.classList.add('on');
      Q.p = { ...Q.p, active: true, s: +d.s, v: 1, kind: 'ar', playing: true };
      qBar();
    } catch (err) { toast(err.message); }
  }
});
