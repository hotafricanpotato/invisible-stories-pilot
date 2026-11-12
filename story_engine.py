"""Отображение интерактивной истории «Когда всё спокойно».
Сценарные тексты находятся только в nikita_story.py.
"""
import html
import streamlit as st
from visual_assets import data_uri


def _esc(value):
    return html.escape(str(value), quote=True)


def _paragraphs(value):
    return "".join(f"<p>{_esc(piece)}</p>" for piece in value.split("\n\n"))


def show_nikita_thoughts(text):
    """Одна художественная карточка вместо обычных текстовых контейнеров."""
    st.markdown(
        '<div class="nikita-thought">'
        '<div class="nikita-thought-label">ВНУТРЕННИЙ МОНОЛОГ</div>'
        f'<div class="nikita-thought-text">{_paragraphs(text)}</div>'
        '</div>',
        unsafe_allow_html=True,
    )


def _message(message):
    sender = message["sender"]
    css_side = "mine" if sender == "Никита" else "other"
    timestamp = (
        f'<span class="nikita-bubble-time">{_esc(message["time"])}</span>'
        if message.get("time") else ""
    )
    st.markdown(
        f'<div class="nikita-chat-row {css_side}">'
        f'<div class="nikita-bubble">'
        f'<div class="nikita-bubble-sender">{_esc(sender)}</div>'
        f'<div class="nikita-bubble-text">{_esc(message["text"])}</div>'
        f'{timestamp}</div></div>',
        unsafe_allow_html=True,
    )


def _chat(messages, title=None):
    header = f'<div class="nikita-phone-head">{_esc(title)}</div>' if title else ""
    st.markdown('<div class="nikita-phone-tag">СООБЩЕНИЯ</div>', unsafe_allow_html=True)
    if header:
        st.markdown(header, unsafe_allow_html=True)
    for message in messages:
        _message(message)


def _narration(text):
    st.markdown(f'<div class="nikita-narration">{_esc(text)}</div>', unsafe_allow_html=True)




_SCENE_ART = {
    "sunday": ("sunday.jpg", "АРХИВ / ВОСКРЕСЕНЬЕ"),
    "messages_dima": ("messages.jpg", "АРХИВ / СООБЩЕНИЯ"),
    "keys": ("keys.jpg", "АРХИВ / СРЕДА"),
    "football": ("football.jpg", "АРХИВ / ПЯТНИЦА"),
}


def show_scene_archive(scene):
    """Небольшая архивная фотография; сюжетный текст не изменяем."""
    art = _SCENE_ART.get(scene.get("id"))
    if not art:
        return
    filename, label = art
    image = data_uri(f"assets/nikita/{filename}")
    if not image:
        return
    st.markdown(
        '<figure class="archive-scene">'
        '<div class="archive-scene-inner">'
        f'<img src="{image}" alt="Художественная реконструкция: {_esc(scene["title"])}">'
        '</div>'
        f'<figcaption><span>{_esc(label)}</span><span>Художественная реконструкция</span></figcaption>'
        '</figure>',
        unsafe_allow_html=True,
    )


def initialize_story():
    if "story" not in st.session_state:
        st.session_state.story = "История 1"
    if "scene" not in st.session_state:
        st.session_state.scene = 0
    if "reveal" not in st.session_state:
        st.session_state.reveal = False


def start_story(name):
    initialize_story()
    st.session_state.story = name
    st.session_state.scene = 0
    st.session_state.reveal = False
    st.session_state.page = "История"


def next_scene(total_scenes):
    if st.session_state.scene < total_scenes - 1:
        st.session_state.scene += 1
        st.session_state.reveal = False


def previous_scene():
    if st.session_state.scene > 0:
        st.session_state.scene -= 1
        st.session_state.reveal = False


def reveal_details():
    st.session_state.reveal = True


def render_monologue(scene):
    st.subheader(scene["title"])
    show_scene_archive(scene)
    show_nikita_thoughts(scene["text"])


def render_messages(scene):
    """Компактная архивная фотография рядом с перепиской (на телефоне — сверху)."""
    st.subheader(scene["title"])
    art = _SCENE_ART.get(scene.get("id"))
    image = data_uri(f"assets/nikita/{art[0]}") if art else ""

    # Рисуем обе колонки одним HTML-блоком, чтобы фото и сообщения
    # оставались рядом даже после перерисовки интерфейса Streamlit.
    photo = (
        '<figure class="nikita-messages-photo">'
        '<span class="nikita-photo-tape" aria-hidden="true"></span>'
        f'<img src="{image}" alt="Архивный фотоколлаж: телефон Никиты и футбольные заметки">'
        '<figcaption>ФРАГМЕНТ 02 / ЛИЧНЫЕ ВЕЩИ</figcaption>'
        '</figure>'
        if image else ""
    )
    chat_bubbles = "".join(
        f'<div class="nikita-chat-row {"mine" if msg["sender"] == "Никита" else "other"}">'
        '<div class="nikita-bubble">'
        f'<div class="nikita-bubble-sender">{_esc(msg["sender"])}</div>'
        f'<div class="nikita-bubble-text">{_esc(msg["text"])}</div>'
        + (f'<span class="nikita-bubble-time">{_esc(msg["time"])}</span>'
           if msg.get("time") else "")
        + '</div></div>'
        for msg in scene["messages"]
    )
    st.markdown(
        '<section class="nikita-messages-layout">'
        f'{photo}'
        '<div class="nikita-messages-panel">'
        '<div class="nikita-phone-tag">СООБЩЕНИЯ</div>'
        '<div class="nikita-messages-panel-title">Диалог с Димой</div>'
        f'{chat_bubbles}'
        '</div></section>',
        unsafe_allow_html=True,
    )
    _narration(scene["narration"])
    show_nikita_thoughts(scene["monologue"])


def _thought_html(text):
    """Разметка монолога внутри компактной сцены (без отдельного блока Streamlit)."""
    return (
        '<div class="nikita-thought">'
        '<div class="nikita-thought-label">ВНУТРЕННИЙ МОНОЛОГ</div>'
        f'<div class="nikita-thought-text">{_paragraphs(text)}</div>'
        '</div>'
    )


def _message_html(message):
    """Разметка сообщения. Текст и имя экранируются."""
    sender = message["sender"]
    side = "mine" if sender == "Никита" else "other"
    timestamp = (
        f'<span class="nikita-bubble-time">{_esc(message["time"])}</span>'
        if message.get("time") else ""
    )
    return (
        f'<div class="nikita-chat-row {side}">'
        '<div class="nikita-bubble">'
        f'<div class="nikita-bubble-sender">{_esc(sender)}</div>'
        f'<div class="nikita-bubble-text">{_esc(message["text"])}</div>'
        f'{timestamp}</div></div>'
    )


def _narration_html(text):
    return f'<div class="nikita-narration">{_esc(text)}</div>'


def render_dialogue(scene):
    """Единая компактная композиция; порядок событий и реплик сохранён."""
    st.subheader(scene["title"])
    st.caption(scene["time"])
    show_scene_archive(scene)

    fragments = []
    if scene.get("messages"):
        fragments.append('<div class="nikita-phone-tag">СООБЩЕНИЯ</div>')
        fragments.append('<div class="nikita-phone-head">Уведомление</div>')
        fragments.extend(_message_html(msg) for msg in scene["messages"])

    if "monologue_before" in scene:
        fragments.append(_thought_html(scene["monologue_before"]))
    if "narration" in scene:
        fragments.append(_narration_html(scene["narration"]))
    if "monologue_middle" in scene:
        fragments.append(_thought_html(scene["monologue_middle"]))
    if scene.get("dialogue"):
        for message in scene["dialogue"]:
            if message.get("type") == "narration":
                fragments.append(_narration_html(message["text"]))
            else:
                fragments.append(_message_html(message))
    if "monologue_after" in scene:
        fragments.append(_thought_html(scene["monologue_after"]))

    st.markdown(
        '<div class="nikita-story-reading">' + ''.join(fragments) + '</div>',
        unsafe_allow_html=True,
    )


def _note(material):
    rows = "".join(
        f'<div class="nikita-note-row"><span class="nikita-note-box">□</span>{_esc(item)}</div>'
        for item in material["items"]
    )
    st.markdown(
        '<div class="nikita-note">'
        '<div class="nikita-note-label">ЗАМЕТКИ / ТЕЛЕФОН НИКИТЫ</div>'
        f'{rows}'
        f'<div class="nikita-note-warning">{_esc(material["highlight"])}</div>'
        '</div>', unsafe_allow_html=True,
    )


def _voice(material):
    # Это только визуальная имитация, без создания вымышленной аудиозаписи.
    heights = [9, 18, 28, 14, 31, 20, 11, 26, 34, 16, 22, 12, 29, 18, 35, 15, 25, 12, 20, 10]
    waveform = "".join(f'<i style="height:{h}px"></i>' for h in heights)
    st.markdown(
        '<div class="nikita-voice">'
        '<div class="nikita-voice-title">НЕОТПРАВЛЕННОЕ ГОЛОСОВОЕ / МАМЕ</div>'
        '<div class="nikita-wave-row"><span class="nikita-fake-play">▶</span>'
        f'<div class="nikita-waveform" aria-hidden="true">{waveform}</div></div>'
        '<div class="nikita-voice-transcript-label">РАСШИФРОВКА</div>'
        f'<p>{_esc(material["transcript"])}</p>'
        f'<div class="nikita-voice-deleted">{_esc(material["status"])}</div>'
        '</div>', unsafe_allow_html=True,
    )


def render_story_materials(materials):
    """Документы открываются только по нажатию, прогресс помнится внутри сессии."""
    if "nikita_opened_materials" not in st.session_state:
        st.session_state.nikita_opened_materials = []
    if "nikita_active_material" not in st.session_state:
        st.session_state.nikita_active_material = None

    opened = st.session_state.nikita_opened_materials
    active = st.session_state.nikita_active_material
    st.caption("ИСТОРИЯ 01 / ДОПОЛНИТЕЛЬНЫЕ МАТЕРИАЛЫ")
    st.title("То, что осталось за кадром")
    st.write("Перед вами три материала из жизни Никиты. Откройте каждый из них. Порядок не имеет значения.")
    st.progress(sum(m["id"] in opened for m in materials) / len(materials))
    st.caption(f'Изучено материалов: {sum(m["id"] in opened for m in materials)} из {len(materials)}')

    for material in materials:
        material_id = material["id"]
        is_active = material_id == active
        with st.container(border=True):
            st.subheader(material["title"])
            st.caption(material["description"])
            if material_id in opened:
                st.caption("✓ МАТЕРИАЛ ИЗУЧЕН")
            if st.button(
                "Скрыть материал ↑" if is_active else "Открыть материал ↓",
                key=f"material_{material_id}", use_container_width=True,
            ):
                if is_active:
                    st.session_state.nikita_active_material = None
                else:
                    st.session_state.nikita_active_material = material_id
                    if material_id not in opened:
                        opened.append(material_id)
                st.rerun()
            if is_active:
                if material["type"] == "chat":
                    _chat(material["messages"], "Диалог с Димой")
                elif material["type"] == "note":
                    _note(material)
                elif material["type"] == "voice":
                    _voice(material)
                if "monologue" in material:
                    show_nikita_thoughts(material["monologue"])

    st.divider()
    all_opened = all(material["id"] in opened for material in materials)
    if all_opened:
        st.success("Все три материала изучены.")
    else:
        st.info("Чтобы продолжить, откройте все три материала.")
    return all_opened


def render_invisible_map(questions):
    """Без оценок и раскрытия ответов до завершения всех трёх эпизодов."""
    if "nikita_map_answers" not in st.session_state:
        st.session_state.nikita_map_answers = {}
    if "nikita_map_revealed" not in st.session_state:
        st.session_state.nikita_map_revealed = False

    answers = st.session_state.nikita_map_answers
    revealed = st.session_state.nikita_map_revealed
    st.title("Карта невидимого")
    st.write("Вернитесь к трём эпизодам истории Никиты. Выберите наиболее обоснованную интерпретацию каждого из них.")
    st.caption("Здесь нет оценки вашей личности. Важно разобраться в ситуации.")

    for question in questions:
        qid = question["id"]
        options = question["options"]
        letters = list(options)
        with st.container(border=True):
            st.subheader(question["title"])
            st.markdown(f'> «{question["fragment"]}»')
            st.write("Как можно интерпретировать этот эпизод?")
            if not revealed:
                saved = answers.get(qid)
                selected = st.radio(
                    "Выберите один ответ", options=letters,
                    index=letters.index(saved) if saved in letters else None,
                    format_func=lambda k, opts=options: f"{k}. {opts[k]}",
                    key=f"nikita_map_{qid}",
                )
                if selected is not None:
                    answers[qid] = selected
            else:
                # Читаемое отображение без серых disabled-радиокнопок.
                chosen = answers.get(qid)
                if chosen in options:
                    st.markdown(
                        '<div class="nikita-map-choice"><span>ВАШ ВЫБОР</span>'
                        f'<p>{_esc(chosen)}. {_esc(options[chosen])}</p></div>',
                        unsafe_allow_html=True,
                    )
                st.markdown(
                    '<div class="nikita-map-explanation">'
                    '<span>НАИБОЛЕЕ ОБОСНОВАННАЯ ИНТЕРПРЕТАЦИЯ</span>'
                    f'<p><strong>{_esc(question["correct"])}. {_esc(options[question["correct"]])}</strong></p>'
                    f'<p>{_esc(question["explanation"])}</p></div>',
                    unsafe_allow_html=True,
                )

    st.divider()
    if not revealed:
        all_answered = all(question["id"] in answers for question in questions)
        if not all_answered:
            st.info("Выберите ответы во всех трёх эпизодах.")
        if st.button("Раскрыть связи", key="nikita_map_reveal", type="primary",
                     disabled=not all_answered, use_container_width=True):
            st.session_state.nikita_map_revealed = True
            st.rerun()
    else:
        st.success("Вы рассмотрели три эпизода и раскрыли связанные с ними формы семейного неблагополучия.")
    return st.session_state.nikita_map_revealed
