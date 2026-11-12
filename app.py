import streamlit as st
from visual_assets import data_uri
from invisible_statistics import render_invisible_statistics
from stories import STORIES
from quiz import initialize_quiz, render_initial_quiz, render_quiz_transition
from nikita_story import NIKITA_STORY
from story_engine import (
    render_monologue,
    render_messages,
    render_dialogue,
    render_story_materials,
    render_invisible_map,
)

# True — выставка без панели Streamlit; False — разработка с панелью
EXHIBITION_MODE = False

st.set_page_config(page_title="Невидимые истории", page_icon="◌", layout="wide", initial_sidebar_state="expanded")

st.markdown("""
<style>
/* Единый визуальный язык выставки */
.stApp {
    background: #0b0e12;
    color: #f2eee9;
}
[data-testid="stSidebar"] {
    background: #151a20;
    border-right: 1px solid #303640;
}
[data-testid="stSidebar"] .stButton button {
    background: #20262e;
    border: 1px solid #3d4550;
    color: #f2eee9;
}
[data-testid="stSidebar"] .stButton button:hover {
    border-color: #d19a7d;
    color: #ffffff;
}
h1, h2, h3 { letter-spacing: -0.035em; }
div.stButton > button { border-radius: 10px; }
div.stButton > button[kind="primary"] {
    background: #c55b4d;
    border: 1px solid #c55b4d;
    color: white;
}
div.stButton > button[kind="primary"]:hover {
    background: #dd6b5c;
    border-color: #dd6b5c;
}
/* Стили художественной заставки */
.hero {
    position: relative;
    overflow: hidden;
    min-height: 420px;
    padding: clamp(26px, 5vw, 72px);
    border: 1px solid #38414a;
    border-radius: 18px;
    background:
      radial-gradient(ellipse 48% 75% at 84% 23%, rgba(180,91,74,.22), transparent 75%),
      radial-gradient(ellipse 60% 60% at 18% 85%, rgba(80,96,122,.15), transparent 80%),
      linear-gradient(135deg, #1d232b, #0b0e12 70%);
    margin-bottom: 20px;
}
.hero-tag {
    color: #d8ae98;
    font-size: 12px;
    letter-spacing: .16em;
    font-weight: 700;
    margin-bottom: 42px;
}
.hero-title {
    color: #f7f3ec;
    font-weight: 800;
    font-size: clamp(50px, 7vw, 104px);
    letter-spacing: -.065em;
    line-height: .98;
    margin: 0 0 26px;
}
.hero-title span { color: #d78b76; }
.hero-lead {
    max-width: 640px;
    font-size: clamp(18px, 2.1vw, 25px);
    line-height: 1.35;
    color: #ebe4dc;
    margin: 0 0 22px;
}
.hero-detail {
    max-width: 580px;
    font-size: 15px;
    line-height: 1.7;
    color: #aab1ba;
}
.section-tag {
    color: #d8ae98;
    letter-spacing: .13em;
    font-size: 12px;
    font-weight: 700;
    margin-top: 34px;
}
.exhibit-card {
    min-height: 150px;
    background: #171d24;
    border: 1px solid #303a44;
    border-radius: 14px;
    padding: 24px 22px;
    margin-bottom: 16px;
}
.exhibit-number {
    color: #d78b76;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .1em;
}
.exhibit-card h3 {
    color: #f2eee9;
    font-size: 22px;
    margin: 12px 0;
}
.exhibit-card p {
    font-size: 14px;
    line-height: 1.6;
    color: #aab1ba;
    margin: 0;
}
.small-note { color: #aab1ba; font-size: .9rem; }

/* Архивная обложка: выразительные слои только на главной странице. */
.hero { isolation:isolate; min-height: 470px; padding-right: min(45%, 455px); }
.hero > :not(.hero-art) { position: relative; z-index: 2; }
.hero-art { position:absolute; right:0; top:0; bottom:0; width:46%; z-index:0; overflow:hidden; }
.hero-art img { width:100%; height:100%; object-fit:cover; object-position:center 38%; filter:saturate(.68) contrast(1.05); }
.hero-art:before { content:""; position:absolute; inset:0; z-index:1; background:linear-gradient(90deg,#171d24 0%,rgba(14,17,22,.25) 32%,rgba(14,17,22,.05) 70%); }
.hero-art:after { content:""; position:absolute; inset:13px; z-index:1; border:1px solid rgba(242,238,233,.19); pointer-events:none; }
.hero-title { font-size:clamp(42px,5.9vw,82px); overflow-wrap:normal; }
.hero-detail { color:#c5c0ba; }
.archive-choice { position:relative; padding:18px; background:#171d24; border:1px solid #41464a; border-radius:14px; margin:18px 0 14px; display:flex; align-items:center; gap:24px; }
.archive-choice img { width:160px; height:152px; object-fit:cover; border:7px solid #d4c6ad; box-shadow:3px 8px 20px rgba(0,0,0,.38); transform:rotate(-2deg); }
.archive-choice-tag { color:#d8ae98; font-size:12px; letter-spacing:.12em; font-weight:700; }
.archive-choice h3 { font-size:27px; margin:11px 0 8px; color:#f2eee9; }
.archive-choice p { color:#c8cbd0; font-size:16px; line-height:1.5; }
@media(max-width:760px) {
 .hero { padding-right:clamp(24px,6vw,50px); padding-top:230px; }
 .hero-art { bottom:auto; height:218px; width:100%; }
 .hero-art:before { background:linear-gradient(0deg,#171d24 0%,rgba(14,17,22,.0) 65%); }
 .hero-title { font-size:clamp(40px,10vw,64px); }
 .archive-choice { gap:12px; }
 .archive-choice img { width:110px; height:115px; }
 .archive-choice h3 { font-size:19px; }
}

/* ===== ТИПОГРАФИКА ТЕСТИРОВАНИЯ ===== */

/* Главный заголовок */
.stApp h1 {
    font-size: 38px;
    line-height: 1.2;
    font-weight: 750;
    margin-bottom: 24px;
}

/* Подзаголовки и названия ситуаций */
.stApp h2 {
    font-size: 28px;
    line-height: 1.3;
    font-weight: 700;
    margin-top: 28px;
    margin-bottom: 18px;
}

/* Основной текст */
.stApp [data-testid="stMarkdownContainer"] p {
    font-size: 20px;
    line-height: 1.7;
    margin-bottom: 14px;
}

/* Подписи и индикаторы */
.stApp [data-testid="stCaptionContainer"] p {
    font-size: 14px;
    line-height: 1.5;
    color: #aab1ba;
}

/* Варианты ответов */
.stApp [data-testid="stRadio"] label p {
    font-size: 18px;
    line-height: 1.55;
}

/* Расстояние между вариантами */
.stApp [data-testid="stRadio"] [role="radiogroup"] {
    gap: 12px;
}

/* Подписи внутри радиокнопок */
.stApp [data-testid="stRadio"] label {
    padding-top: 5px;
    padding-bottom: 5px;
}

/* Кнопки */
.stApp div.stButton > button {
    min-height: 48px;
    font-size: 16px;
    font-weight: 600;
}
</style>
""", unsafe_allow_html=True)

# В режиме выставки прячем только служебную панель, не меняя дизайн теста.
if EXHIBITION_MODE:
    st.markdown("""
    <style>
    [data-testid="stHeader"] {
        display: none !important;
    }
    [data-testid="stMainBlockContainer"] {
        padding-top: 2rem !important;
    }
    </style>
    """, unsafe_allow_html=True)

initialize_quiz()

if "page" not in st.session_state:
    st.session_state.page = "Главная"
if "story" not in st.session_state:
    st.session_state.story = "История 1"
if "scene" not in st.session_state:
    st.session_state.scene = 0
if "reveal" not in st.session_state:
    st.session_state.reveal = False


def go(page):
    st.session_state.page = page


def open_story(name):
    st.session_state.story = name
    st.session_state.scene = 0
    st.session_state.reveal = False
    go("История")


with st.sidebar:
    st.caption("НЕВИДИМЫЕ ИСТОРИИ · ПИЛОТНАЯ ВЕРСИЯ")
    st.button("Главная", use_container_width=True, on_click=go, args=("Главная",))
    if st.session_state.initial_quiz_completed:
        st.button("Выбрать историю", use_container_width=True, on_click=go, args=("Выбор",))
    if st.session_state.initial_quiz_completed:
        st.button("Невидимая статистика", use_container_width=True, on_click=go, args=("Статистика",))
    if st.session_state.initial_quiz_completed:
        st.button("О тестовой версии", use_container_width=True, on_click=go, args=("Заключение",))

page = st.session_state.page
if not st.session_state.initial_quiz_completed and page not in ("Главная", "Тест"):
    page = "Тест"
    st.session_state.page = page

if page == "Главная":
    cover_src = data_uri("assets/nikita/cover.jpg")
    st.markdown(f"""
    <section class="hero">
        <div class="hero-art"><img src="{cover_src}" alt="Архивный художественный коллаж о повседневной жизни подростка"></div>
        <div class="hero-tag">ИНТЕРАКТИВНАЯ ВЫСТАВКА / 2026</div>
        <h1 class="hero-title">НЕВИДИМЫЕ<br><span>ИСТОРИИ.</span></h1>
        <p class="hero-lead">Не всё, что происходит в семье, видно со стороны.</p>
        <p class="hero-detail">
            За привычными словами и обычными семейными фотографиями могут
            скрываться переживания, о которых никто не спрашивает.
            Три истории. Несколько точек зрения. То, что легко не заметить.
        </p>
    </section>
    """, unsafe_allow_html=True)

    with st.container():
        col1, col2 = st.columns([1, 2])

        with col1:
            st.button(
                "Начать выставку →",
                type="primary",
                on_click=go,
                args=("Тест",),
                use_container_width=True
            )
    st.markdown('<div class="section-tag">КАК УСТРОЕНА ВЫСТАВКА</div>', unsafe_allow_html=True)
    st.subheader("Сначала — история. Затем — то, что скрыто.")

    first, second, third = st.columns(3, gap="medium")
    with first:
        st.markdown("""
        <div class="exhibit-card">
            <div class="exhibit-number">01 / УСЛЫШАТЬ</div>
            <h3>Три истории</h3>
            <p>Познакомьтесь с героями и взгляните на их повседневную жизнь.</p>
        </div>
        """, unsafe_allow_html=True)
    with second:
        st.markdown("""
        <div class="exhibit-card">
            <div class="exhibit-number">02 / ЗАМЕТИТЬ</div>
            <h3>Скрытые детали</h3>
            <p>Откройте обстоятельства, которые не видны при первом знакомстве.</p>
        </div>
        """, unsafe_allow_html=True)
    with third:
        st.markdown("""
        <div class="exhibit-card">
            <div class="exhibit-number">03 / ОСМЫСЛИТЬ</div>
            <h3>Данные и контекст</h3>
            <p>Сопоставьте личные истории с проверенными социальными данными.</p>
        </div>
        """, unsafe_allow_html=True)

    st.info("Пилотная версия: сейчас доступна одна законченная история и общий раздел статистики. Остальные истории и итоговое тестирование ещё разрабатываются. Тема может быть эмоционально непростой — прохождение можно прекратить в любой момент.")

elif page == "Тест":
    render_initial_quiz()

elif page == "После теста":
    render_quiz_transition(go)

elif page == "Никита":
    # Стили подключаются только при открытии истории Никиты.
    st.markdown("""
    <style>
    /* Только экран истории Никиты; входной тест не меняем. */
    [data-testid="stMainBlockContainer"] {
        max-width: 960px !important;
        padding-left: 30px !important;
        padding-right: 30px !important;
        padding-bottom: 64px !important;
    }
    [data-testid="stMainBlockContainer"] h1 {
        font-size: clamp(30px, 4vw, 44px);
        line-height: 1.15;
        letter-spacing: -0.04em;
    }
    [data-testid="stMainBlockContainer"] h2 {
        font-size: clamp(22px, 3vw, 28px);
        line-height: 1.25;
    }
    .nikita-thought {
        background: linear-gradient(135deg, #202731, #171c23);
        border-left: 3px solid #c55b4d;
        border-radius: 0 12px 12px 0;
        padding: 26px 30px;
        margin: 22px 0;
        box-shadow: 0 8px 35px rgba(0,0,0,.08);
    }
    .nikita-thought-label,
    .nikita-phone-tag,
    .nikita-note-label,
    .nikita-voice-title,
    .nikita-voice-transcript-label,
    .nikita-map-choice span,
    .nikita-map-explanation span {
        color: #d8ae98;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .13em;
        margin-bottom: 12px;
    }
    .nikita-thought-text p {
        color: #f2eee9;
        font-size: 19px;
        line-height: 1.75;
        font-style: italic;
        margin: 0 0 16px;
        overflow-wrap: anywhere;
    }
    .nikita-thought-text p:last-child { margin-bottom: 0; }
    .nikita-narration {
        margin: 21px 0;
        padding: 12px 17px;
        border-left: 2px solid #66717f;
        color: #c0c8d1;
        font-size: 17px;
        line-height: 1.6;
    }
    .nikita-phone-tag { margin-top: 20px; }
    .nikita-phone-head {
        border-bottom: 1px solid #38434e;
        color: #e7e3dd;
        font-size: 15px;
        padding: 8px 0 15px;
        margin-bottom: 18px;
    }
    .nikita-chat-row { display: flex; margin: 12px 0; min-width: 0; }
    .nikita-chat-row.mine { justify-content: flex-end; }
    .nikita-chat-row.other { justify-content: flex-start; }
    .nikita-bubble {
        max-width: min(78%, 560px);
        border-radius: 14px 14px 14px 4px;
        padding: 12px 17px;
        background: #26313d;
        border: 1px solid #3c4a58;
        box-shadow: 0 2px 6px rgba(0,0,0,.1);
        min-width: 0;
    }
    .nikita-chat-row.mine .nikita-bubble {
        background: #633c36;
        border-color: #885147;
        border-radius: 14px 14px 4px 14px;
    }
    .nikita-bubble-sender {
        color: #e4b5a1;
        font-weight: 700;
        font-size: 13px;
        margin-bottom: 3px;
    }
    .nikita-bubble-text {
        color: #f3efea;
        font-size: 17px;
        line-height: 1.5;
        overflow-wrap: anywhere;
    }
    .nikita-bubble-time { display: block; margin-top: 6px; text-align: right; color: #d4c8c4; font-size: 11px; }
    .nikita-note {
        background: #222a32;
        border: 1px solid #4b535b;
        border-radius: 15px;
        padding: 25px 28px;
        margin: 18px 0;
    }
    .nikita-note-row {
        color: #f4f0e9;
        padding: 11px 0;
        border-bottom: 1px solid #39434c;
        line-height: 1.5;
        font-size: 17px;
        display: flex;
        gap: 10px;
    }
    .nikita-note-box { color: #d8ae98; font-size: 22px; line-height: 1; flex-shrink: 0; }
    .nikita-note-warning {
        color: #f4c4b9;
        background: rgba(197,91,77,.13);
        border-left: 3px solid #c55b4d;
        border-radius: 0 7px 7px 0;
        padding: 13px 15px;
        font-weight: 700;
        letter-spacing: .025em;
        margin-top: 18px;
        overflow-wrap: anywhere;
    }
    .nikita-voice {
        border: 1px solid #3e4751;
        border-radius: 15px;
        background: linear-gradient(160deg, #252d37, #171d25);
        padding: 24px 26px;
        margin: 18px 0;
    }
    .nikita-wave-row { display: flex; align-items: center; gap: 20px; margin: 17px 0 24px; }
    .nikita-fake-play {
        display: grid; place-items: center;
        width: 43px; height: 43px;
        border-radius: 50%; background: #604039;
        color: #f8eee9; flex-shrink: 0;
        font-size: 16px;
    }
    .nikita-waveform { display: flex; gap: 5px; align-items: center; height: 42px; overflow: hidden; }
    .nikita-waveform i { width: 4px; min-width: 4px; border-radius: 4px; background: #d69a84; opacity: .85; }
    .nikita-voice p { color: #f2eee9; line-height: 1.65; font-size: 17px; margin: 0 0 15px; }
    .nikita-voice-deleted { color: #e9a99d; font-size: 13px; font-weight: 600; }
    .nikita-map-choice, .nikita-map-explanation {
        border-radius: 10px; padding: 18px 20px; margin-top: 16px;
        background: #202832; border: 1px solid #3b4855;
    }
    .nikita-map-explanation { border-left: 3px solid #c55b4d; }
    .nikita-map-choice p, .nikita-map-explanation p {
        color: #f2eee9; line-height: 1.55; font-size: 16px; margin: 10px 0 0;
        overflow-wrap: anywhere;
    }
    .nikita-factor-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin: 22px 0 28px;
    }
    .nikita-factor-card {
        padding: 23px 24px;
        background: #171d24;
        border: 1px solid #3a454e;
        border-radius: 13px;
        display: flex;
        flex-direction: column;
        min-width: 0;
        height: 100%;
    }
    .nikita-factor-number { font-size: 11px; color: #d8ae98; letter-spacing: .12em; font-weight: 700; }
    .nikita-factor-card h3 { font-size: 21px; line-height: 1.3; color: #f5f0e8; margin: 14px 0 12px; }
    .nikita-factor-card p { font-size: 16px; line-height: 1.65; color: #c7cbd0; margin: 0; overflow-wrap: anywhere; }
    .nikita-ending {
        background: linear-gradient(140deg, #242b33, #181d24);
        border-left: 3px solid #c55b4d;
        padding: 26px 28px;
        border-radius: 0 13px 13px 0;
        margin: 22px 0;
    }
    .nikita-ending p { line-height: 1.75; font-size: 18px; color: #f2eee9; margin: 0 0 15px; }
    .nikita-ending p:last-child { margin-bottom: 0; }
    .nikita-ending-strong { color: #eab7a4 !important; font-weight: 750; }
    @media (max-width: 640px) {
        [data-testid="stMainBlockContainer"] {
            padding-left: 16px !important;
            padding-right: 16px !important;
            padding-bottom: 35px !important;
        }
        .nikita-thought, .nikita-note, .nikita-voice, .nikita-ending { padding: 19px; }
        .nikita-thought-text p, .nikita-bubble-text { font-size: 16px; }
        .nikita-bubble { max-width: 88%; }
        .nikita-factor-grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
        .nikita-factor-card { padding: 20px; }
        .nikita-waveform { gap: 4px; }
    }

     /* Архивные фотографии: как найденные фрагменты личного альбома. */
     .archive-scene { margin:22px 0 28px; padding:15px 15px 12px; background:#d0c2ac; border-radius:3px; transform:rotate(-.35deg); box-shadow:0 12px 32px rgba(0,0,0,.28); }
     .archive-scene-inner { position:relative; width:100%; height:clamp(190px,32vw,310px); overflow:hidden; background:#272727; }
     .archive-scene-inner img { width:100%; height:100%; display:block; object-fit:cover; object-position:center; filter:saturate(.66) contrast(1.08); }
     .archive-scene:before { content:""; position:absolute; top:-8px; left:45%; width:95px; height:20px; background:rgba(185,147,118,.57); transform:rotate(3deg); z-index:2; }
     .archive-scene figcaption { display:flex; justify-content:space-between; gap:12px; font-size:11px; letter-spacing:.08em; color:#36312d; padding:12px 2px 1px; text-transform:uppercase; }
     /* Переписка с Димой: небольшое фото слева, компактный мессенджер справа. */
     .nikita-messages-layout {
         display:grid;
         grid-template-columns:minmax(0, 0.88fr) minmax(0, 1.12fr);
         gap:22px;
         align-items:start;
         margin:24px 0 20px;
     }
     .nikita-messages-photo {
         position:relative;
         min-width:0;
         margin:7px 0 0;
         padding:10px 10px 8px;
         background:#d0c2ac;
         box-shadow:0 10px 28px rgba(0,0,0,.28);
         transform:rotate(-1deg);
     }
     .nikita-messages-photo img {
         display:block;
         width:100%;
         height:clamp(235px, 27vw, 340px);
         object-fit:cover;
         object-position:center;
         filter:saturate(.66) contrast(1.08);
     }
     .nikita-photo-tape {
         position:absolute;
         top:-9px;
         left:41%;
         width:80px;
         height:18px;
         background:rgba(185,147,118,.65);
         transform:rotate(3deg);
         z-index:1;
     }
     .nikita-messages-photo figcaption {
         margin:10px 2px 1px;
         color:#403b35;
         font-size:10px;
         letter-spacing:.1em;
     }
     .nikita-messages-panel {
         min-width:0;
         padding:18px 18px 20px;
         background:#1b222b;
         border:1px solid #394550;
         border-radius:13px;
     }
     .nikita-messages-panel .nikita-phone-tag {
         margin:0 0 8px;
     }
     .nikita-messages-panel-title {
         color:#f0ebe5;
         font-size:17px;
         line-height:1.4;
         padding:0 0 12px;
         border-bottom:1px solid #394550;
         margin-bottom:16px;
     }
     .nikita-messages-panel .nikita-chat-row { margin:12px 0; }
     .nikita-messages-panel .nikita-bubble {
         max-width:92%;
         padding:11px 13px;
     }
     .nikita-messages-panel .nikita-bubble-text {
         font-size:16px;
         line-height:1.45;
     }
     @media(max-width:740px) {
         .nikita-messages-layout {
             grid-template-columns:minmax(0,1fr);
             gap:18px;
             margin-top:18px;
         }
         .nikita-messages-photo {
             margin:4px auto 0;
             width:min(100%,490px);
         }
         .nikita-messages-photo img { height:clamp(180px,42vw,260px); }
         .nikita-messages-panel { padding:15px 13px; }
         .nikita-messages-panel .nikita-bubble { max-width:88%; }
     }
     /* Коллажи — только вокруг содержания, не под текстом и ответами. */
     .nikita-thought { position:relative; background:linear-gradient(130deg,#202832,#171d25); }
     .nikita-thought:after { content:""; position:absolute; width:57px; height:12px; top:-5px; right:34px; background:rgba(169,132,108,.34); transform:rotate(4deg); }
     .nikita-note { box-shadow:inset 0 0 0 7px rgba(194,181,161,.04); }
     .nikita-voice { border-style:dashed; }
     @media(max-width:640px) {
       .archive-scene { padding:9px 9px 7px; margin:14px 0 22px; }
       .archive-scene-inner { height:190px; }
       .archive-scene figcaption { font-size:9px; }
     }

     /* Компактная зона чтения сцены: фотографии не затрагиваем. */
     .nikita-story-reading {
         width: min(100%, 720px);
         margin: 18px auto 24px;
     }
     .nikita-story-reading .nikita-thought {
         width: 100%;
         padding: 18px 22px;
         margin: 14px 0;
         border-radius: 0 10px 10px 0;
     }
     .nikita-story-reading .nikita-thought-label {
         font-size: 10px;
         margin-bottom: 8px;
     }
     .stApp .nikita-story-reading .nikita-thought-text p {
         font-size: 17px;
         line-height: 1.55;
         margin: 0 0 10px;
     }
     .stApp .nikita-story-reading .nikita-thought-text p:last-child {
         margin-bottom: 0;
     }
     .nikita-story-reading .nikita-chat-row {
         margin: 7px 0;
     }
     .nikita-story-reading .nikita-bubble {
         max-width: min(82%, 460px);
         padding: 9px 13px;
         border-radius: 12px 12px 12px 4px;
     }
     .nikita-story-reading .nikita-chat-row.mine .nikita-bubble {
         border-radius: 12px 12px 4px 12px;
     }
     .nikita-story-reading .nikita-bubble-sender {
         font-size: 12px;
         margin-bottom: 2px;
     }
     .nikita-story-reading .nikita-bubble-text {
         font-size: 16px;
         line-height: 1.45;
     }
     .nikita-story-reading .nikita-narration {
         margin: 11px 0;
         padding: 9px 14px;
         font-size: 15px;
         line-height: 1.55;
         color: #b8c0c9;
     }
     .nikita-story-reading .nikita-phone-tag {
         margin: 4px 0 6px;
     }
     .nikita-story-reading .nikita-phone-head {
         font-size: 13px;
         padding: 0 0 7px;
         margin-bottom: 9px;
     }
     @media (max-width: 640px) {
         .nikita-story-reading {
             width: 100%;
             margin: 12px auto 18px;
         }
         .nikita-story-reading .nikita-thought { padding: 15px 16px; }
         .stApp .nikita-story-reading .nikita-thought-text p { font-size: 16px; }
         .nikita-story-reading .nikita-bubble { max-width: 90%; }
         .nikita-story-reading .nikita-bubble-text { font-size: 15px; }
     }
    </style>
    """, unsafe_allow_html=True)

    # Четыре сюжетные сцены
    introduction = NIKITA_STORY["stages"][0]["scenes"]
    development = NIKITA_STORY["stages"][1]["scenes"]
    scenes = introduction + development

    # Три дополнительных материала
    materials = NIKITA_STORY["stages"][2]["materials"]
    questions = NIKITA_STORY["stages"][3]["questions"]
    conclusion = NIKITA_STORY["stages"][4]

    # Четыре сюжетные сцены, материалы, карта и заключение
    total_screens = len(scenes) + 3

    if "nikita_preview_scene" not in st.session_state:
        st.session_state.nikita_preview_scene = 0

    index = st.session_state.nikita_preview_scene

    st.caption("ИСТОРИЯ 01 / КОГДА ВСЁ СПОКОЙНО")
    st.progress((index + 1) / total_screens)
    st.caption(f"Этап {index + 1} из {total_screens}")

    # Первые четыре экрана — сюжетные сцены
    if index < len(scenes):
        scene = scenes[index]

        if scene["type"] == "monologue":
            render_monologue(scene)

        elif scene["type"] == "messages":
            render_messages(scene)

        elif scene["type"] == "dialogue":
            render_dialogue(scene)

        left, right = st.columns(2)

        with left:
            if st.button(
                "← Назад",
                key="nikita_preview_back",
                disabled=index == 0,
                use_container_width=True
            ):
                st.session_state.nikita_preview_scene -= 1
                st.rerun()

        with right:
            if st.button(
                "Далее →",
                key="nikita_preview_next",
                type="primary",
                use_container_width=True
            ):
                st.session_state.nikita_preview_scene += 1
                st.rerun()

    # Пятый экран — раскрытие дополнительных материалов
    elif index == len(scenes):
        all_opened = render_story_materials(materials)

        left, right = st.columns(2)

        with left:
            if st.button(
                "← К предыдущей сцене",
                key="nikita_materials_back",
                use_container_width=True
            ):
                st.session_state.nikita_preview_scene -= 1
                st.rerun()

        with right:
            if st.button(
                "К карте невидимого →",
                key="nikita_materials_next",
                type="primary",
                disabled=not all_opened,
                use_container_width=True
            ):
                st.session_state.nikita_preview_scene += 1
                st.rerun()

    # Шестой экран — «Карта невидимого»
    elif index == len(scenes) + 1:
        map_completed = render_invisible_map(questions)

        left, right = st.columns(2)

        with left:
            if st.button(
                "← К материалам",
                key="nikita_map_back",
                use_container_width=True
            ):
                st.session_state.nikita_preview_scene -= 1
                st.rerun()

        with right:
            if st.button(
                "К заключению →",
                key="nikita_map_next",
                type="primary",
                disabled=not map_completed,
                use_container_width=True
            ):
                st.session_state.nikita_preview_scene += 1
                st.rerun()



    # Седьмой экран — заключение истории (только после карты)
    elif index == len(scenes) + 2:
        st.caption("ИСТОРИЯ 01 / ЗАКЛЮЧЕНИЕ")

        st.title(conclusion["title"])
        st.write(conclusion["introduction"])

        # Карточки одинаковой высоты благодаря общей CSS-сетке.
        from html import escape as escape_html
        factor_cards = "".join(
            '<div class="nikita-factor-card">'
            f'<div class="nikita-factor-number">ФАКТОР {i:02d}</div>'
            f'<h3>{escape_html(factor["title"])}</h3>'
            f'<p>{escape_html(factor["text"])}</p>'
            '</div>'
            for i, factor in enumerate(conclusion["factors"], start=1)
        )
        st.markdown(
            f'<div class="nikita-factor-grid">{factor_cards}</div>',
            unsafe_allow_html=True,
        )
        ending_paragraphs = "".join(
            f'<p>{escape_html(paragraph)}</p>'
            for paragraph in conclusion["final_text"].split("\n\n")
        )
        st.markdown(
            '<div class="nikita-ending">'
            f'{ending_paragraphs}'
            f'<p class="nikita-ending-strong">{escape_html(conclusion["final_emphasis"])}</p>'
            '</div>',
            unsafe_allow_html=True,
        )

        st.session_state.nikita_story_completed = True

        left, right = st.columns(2)

        with left:
            if st.button(
                    "← К карте невидимого",
                    key="nikita_conclusion_back",
                    use_container_width=True
            ):
                st.session_state.nikita_preview_scene -= 1
                st.rerun()

        with right:
            if st.button(
                    "К невидимой статистике →",
                    key="nikita_conclusion_next",
                    type="primary",
                    use_container_width=True
            ):
                st.session_state.iv_stats_screen = 0
                go("Статистика")
                st.rerun()

elif page == "Выбор":
    st.title("Истории · тестовая версия")
    st.write("Для первого пользовательского тестирования доступна история Никиты. Две другие истории находятся в разработке.")
    choice_image = data_uri("assets/nikita/cover.jpg")
    if choice_image:
        st.markdown(
            '<div class="archive-choice">'
            f'<img src="{choice_image}" alt="Архивный коллаж истории Никиты">'
            '<div><span class="archive-choice-tag">ДЕЛО 01 / НИКИТА, 14 ЛЕТ</span>'
            '<h3>Когда всё спокойно</h3>'
            '<p>Один подросток, четыре повседневные сцены и то, что остаётся за кадром.</p>'
            '</div></div>', unsafe_allow_html=True,
        )
    if st.button(
        "Начать историю Никиты →",
        type="primary",
        key="nikita_preview_open"
    ):
        st.session_state.nikita_preview_scene = 0
        st.session_state.nikita_opened_materials = []
        st.session_state.nikita_active_material = None
        st.session_state.nikita_map_answers = {}
        st.session_state.nikita_map_revealed = False
        go("Никита")
        st.rerun()
    st.caption("Истории 02 и 03 будут добавлены в полной версии выставки.")

elif page == "История":
    name = st.session_state.story
    scenes = STORIES[name]["scenes"]
    index = st.session_state.scene
    scene = scenes[index]
    st.caption(f"{name.upper()} · СЦЕНА {index + 1} ИЗ {len(scenes)}")
    st.progress((index + 1) / len(scenes))
    st.title(scene["title"])
    st.write(scene["text"])
    if st.button("Что остаётся незаметным?", key=f"reveal_{name}_{index}"):
        st.session_state.reveal = True
    if st.session_state.reveal:
        st.info(scene["reveal"])
    left, right = st.columns(2)
    with left:
        if st.button("← Назад", disabled=index == 0):
            st.session_state.scene -= 1
            st.session_state.reveal = False
            st.rerun()
    with right:
        if index < len(scenes) - 1:
            if st.button("Далее →", type="primary"):
                st.session_state.scene += 1
                st.session_state.reveal = False
                st.rerun()
        else:
            st.button("К другим историям →", type="primary", on_click=go, args=("Выбор",))

elif page == "Статистика":
    render_invisible_statistics()
    st.button("← Вернуться к историям", on_click=go, args=("Выбор",))

elif page == "Заключение":
    st.caption("ИНФОРМАЦИЯ О ПИЛОТЕ")
    st.title("Спасибо за участие")
    st.write("Это тестовая версия цифровой выставки «Невидимые истории». Сейчас доступны первоначальная проверка восприятия, история Никиты и общий раздел статистики.")
    st.write("Итоговое тестирование и две другие истории появятся позже. Эта версия предназначена для проверки понятности, восприятия и удобства, а не для измерения изменения знаний.")
    st.info("Если организатор прислал вам отдельную анкету обратной связи, заполните её после прохождения. Здесь отзывы не собираются и не сохраняются.")
    st.button("Вернуться на главную →", on_click=go, args=("Главная",))

st.divider()
st.caption("Пилотная версия · Художественные реконструкции · История Никиты и статистика · 2026")