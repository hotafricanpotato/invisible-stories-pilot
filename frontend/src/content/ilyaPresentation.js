// Approved WebP originals; sizes match the supplied MANIFEST.csv.
const artwork = (file, width, height, label) => ({src: `/assets/ilya/${file}.webp`, width, height, label});
export default {
  theme: "ilya",
  archiveLabel: "ИСТОРИЯ 03 / У НАС ТАК ПРИНЯТО",
  conclusionLabel: "ИСТОРИЯ 03 / ОБЪЯСНЕНИЕ",
  materialsCharacterName: "Ильи",
  closing: {label: "Послесловие", endLabel: "Конец истории Ильи"},
  mapTitle: "Что осталось невидимым?",
  mapIntroduction: "Выберите наиболее обоснованный ответ в каждом из трёх эпизодов.",
  materialNumbering: true,
  materialCompletion: "read",
  selection: {tag: "ДЕЛО 03 / ИЛЬЯ, 16 ЛЕТ", description: "У нас так принято"},
  artwork: {
    introduction: artwork("ilya-introduction", 1672, 941, "Илья собирается выходить, отец предлагает деньги на такси"),
    "last-game": artwork("ilya-last-game", 1672, 941, "Илья и Кирилл играют в приставку"),
    "home-conversation": artwork("ilya-home-conversation", 1671, 941, "Илья возвращается домой поздно вечером"),
    breakfast: artwork("ilya-breakfast", 1671, 941, "Обычный семейный завтрак: отец готовит, Илья входит на кухню"),
  },
  materialArtwork: {
    "family-feast": artwork("ilya-family-feast", 1670, 941, "Семейное застолье на дне рождения дедушки"),
    "mother-chat": artwork("ilya-mother-chat", 1670, 942, "Илья с телефоном поздним вечером"),
    "kirill-conversation": artwork("ilya-kirill-conversation", 1448, 1086, "Илья и Кирилл разговаривают на школьной перемене"),
  },
};
