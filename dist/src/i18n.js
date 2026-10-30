/* The interface in the reader's language. Books carry their own translations (books/<id>/lang);
   this is everything around them: buttons, tips, the shelf strip, the book card, the souvenir
   board, the quiz frame, the settings, the loading lines and the toys' names. `t(key, params)`
   looks a string up in the current language and falls back to English; `applyStatic()` fills
   every element that carries a data-i18n attribute (text), data-i18n-tip (data-tip),
   data-i18n-aria (aria-label) or data-i18n-title (title). */

const en = {
  switchBooks: "Learn books", switchBooksAria: "Switch to LearnComet learning books",
  brand: "StoryComet",
  eyebrow: "A STORYCOMET POP-UP BOOK",
  defaultBlurb: "Pop-up stories that read themselves aloud, light up every word, and jump out of the page when you touch them.",
  footnote: "Best with sound on · Touch everything",
  pickBook: "Pick a book",
  readToMe: "Read to me", pause: "Pause", keepReading: "Keep reading", readAgain: "Read again", illRead: "I'll read",
  openBook: "Open the book", backToShelf: "Back to the shelf", closeBook: "Close book", quizTime: "Quiz time!",
  words: "Words", wordsOf: "{language} words",
  tapWords: "tap the words to hear them · tap the card to zoom",
  tipBack: "Back", tipNext: "Next", tipLook: "Look closer", tipLanguage: "Language", tipSettings: "Settings", tipSound: "Sound",
  ariaPrev: "Previous page", ariaNext: "Next page", ariaPrevBooks: "Previous books", ariaNextBooks: "Next books",
  ariaClose: "Close the book and go back to the shelf", ariaSound: "Sound on or off", ariaReadIn: "Read in",
  ariaHearAgain: "Hear the word again", ariaPhrasebook: "Phrasebook", ariaMode: "Reading mode", ariaQuiz: "Story quiz",
  pageOf: "Page {n} of {total}", lastPage: "The last page", pageN: "Page {n}",
  pageStarsOf: "{n} of {total} stars", iReadIt: "I read it!", starsToGo: "Read every page to finish the book: {n} more stars to earn",
  phrasebookBlurb: "Every souvenir word from {title}. Tap a word to hear it said by a {language} speaker; the ones you have already heard are stamped.", native: "native",
  wordsHeard: "{count} of {total} words heard", langName_en: "English", langName_fr: "French", langName_es: "Spanish", langName_ja: "Japanese", langName_zh: "Chinese",
  profiles: "Profiles", profilesEyebrow: "WHO IS READING", profilesBlurb: "Up to three children, each with their own stars, pins, quiz answers and points. Pick who is reading.", tipProfiles: "Profiles",
  toy_cablecar: "Cable car", toy_sealion: "Sea lion", toy_goldengate: "Golden Gate", toy_bus: "Red bus", toy_raven: "Raven", toy_crown: "Crown", toy_churro: "Churro", toy_perez: "Ratoncito Pérez", toy_tooth: "Little tooth",
  parentAccount: "Parent account", parentAccountBlurb: "Sign in to keep every child's reading on every device", openAccount: "Open",
  proMember: "Pro", proLifetime: "Pro member · Lifetime membership.", proYearly: "Pro member · Yearly membership until {date}.",
  readingNow: "Reading now", switchProfile: "Read as this child", editProfile: "Edit", addChild: "Add a child", maxProfiles: "Three children is as many as one shelf holds.",
  childName: "Name", namePlaceholder: "The child's name", birthday: "Birthday", favouriteHero: "Favourite hero (the avatar)", save: "Save", cancel: "Cancel", removeProfile: "Remove",
  confirmDelete: "Remove {name} and everything they have read? This cannot be undone.", yearsOld: "{n} years old", monthsOld: "{n} months old", noBirthday: "Birthday not set yet", unnamed: "New reader",
  nowReading: "Now reading as {name}", statPoints: "{n} points", statBooks: "{n} of {total} books finished", statStars: "{n} of {total} stars", statPins: "{n} of {total} pins", statQuiz: "{n} of {total} quiz answers", needName: "Give the child a name first",
  opening: "Opening {title}…", ready: "Ready",
  comingSoon: "Coming soon", finishedAgain: "Finished ★ Read it again", pagesCount: "{n} pages",
  languageIs: "Language: {name}",
  clickToCollect: "Click to collect", stillHiding: "Still hiding in the story", everyPinFound: "Every pin found",
  foundPin: "You found the {name}! +{points} points", allPins: "Every pin in this book is yours!",
  badgeEarned: "Badge earned: {badges}", finishedBook: "You finished the book! +{points} points",
  notInLanguage: "This book is not in that language yet, so it stays in English.",
  stillPainting: "“{title}” is still being painted. Soon!", wouldNotOpen: "That book would not open. Try again?",
  tapAnyWord: "Tap any word to hear it. Tap the pictures too.", magic: "Magic!",
  souvenirWord: "Souvenir word", tapToHearAgain: "tap to hear it again",
  loadPaper: "Pressing the pages…", loadTable: "Polishing the table…", loadWindows: "Lighting the windows…",
  loadBinding: "Stitching the binding…", loadTidy: "Tidying the table…", loadVoice: "Warming up the voice…",
  loadCover: "Binding the cover…", loadHero: "Waking up {name}…", loadMoves: "Teaching {name} to move…",
  loadPopups: "Folding the pop-ups…", loadToybox: "Opening the toy box…", loadClouds: "Fluffing the clouds…", theHero: "the hero",
  mySouvenirs: "My souvenirs", treasureHunt: "STORYCOMET · TREASURE HUNT",
  boardBlurb: "Five pins hide in every book. Tap one when you spot it to keep it.",
  points: "points", stars: "stars", starsRule: "A star for every page read to the end.", pinsFound: "pins found", quizAnswers: "quiz answers", retake: "You can always take the quiz again.",
  pointsRule: "Pins are worth {pin} points, every right quiz answer {quiz}, and finishing a book {finish}.",
  backToStory: "Back to the story", finished: "Finished", percentRead: "{percent}% read", notStarted: "Not started",
  pinsOf: "{found} of {total} pins", quizScore: "quiz {best}/{total}", openTitle: "Open {title}",
  badgeFirst: "First find", badgeTen: "Ten pins", badgeHalf: "Half the board", badgeCollector: "Collector",
  badgeBookworm: "Bookworm", badgeLibrarian: "Librarian", badgeQuiz: "Quiz star",
  youDidIt: "You did it!", questionOf: "Question {n} of {total}", everyStar: "Every star is yours!",
  starsOf: "{right} of {total} stars, and you learned the rest.", quizPoints: "+{points} points for your souvenirs", closeQuiz: "Close the quiz",
  settings: "Settings", settingsBlurb: "Choose who reads the story, how loud the music box plays, and how the pages turn.",
  theVoice: "The voice", narrator: "Narrator", openaiConnected: "OpenAI voice connected through the local server",
  openaiMissing: "OpenAI voice not configured on the server; the bundled narrator reads",
  automatic: "Automatic", openaiLive: "OpenAI live voice", bundledNarrator: "Bundled narrator (Willow)", browserVoice: "This browser's voice",
  openaiVoice: "OpenAI voice", browserVoiceShort: "Browser voice",
  theSounds: "The sounds", musicBox: "Music box", soundEffects: "Sound effects",
  thePages: "The pages", autoTurn: "Turn the page by itself", textSize: "Text size", normal: "Normal", large: "Large", calmMotion: "Calm motion",
  startOver: "Start over", phrasebook: "Phrasebook", language: "Language", more: "More", extraWords: "A few extra words",
  openaiUnavailable: "OpenAI voice unavailable, using the bundled narrator",
  noVoices: "This browser has no voices. Turn on the server or the bundled narration.",
  toy_owl: "Owl", toy_moon: "Sleepy moon", toy_house: "Little house", toy_kite: "Kite", toy_sheep: "Sheep", toy_tree: "Tree",
  toy_turtle: "Turtle", toy_jar: "Glowing jar", toy_boat: "Sailboat", toy_rocket: "Rocket", toy_rose: "Rose", toy_blocks: "Blocks",
  toy_snowglobe: "Snow globe", toy_matryoshka: "Matryoshka", toy_cat: "Cat", toy_crane: "Paper crane", toy_lantern: "Lantern",
  toy_naga: "Naga", toy_frog: "Frog", toy_elephant: "Elephant", toy_tuktuk: "Tuk-tuk", toy_merlion: "Merlion", toy_otter: "Otter",
  toy_bamboo: "Bamboo", toy_daruma: "Daruma", toy_fuji: "Mount Fuji", toy_eiffel: "Eiffel Tower", toy_croissant: "Croissant",
  toy_pigeon: "Pigeon", toy_redlantern: "Red lantern", toy_dragon: "Dragon", toy_drum: "Drum",
};

const zh = {
  switchBooks: "学习书籍", switchBooksAria: "切换到LearnComet学习书籍",
  eyebrow: "STORYCOMET 立体绘本",
  defaultBlurb: "会自己朗读的立体故事书，每个字都会发光，一碰就从书页里跳出来。",
  footnote: "打开声音更好玩 · 什么都可以摸一摸",
  pickBook: "选一本书",
  readToMe: "读给我听", pause: "暂停", keepReading: "继续读", readAgain: "再读一遍", illRead: "我自己读",
  openBook: "打开书", backToShelf: "回到书架", closeBook: "合上书", quizTime: "答题时间！",
  words: "词语", wordsOf: "{language}词语",
  tapWords: "点一点词语听发音 · 点一点卡片放大",
  tipBack: "上一页", tipNext: "下一页", tipLook: "看近一点", tipLanguage: "语言", tipSettings: "设置", tipSound: "声音",
  ariaPrev: "上一页", ariaNext: "下一页", ariaPrevBooks: "前几本书", ariaNextBooks: "后几本书",
  ariaClose: "合上书回到书架", ariaSound: "打开或关闭声音", ariaReadIn: "用哪种语言读",
  ariaHearAgain: "再听一遍", ariaPhrasebook: "词语本", ariaMode: "阅读方式", ariaQuiz: "故事小测验",
  pageOf: "第 {n} 页，共 {total} 页", lastPage: "最后一页", pageN: "第 {n} 页",
  pageStarsOf: "{n} / {total} 颗星", iReadIt: "我读完了！", starsToGo: "读完每一页才能完成这本书：还差 {n} 颗星",
  phrasebookBlurb: "{title} 里的所有纪念单词。点一个单词，听{language}的声音说出来；听过的会盖上印章。", native: "母语",
  wordsHeard: "已听 {count}/{total} 个单词", langName_en: "英语", langName_fr: "法语", langName_es: "西班牙语", langName_ja: "日语", langName_zh: "中文",
  profiles: "个人资料", profilesEyebrow: "谁在读", profilesBlurb: "最多三个孩子，每人有自己的星星、徽章、答题和积分。选一选谁在读。", tipProfiles: "个人资料",
  toy_cablecar: "缆车", toy_sealion: "海狮", toy_goldengate: "金门大桥", toy_bus: "红色巴士", toy_raven: "乌鸦", toy_crown: "王冠", toy_churro: "吉拿棒", toy_perez: "佩雷斯小老鼠", toy_tooth: "小牙齿",
  parentAccount: "家长账户", parentAccountBlurb: "登录后，每个孩子的阅读记录会同步到所有设备", openAccount: "打开",
  proMember: "Pro", proLifetime: "Pro 会员 · 终身会员。", proYearly: "Pro 会员 · 年度会员，有效期至 {date}。",
  readingNow: "正在读", switchProfile: "用这个孩子读", editProfile: "编辑", addChild: "添加孩子", maxProfiles: "一个书架最多放三个孩子。",
  childName: "名字", namePlaceholder: "孩子的名字", birthday: "生日", favouriteHero: "最喜欢的主角（头像）", save: "保存", cancel: "取消", removeProfile: "删除",
  confirmDelete: "删除 {name} 和读过的所有记录？无法恢复。", yearsOld: "{n} 岁", monthsOld: "{n} 个月", noBirthday: "还没填生日", unnamed: "新读者",
  nowReading: "现在由 {name} 来读", statPoints: "{n} 分", statBooks: "读完 {n}/{total} 本书", statStars: "{n}/{total} 颗星", statPins: "{n}/{total} 个徽章", statQuiz: "答对 {n}/{total} 题", needName: "先给孩子起个名字",
  opening: "正在打开《{title}》…", ready: "准备好了",
  comingSoon: "即将推出", finishedAgain: "读完了 ★ 再读一遍", pagesCount: "{n} 页",
  languageIs: "语言：{name}",
  clickToCollect: "点一下收集", stillHiding: "还藏在故事里", everyPinFound: "徽章全部找到了",
  foundPin: "你找到了{name}！+{points} 分", allPins: "这本书的徽章都是你的了！",
  badgeEarned: "获得奖章：{badges}", finishedBook: "你读完了这本书！+{points} 分",
  notInLanguage: "这本书还没有这种语言的版本，暂时用英语。",
  stillPainting: "《{title}》还在画呢，快好了！", wouldNotOpen: "这本书打不开，再试一次？",
  tapAnyWord: "点任何一个词都能听到读音，图画也可以点。", magic: "魔法！",
  souvenirWord: "纪念词", tapToHearAgain: "点一下再听一遍",
  loadPaper: "正在压平书页…", loadTable: "正在擦亮桌子…", loadWindows: "正在点亮窗户…",
  loadBinding: "正在缝书脊…", loadTidy: "正在收拾桌子…", loadVoice: "正在热嗓子…",
  loadCover: "正在装封面…", loadHero: "正在叫醒{name}…", loadMoves: "正在教{name}动起来…",
  loadPopups: "正在折立体页…", loadToybox: "正在打开玩具箱…", loadClouds: "正在把云朵弄蓬松…", theHero: "主人公",
  mySouvenirs: "我的纪念品", treasureHunt: "STORYCOMET · 寻宝",
  boardBlurb: "每本书里都藏着五枚徽章。看到就点一下，收进来。",
  points: "分", stars: "星星", starsRule: "每读完一页得一颗星。", pinsFound: "找到的徽章", quizAnswers: "答对的题", retake: "你随时可以再做一次测验。",
  pointsRule: "每枚徽章 {pin} 分，答对一题 {quiz} 分，读完一本书 {finish} 分。",
  backToStory: "回到故事", finished: "读完了", percentRead: "读了 {percent}%", notStarted: "还没开始",
  pinsOf: "{total} 枚中找到 {found} 枚", quizScore: "答题 {best}/{total}", openTitle: "打开《{title}》",
  badgeFirst: "第一次发现", badgeTen: "十枚徽章", badgeHalf: "半个板子", badgeCollector: "收藏家",
  badgeBookworm: "小书虫", badgeLibrarian: "图书管理员", badgeQuiz: "答题之星",
  youDidIt: "你做到了！", questionOf: "第 {n} 题，共 {total} 题", everyStar: "星星全是你的！",
  starsOf: "{total} 颗星里得到 {right} 颗，其余的也学会了。", quizPoints: "纪念品 +{points} 分", closeQuiz: "关闭测验",
  settings: "设置", settingsBlurb: "选择谁来读故事、音乐盒有多响，以及怎样翻页。",
  theVoice: "声音", narrator: "朗读者", openaiConnected: "已通过本地服务器连接 OpenAI 语音",
  openaiMissing: "服务器没有配置 OpenAI 语音，由内置朗读者来读",
  automatic: "自动", openaiLive: "OpenAI 实时语音", bundledNarrator: "内置朗读者（Willow）", browserVoice: "这个浏览器的声音",
  openaiVoice: "OpenAI 语音", browserVoiceShort: "浏览器语音",
  theSounds: "音效", musicBox: "音乐盒", soundEffects: "声音效果",
  thePages: "书页", autoTurn: "自动翻页", textSize: "文字大小", normal: "普通", large: "大", calmMotion: "轻柔动画",
  startOver: "重新开始", phrasebook: "词语本", language: "语言", more: "更多", extraWords: "再多几个词",
  openaiUnavailable: "OpenAI 语音暂时不可用，由内置朗读者来读",
  noVoices: "这个浏览器没有语音。请打开服务器或内置朗读。",
  toy_owl: "猫头鹰", toy_moon: "睡着的月亮", toy_house: "小房子", toy_kite: "风筝", toy_sheep: "小羊", toy_tree: "大树",
  toy_turtle: "小海龟", toy_jar: "发光的罐子", toy_boat: "帆船", toy_rocket: "火箭", toy_rose: "玫瑰", toy_blocks: "积木",
  toy_snowglobe: "雪花球", toy_matryoshka: "套娃", toy_cat: "小猫", toy_crane: "纸鹤", toy_lantern: "灯笼",
  toy_naga: "那伽", toy_frog: "青蛙", toy_elephant: "大象", toy_tuktuk: "嘟嘟车", toy_merlion: "鱼尾狮", toy_otter: "水獭",
  toy_bamboo: "竹子", toy_daruma: "达摩", toy_fuji: "富士山", toy_eiffel: "埃菲尔铁塔", toy_croissant: "牛角包",
  toy_pigeon: "鸽子", toy_redlantern: "红灯笼", toy_dragon: "龙", toy_drum: "鼓",
};

export const STRINGS = { en, zh };
let current = "en";

export function currentLanguage() { return current; }

/** Switch the interface language (books switch their own text through applyLanguage in main.js). */
export function setLanguage(code) {
  current = STRINGS[code] ? code : "en";
  document.documentElement.lang = current;
  applyStatic();
}

/** A string in the current language, English when the translation is missing, with {name} fills. */
export function t(key, params = {}) {
  const table = STRINGS[current] || en;
  const s = table[key] ?? en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (params[k] == null ? "" : String(params[k])));
}

/** Fill every element that names its string: data-i18n (text), -tip, -aria, -title. */
export function applyStatic(root = document) {
  for (const el of root.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll("[data-i18n-tip]")) el.dataset.tip = t(el.dataset.i18nTip);
  for (const el of root.querySelectorAll("[data-i18n-aria]")) el.setAttribute("aria-label", t(el.dataset.i18nAria));
  for (const el of root.querySelectorAll("[data-i18n-title]")) el.title = t(el.dataset.i18nTitle);
}
