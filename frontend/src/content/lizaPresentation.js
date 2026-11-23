// Approved artwork archive; scenario text remains exclusively in liza.json.
const artwork = (file, width, height, label, layout) => ({
  src: `/assets/liza/${file}.webp`, width, height, label, ...(layout ? { layout } : {}),
});
export default {
  theme: "liza",
  archiveLabel: "ИСТОРИЯ 01 / ХОРОШАЯ ДЕВОЧКА",
  conclusionLabel: "ИСТОРИЯ 01 / ОБЪЯСНЕНИЕ",
  materialsCharacterName: "Лизы",
  mapTitle: "Что осталось невидимым?",
  mapIntroduction: "Выберите наиболее обоснованный ответ в каждом из трёх эпизодов.",
  selection: {
    tag: "ДЕЛО 01 / ЛИЗА, 15 ЛЕТ",
    cover: "/assets/liza/liza-introduction.webp",
    alt: "Лиза с телефоном за письменным столом",
    imageClassName: "liza-cover",
    description: "Хорошая девочка",
    startLabel: "Начать историю Лизы →",
    continueLabel: "Продолжить историю Лизы →",
  },
  materialArtwork: {
    "family-album": {
      "2019": artwork("liza-album-2019", 1536, 1024, "Первое выступление Лизы"),
      "2024": artwork("liza-album-2024", 1536, 1024, "Лиза и мама за кулисами конкурса"),
    },
  },
  artwork: {
    introduction: artwork("liza-introduction", 1199, 1312, "Лиза с телефоном перед выступлением", "portrait"),
    "after-performance": artwork("liza-after-performance", 1672, 941, "Лиза и мама с цветами после выступления"),
    "other-plans": artwork("liza-other-plans", 1672, 941, "Разговор Лизы и мамы на кухне о фотокружке"),
    "everything-fine": artwork("liza-everything-fine", 1672, 941, "Вечерний разговор Лизы с мамой"),
    "last-scene": artwork("liza-last-scene", 1671, 941, "Лиза закрывает страницу фотокружка и собирает вещи на тренировку"),
  },
};
