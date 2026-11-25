"""Тестовая версия общего статистического раздела. Данные: РНФ/СПбГУ и UNICEF.
Никаких запросов к внешним API и внешних Python-зависимостей не требуется.
"""
import html
import streamlit as st


SOURCES = {
    "russia": "https://www.rscf.ru/project/24-28-00424/",
    "global": "https://www.unicef.org/press-releases/nearly-400-million-young-children-worldwide-regularly-experience-violent-discipline",
    "eca": "https://www.unicef.org/eca/reports/where-we-live-and-learn",
}


def _tag(text):
    st.markdown(f'<div class="iv-stat-tag">{html.escape(text)}</div>', unsafe_allow_html=True)


def _source(name, url, detail):
    st.markdown(f'**Источник:** [{name}]({url}) — {detail}')


def _bar(name, value, color="#bd7969"):
    st.markdown(
        '<div class="iv-stat-bar">'
        '<div class="iv-stat-bar-top"><span>' + html.escape(name) + '</span><strong>' + str(value).replace('.', ',') + '%</strong></div>'
        '<div class="iv-stat-track"><div style="width:' + str(value) + '%;background:' + color + '"></div></div>'
        '</div>', unsafe_allow_html=True
    )


def _style():
    st.markdown("""
    <style>
      [data-testid="stMainBlockContainer"] {max-width:920px!important;padding-left:26px!important;padding-right:26px!important;}
      .iv-stat-tag {color:#d8ae98;font-size:12px;letter-spacing:.15em;font-weight:750;margin:12px 0 18px;}
      .iv-stat-lead {font-size:21px;line-height:1.6;color:#ece4dc;max-width:740px;margin-bottom:24px;}
      .iv-stat-archive {border:1px solid #51483f;background:linear-gradient(145deg,#252626,#171d23);border-radius:5px;
        padding:24px 27px;margin:22px 0;box-shadow:8px 9px 0 rgba(103,76,65,.17);}
      .iv-stat-archive .iv-n {font-size:clamp(38px,6vw,60px);font-weight:800;color:#e7b7a0;line-height:1.1;}
      .iv-stat-archive p {color:#e4e0da;font-size:17px!important;line-height:1.6;}
      .iv-stat-archive .iv-mini {color:#d4aa93;font-size:11px;letter-spacing:.13em;font-weight:700;}
      .iv-stat-bar {margin:18px 0;}
      .iv-stat-bar-top {display:flex;justify-content:space-between;align-items:baseline;gap:12px;color:#e9e5df;font-size:16px;}
      .iv-stat-track {height:14px;background:#303843;border-radius:6px;overflow:hidden;margin-top:8px;}
      .iv-stat-track>div {height:100%;border-radius:6px;}
      .iv-stat-answer {margin:18px 0;padding:17px 20px;border-left:3px solid #c55b4d;background:#222b35;border-radius:0 9px 9px 0;}
      .iv-stat-answer p {font-size:17px!important;color:#eee9e3;line-height:1.6;}
      .iv-stat-source-note {font-size:14px;color:#b7b6b3;}
      @media(max-width:640px){.iv-stat-archive{padding:18px 16px;}[data-testid="stMainBlockContainer"]{padding-left:15px!important;padding-right:15px!important;}}
    </style>
    """, unsafe_allow_html=True)


def _screen_russia():
    _tag('АРХИВ 01 / РОССИЯ / 2024')
    st.title('Что мы называем насилием?')
    st.markdown('<div class="iv-stat-lead">Насилие не обязательно оставляет следы на теле. Но какие формы россияне признают домашним насилием?</div>', unsafe_allow_html=True)
    st.caption('Всероссийский опрос 1 600 взрослых жителей России. Показаны доли людей, которые относят разные формы поведения к домашнему насилию, а НЕ распространённость насилия.')
    mode = st.radio('Показать формы', ['Все четыре', 'Только нефизические'], horizontal=True, key='iv_stats_ru_mode')
    values = [('Физическое',95.5), ('Сексуальное',88), ('Психологическое',87), ('Экономическое',61.3)]
    for name, val in values:
        if mode == 'Все четыре' or name in ('Психологическое', 'Экономическое'):
            _bar(name,val, '#c55b4d' if name in ('Психологическое','Экономическое') else '#75818e')
    st.markdown('<div class="iv-stat-answer"><strong>Что важно?</strong><p>87% опрошенных признают психологическое насилие одной из форм домашнего насилия. Это не значит, что 87% детей переживали его.</p></div>',unsafe_allow_html=True)
    _source('Российский научный фонд, проект СПбГУ',SOURCES['russia'],'Аннотация результатов исследования за 2024 год.')


def _screen_world():
    _tag('АРХИВ 02 / МИР / UNICEF')
    st.title('Что показывают международные исследования?')
    st.write('Разные исследования измеряют разные формы воздействия и возрастные группы. Откройте каждый документ и прочитайте условия оценки.')
    data=[
       ('global','МИР / 2024','Около 400 млн','детей младше пяти лет регулярно сталкивались с психологической агрессией И/ИЛИ физическим наказанием дома.','Это оценка совокупного показателя для детей младше пяти лет. Из этой цифры нельзя выделить точное число детей, столкнувшихся только с психологической агрессией.',SOURCES['global']),
       ('eca','ЕВРОПА И ЦЕНТРАЛЬНАЯ АЗИЯ / 2025','36–69%','В 15 странах и территориях Европы и Центральной Азии с сопоставимыми данными от 36% до 69% детей в возрасте 1–14 лет сталкивались с психологической агрессией со стороны взрослых, осуществляющих уход, в течение последнего месяца','Диапазон относится к отдельным странам и территориям с сопоставимыми данными, а не к среднему значению по всему региону. Годы исходных исследований различаются.',SOURCES['eca']),
    ]
    for ident,heading,num,description,detail,url in data:
        with st.container(border=True):
            _tag(heading)
            st.markdown(f'<div class="iv-stat-archive"><div class="iv-n">{html.escape(num)}</div><p>{html.escape(description)}</p></div>',unsafe_allow_html=True)
            if st.button('Скрыть пояснение ↑' if st.session_state.get('iv_detail_'+ident) else 'Что именно измеряли? ↓',key='iv_open_'+ident,use_container_width=True):
                st.session_state['iv_detail_'+ident]=not st.session_state.get('iv_detail_'+ident,False)
                st.rerun()
            if st.session_state.get('iv_detail_'+ident):
                st.info(detail)
            st.markdown(f'[Открыть первоисточник]({url})')
    st.caption('Эти два показателя нельзя складывать, вычитать или напрямую сравнивать: единицы измерения и возрастные группы различаются.')


def _screen_limits():
    _tag('АРХИВ 03 / ГРАНИЦЫ ДАННЫХ')
    st.title('Что остаётся за пределами статистики?')
    st.markdown('<div class="iv-stat-lead">Если о пережитом не сообщили или оно не попало в реестр, означает ли это, что проблемы не было?</div>',unsafe_allow_html=True)
    st.radio('Выберите наиболее обоснованный вывод:',[
        'Да, официальные данные показывают все случаи.',
        'Нет, регистрация и опросы охватывают не все ситуации.',
        'Нельзя исследовать психологическое насилие количественно.'
    ], key='iv_stats_limit_answer',index=None)
    if st.button('Раскрыть объяснение',disabled=st.session_state.get('iv_stats_limit_answer') is None, key='iv_stats_limit_reveal',type='primary'):
        st.session_state.iv_stats_limit_revealed=True
    if st.session_state.get('iv_stats_limit_revealed'):
        st.markdown('<div class="iv-stat-answer"><strong>Что остаётся невидимым?</strong><p>Ни официальные реестры, ни опросы не охватывают все случаи. Дети могут не рассказывать о происходящем, отдельные формы насилия не учитываются, а определения в разных странах отличаются. Даже при наличии чисел нельзя без проверки сравнивать выборки.</p></div>',unsafe_allow_html=True)
        st.caption('Психологическое насилие поддаётся исследованию, но качество и полнота данных ограничены.')
    _source('UNICEF — Where we live and learn',SOURCES['eca'],'Разделы о пробелах, качестве и сопоставимости данных, 2025 год.')


def _screen_connection():
    _tag('АРХИВ 04 / ЗА ЦИФРАМИ — ИСТОРИИ')
    st.title('В каждой цифре — чья-то история')
    st.write('История Никиты — художественная реконструкция, а не статистическая единица. Она помогает заметить то, что сложно измерить одной цифрой.')
    for label,text in [
       ('Эмоциональная ответственность','Никита чувствует, что обязан поддерживать отца, даже когда сам нуждается в помощи.'),
       ('Ограничение общения','Тревога о ситуации дома влияет на его решения и встречи с друзьями.'),
       ('Трудности с просьбой о помощи','Он начинает говорить о своих переживаниях, но удаляет сообщение.')]:
        with st.expander(label):
            st.write(text)
    st.markdown('<div class="iv-stat-answer"><strong>Главный вывод</strong><p>Статистика показывает исследованные тенденции, а личные истории помогают увидеть ситуации, которые сами по себе не сводятся к процентам. Отсутствие зарегистрированного случая не означает отсутствие проблемы.</p></div>',unsafe_allow_html=True)
    st.success('Вы завершили тестовую версию раздела «Невидимая статистика».')
    st.caption('В пилотной версии итогового теста ещё нет. После прохождения оставьте отзыв по ссылке на анкету, которую прислал организатор.')


def render_invisible_statistics():
    """Отдельная тестовая версия единого раздела после трёх историй."""
    _style()
    if 'iv_stats_screen' not in st.session_state:
        st.session_state.iv_stats_screen=0
    index=max(0,min(int(st.session_state.iv_stats_screen),3))
    st.caption('НЕВИДИМЫЕ ИСТОРИИ / СТАТИСТИКА · ТЕСТОВАЯ ВЕРСИЯ')
    st.progress((index+1)/4)
    st.caption(f'Экран {index+1} из 4')
    [_screen_russia,_screen_world,_screen_limits,_screen_connection][index]()
    st.divider()
    c1,c2=st.columns(2)
    with c1:
        if st.button('← Назад',disabled=index==0,use_container_width=True,key='iv_stats_back'):
            st.session_state.iv_stats_screen=index-1
            st.rerun()
    with c2:
        if index<3 and st.button('Далее →',type='primary',use_container_width=True,key='iv_stats_next'):
            st.session_state.iv_stats_screen=index+1
            st.rerun()
