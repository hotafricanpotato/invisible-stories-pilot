import legacy from "./statistics.json" with { type: "json" };
// Approved data: legacy sources plus the three confirmations supplied by the user.
// Publication dates and survey periods are intentionally separate.
export const statisticsRecords = {
  recognition: {
    id: "recognition", values: legacy.values, geography: "Россия", sampleSize: 1600,
    population: "взрослые жители России", publicationYear: 2024, dataPeriod: null,
    source: {label: "РНФ, проект СПбГУ — результаты за 2024 год", url: legacy.sources.russia},
    limitation: "Это показатели распознавания: они показывают, насколько часто люди считают определённые формы поведения насилием, а не то, как часто оно встречается на самом деле.",
  },
  global: {
    id: "global", countLabel: "Около 400 миллионов", ratioLabel: "6 из 10", numerator: 6, denominator: 10,
    geography: "Весь мир", age: "младше пяти лет", publicationDate: "2024-06-11", dataPeriod: null,
    description: legacy.data[0][3],
    limitation: "«Около 400 млн» и «6 из 10» — два представления одной оценки UNICEF. Показатель объединяет психологическую агрессию и/или физические наказания; это не две независимые оценки.",
    source: {label: "UNICEF, 11 июня 2024 года", url: legacy.sources.global},
  },
  regional: {
    id: "regional", min: 40, max: 69, geography: "Европа и Центральная Азия", publicationYear: 2025, dataPeriod: null,
    description: legacy.data[1][3], limitation: legacy.data[1][4],
    source: {label: "UNICEF — Where we live and learn, 2025", url: legacy.sources.eca},
  },
  neglect: {
    id: "neglect", value: 35.7, affected: 81, sampleSize: 227, age: "11–18 лет", geography: "Нижегородская область",
    publicationYear: 2016, dataPeriod: null,
    description: "Психологическое пренебрежение зафиксировано у 81 ребёнка — 35,7% исследованной выборки.",
    limitation: "Это данные исследования 227 детей 11–18 лет из Нижегородской области, а не оценка всех детей России.",
    source: {label: "Волкова Е. Н., Волкова И. В., Исаева О. М. — «Оценка распространённости насилия над детьми», 2016", url: "https://psyjournals.ru/journals/sps/archive/2016_n2/volkova"},
  },
  alcohol: {
    id: "alcohol", countLabel: "Более 12 миллионов", qualifier: "moreThan", geography: "США", age: "младше 18 лет",
    publicationYear: 2025, dataPeriod: "2023", dataset: "NSDUH",
    description: "детей младше 18 лет в США живут с родителем с алкогольным расстройством.",
    limitation: "Это не означает автоматически, что ребёнок пережил насилие. Наличие алкогольного расстройства у родителя само по себе не устанавливает факт насилия над ребёнком.",
    source: {label: "McCabe S. E., McCabe V. V., Schepis T. S. — JAMA Pediatrics, 2025", url: "https://jamanetwork.com/journals/jamapediatrics/fullarticle/2833575"},
    explanationSource: {label: "Официальное объяснение NIH", url: "https://www.nih.gov/news-events/nih-research-matters/millions-us-kids-live-parents-substance-use-disorders"},
  },
};
export const statisticsMethodology = legacy.limits[3].text.replace(/^Что остаётся невидимым\?/, "");
