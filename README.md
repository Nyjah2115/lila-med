# Lila Med — Kielce

Landing page gabinetu kosmetologii, laseroterapii i medycyny estetycznej
LILA MED (Monika Doroz), Zagnańska 88/2, Plaza Tower, Kielce.

Czysty HTML/CSS/JS, bez frameworków i bez CDN-ów poza Google Fonts.

## Podgląd

    python3 -m http.server 8919 --directory .

albo konfiguracja `lilamed` w `~/claude/.claude/launch.json` (port 8919).

## Wygląd

Jasna, ciepła paleta: kremowa biel, nude i przygaszony fiolet („lila") jako akcent.
Kroje: Bodoni Moda w nagłówkach, Outfit w tekście.

## Hero

Zdjęcie z gabinetu na cały ekran, tekst po lewej na kremowej zasłonie
(`.hero__zaslona` — gradienty, bez nich tekst na zdjęciu byłby nieczytelny).
Żadnych animacji ani WebGL-a: samo zdjęcie.

`img/hero.jpg` jest **złożone w PIL** z kadru `p02` (Monika z lustrem w gabinecie):
powiększone trzykrotnie (LANCZOS + UnsharpMask), a z lewej **dostawione 620 px
rozmytej ściany** wyciągniętej z lewej krawędzi oryginału — bez tego Monika siedzi
w środku kadru i wchodzi pod nagłówek, a `object-position` nic nie da, bo przy pionowym
zdjęciu na poziomym ekranie `cover` przycina wyłącznie w pionie.
Pomarańczowy obraz na ścianie gryzł się z fioletem, więc kadr ma **ściągnięte nasycenie
do 0,66, rozjaśnienie 1,12 i 7 % domieszki fioletu** — dopiero wtedy siedzi w palecie.

## Pas „Rewitalizacja ust"

Druga sekcja pełnoekranowa (`.pas`), między Zabiegami a Efektami: zbliżenie ust,
ta sama kremowa zasłona od lewej, nagłówek i CTA. Na wąskim ekranie zdjęcie przestaje
być tłem i staje się pasem nad tekstem — wtedy zasłona i ziarno muszą mieć **wysokość
równą zdjęciu** (`inset:0 0 auto 0; height:58vw`), inaczej gradient liczy się od
wysokości całej sekcji i zostawia widoczną krechę w połowie zdjęcia.

## Ziarno

`.hero__ziarno` i `.pas__ziarno` — kafelek szumu 128 px z `mix-blend-mode: multiply`.
Oba zdjęcia są powiększone z 360 px, więc ziarno realnie maskuje miękkość.

## Sekcja „Zabiegi"

Nie kafle, tylko **dwukolumnowa lista** (`.zabiegi` / `.zabieg`): nazwa, jedno zdanie,
cienka kreska nad każdą pozycją. Dziesięć zabiegów dzieli się równo na 5×2, więc
siatka nie zostawia sieroty w ostatnim rzędzie — to był główny powód, dla którego
poprzednia wersja z kafelkami i numerami 01–10 wyglądała na chaos. Kreski w obu
kolumnach są równo, bo pozycje siedzą w jednym gridzie, a nie w dwóch osobnych
kolumnach CSS. Na wąskim ekranie jedna kolumna.

**Numeracji tu nie przywracać** — przy dziesięciu pozycjach dokłada szumu i sugeruje
kolejność, której nie ma.

## Zdjęcia — kto gdzie stoi

Jeden kadr nie może stać dwa razy, a czystych kadrów jest mało, więc podział jest sztywny:

| Miejsce | Plik | Źródło |
|---|---|---|
| Hero | `img/hero.jpg` | `p02` — gabinet, lustro |
| Pas o ustach | `img/pas-usta.jpg` | `p01` — zbliżenie ust |
| O mnie | `img/omnie.jpg` | `p05` — fotel, kadr 4:5 od y=196, powiększony 2× |
| Efekty (3 kafle) | `efekt-czolo`, `efekt-nogi`, `monika-preparaty` | `p06`, `p08`, `p04` |

Galeria ma trzy kafle, bo tyle zostało czystych, niepowtarzających się zdjęć —
reszta z 12 postów to memy z wypalonym tekstem albo przed/po z rozpoznawalnymi
twarzami klientek, których nie publikuję bez zgód.

## Powiększanie zdjęć

Kafle w Efektach otwierają nakładkę (`.lupa`) — strzałki, Escape, klik w tło,
przesuwanie palcem, obsługa klawiatury (`tabindex`, Enter/Spacja).
Zdjęcia mają 360–500 px, więc skrypt ustawia szerokość na **najwyżej 1,7×
oryginału**; wyżej robi się papka. Wysokość i tak przycina to do okna.

Dwie rzeczy, których tu nie wolno zrobić:

- **Widoczność nakładki nie może zależeć od przejścia CSS ani od
  `requestAnimationFrame`.** W karcie w tle jedno i drugie stoi, więc nakładka
  zostałaby przezroczysta, blokując przy tym przewijanie. Dlatego `.lupa` jest
  od razu w pełni widoczna, a przejście dotyczy wyłącznie skali ramki — gdy zamarznie,
  obrazek jest po prostu o 4 % mniejszy i nikomu to nie przeszkadza.
- **`tools/podglad` (WKWebView) nie renderuje zawartości nakładki** — przez
  `backdrop-filter` wychodzą puste prostokąty. Powiększenie sprawdzać wyłącznie
  w panelu Browser.

## Warianty tła

`img/warianty/` (poza repozytorium) — pięć kadrów przygotowanych tą samą obróbką, do podmiany w hero:
`a-fotel`, `b-gabinet-preparaty`, `c-gabinet-lustro` (użyte), `d-bialy-portret`,
`e-usta` (użyte w pasie). Podmiana to `img/hero.jpg` plus dobranie `object-position`
w `.hero__tlo img`.

## Narzędzia (`tools/`)

- `podglad.swift` → `podglad` — zrzuty ekranu strony przez WKWebView:

      ./tools/podglad <url> <plik.png> <szer> <wys> <scrollY> <opóźnienie> [dodatkowyJS] [wyrażenieDoWypisania]

  Uwaga: **w tym WebView nie chodzą przejścia CSS** — dlatego narzędzie samo ustawia
  `transition: none` na `.reveal`, zanim doda klasę `widac`. Bez tego pół strony
  jest niewidoczne na zrzucie.

## Zdjęcia

`img/` — to, czego używa strona. Oryginały z Instagrama, kadry robocze i lista spraw
do potwierdzenia u klientki leżą **poza repozytorium**, bo jest publiczne.
