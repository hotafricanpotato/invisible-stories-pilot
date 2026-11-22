// Scenario text belongs exclusively to liza.json. Missing artwork is explicit.
const placeholder = label => ({ placeholder: true, label });
export default {
  theme: "liza",
  archiveLabel: "ИСТОРИЯ 01 / ХОРОШАЯ ДЕВОЧКА",
  conclusionLabel: "ИСТОРИЯ 01 / ОБЪЯСНЕНИЕ",
  materialsCharacterName: "Лизы",
  mapTitle: "Что осталось невидимым?",
  mapIntroduction: "Выберите наиболее обоснованный ответ в каждом из трёх эпизодов.",
  selection: {
    tag: "ДЕЛО 01 / ЛИЗА, 15 ЛЕТ",
    description: "Хорошая девочка",
    startLabel: "Начать историю Лизы →",
    continueLabel: "Продолжить историю Лизы →",
  },
  artwork: {
    introduction: placeholder("Лиза с телефоном перед выступлением"),
    "after-performance": placeholder("Лиза и мама с цветами после выступления"),
    "other-plans": placeholder("Разговор Лизы и мамы на кухне о фотокружке"),
    "everything-fine": placeholder("Вечерний разговор Лизы с мамой"),
    "last-scene": placeholder("Лиза закрывает страницу фотокружка и собирает вещи на тренировку"),
  },
};
