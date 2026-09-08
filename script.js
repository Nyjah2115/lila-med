/* ===== LILA MED — interakcje ===== */
(function(){
"use strict";

var podglad = location.search.indexOf("podglad") >= 0; /* rysuj też w ukrytej karcie — do zrzutów */
var mniejRuchu = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- widoczność liczona z getBoundingClientRect ----------
   IntersectionObserver bywa martwy w podglądach, a w karcie w tle stoi rAF,
   więc liczymy synchronicznie przy scrollu i resize. */
var obserwowane = [];
function widocznosc(el, margines, cb){ obserwowane.push({el:el, m:margines||0, cb:cb, byl:false}); }
function przeliczWidocznosc(){
  var h = window.innerHeight || document.documentElement.clientHeight;
  for(var i=0;i<obserwowane.length;i++){
    var o = obserwowane[i], r = o.el.getBoundingClientRect();
    var jest = r.bottom > -o.m && r.top < h + o.m;
    if(jest !== o.byl){ o.byl = jest; o.cb(jest); }
  }
}

/* ---------- nawigacja ---------- */
var nav = document.getElementById("nav");
var burger = document.getElementById("burger");
var menu = document.getElementById("menu");

if(burger && menu){
  burger.addEventListener("click", function(){
    var otw = menu.classList.toggle("otwarte");
    burger.classList.toggle("aktywny", otw);
    burger.setAttribute("aria-expanded", otw ? "true" : "false");
  });
  menu.addEventListener("click", function(e){
    if(e.target.tagName === "A"){
      menu.classList.remove("otwarte");
      burger.classList.remove("aktywny");
      burger.setAttribute("aria-expanded","false");
    }
  });
}

/* ---------- reveal ---------- */
var doOdkrycia = [].slice.call(document.querySelectorAll(".reveal"));
var cokolwiekOdkryte = false;
doOdkrycia.forEach(function(el, i){
  el.style.transitionDelay = (Math.min(i % 6, 5) * 70) + "ms";
  widocznosc(el, -80, function(jest){
    if(jest){ el.classList.add("widac"); cokolwiekOdkryte = true; }
  });
});
/* Bezpiecznik na wypadek, gdyby liczenie widoczności nie działało. Odpala się
   dopiero wtedy, gdy ktoś już przewijał, a mimo to nic się nie odsłoniło — bo przy
   samej górze strony żaden element z animacją jeszcze nie jest widoczny (pierwszy
   zaczyna się grubo poniżej ekranu) i bezwarunkowe odsłanianie po czasie kasowało
   cały efekt: zanim ktokolwiek doscrollował, cała strona była już pokazana. */
var bylScroll = false;
window.addEventListener("scroll", function(){ bylScroll = true; }, {passive:true});
(function ratunek(){
  setTimeout(function(){
    if(cokolwiekOdkryte) return;          // mechanizm działa, nie ruszamy
    if(!bylScroll) return ratunek();      // nikt jeszcze nie przewijał — czekamy dalej
    doOdkrycia.forEach(function(el){ el.classList.add("widac"); });
  }, 2500);
})();

function przyScrollu(){
  if(nav) nav.classList.toggle("jest-tlo", window.scrollY > 24);
  przeliczWidocznosc();
}
window.addEventListener("scroll", przyScrollu, {passive:true});
window.addEventListener("resize", przyScrollu);
przyScrollu();

/* ---------- powiększanie zdjęć w Efektach ---------- */
(function(){
  var lupa = document.getElementById("lupa");
  if(!lupa) return;
  var obraz   = document.getElementById("lupaObraz");
  var podpis  = document.getElementById("lupaPodpis");
  var zamknij = document.getElementById("lupaZamknij");
  var wstecz  = document.getElementById("lupaWstecz");
  var dalej   = document.getElementById("lupaDalej");
  var kafle   = [].slice.call(document.querySelectorAll(".karuzela__el"));
  if(!kafle.length) return;

  var teraz = 0, ostatnioKliknięty = null;

  function pokaz(i){
    teraz = (i + kafle.length) % kafle.length;
    var img = kafle[teraz].querySelector("img");
    var cap = kafle[teraz].querySelector("figcaption");
    obraz.src = img.currentSrc || img.src;
    obraz.alt = img.alt || "";
    podpis.textContent = cap ? cap.textContent : "";
    obraz.onload = function(){
      /* źródła mają 360–500 px, więc pozwalam najwyżej na 1,7× oryginału —
         wyżej robi się papka. Wysokość i tak przytnie to do okna. */
      var maks = Math.round(obraz.naturalWidth * 1.7);
      obraz.style.width = "min(92vw, " + maks + "px)";
    };
    if(obraz.complete) obraz.onload();
  }

  function otworz(i, el){
    ostatnioKliknięty = el || null;
    pokaz(i);
    lupa.hidden = false;
    document.body.classList.add("zablokowane");
    /* wymuszony reflow zamiast requestAnimationFrame — w karcie w tle rAF stoi
       i nakładka zostałaby przezroczysta na zawsze */
    void lupa.offsetWidth;
    lupa.classList.add("widoczna");
    zamknij.focus();
  }

  function zamknijLupe(){
    lupa.classList.remove("widoczna");
    document.body.classList.remove("zablokowane");
    setTimeout(function(){ lupa.hidden = true; obraz.removeAttribute("src"); }, 260);
    if(ostatnioKliknięty) ostatnioKliknięty.focus();
  }

  /* karuzela sama decyduje, kiedy otworzyć powiększenie: klik w boczny kadr
     tylko go wyśrodkowuje, dopiero klik w środkowy powiększa */
  window.__lupaOtworz = function(i){ otworz(i, kafle[i]); };

  zamknij.addEventListener("click", zamknijLupe);
  wstecz.addEventListener("click", function(){ pokaz(teraz - 1); });
  dalej.addEventListener("click", function(){ pokaz(teraz + 1); });
  lupa.addEventListener("click", function(e){ if(e.target === lupa) zamknijLupe(); });
  document.addEventListener("keydown", function(e){
    if(lupa.hidden) return;
    if(e.key === "Escape") zamknijLupe();
    else if(e.key === "ArrowLeft") pokaz(teraz - 1);
    else if(e.key === "ArrowRight") pokaz(teraz + 1);
  });

  /* przesuwanie palcem */
  var x0 = null;
  lupa.addEventListener("touchstart", function(e){ x0 = e.touches[0].clientX; }, {passive:true});
  lupa.addEventListener("touchend", function(e){
    if(x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if(Math.abs(dx) > 45) pokaz(teraz + (dx < 0 ? 1 : -1));
    x0 = null;
  }, {passive:true});
})();

/* ---------- oferta: na telefonie grupy zwijają się w akordeon ----------
   Jedenaście pozycji z opisami to ściana tekstu — zwinięte na każdej szerokości. */
(function(){
  var grupy = [].slice.call(document.querySelectorAll(".oferta__grupa"));
  if(!grupy.length) return;

  grupy.forEach(function(g, i){
    var nazwa = g.querySelector(".oferta__nazwa");
    var poz   = g.querySelector(".oferta__poz");
    if(!nazwa || !poz) return;

    poz.id = "oferta-grupa-" + i;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "oferta__przycisk";
    btn.setAttribute("aria-controls", poz.id);
    /* <br> z nagłówka zamieniam na spację — w pasku akordeonu nazwa idzie
       jedną linią, a samo ukrycie <br> sklejałoby słowa */
    while(nazwa.firstChild){
      var w = nazwa.firstChild;
      if(w.nodeName === "BR"){ nazwa.removeChild(w); btn.appendChild(document.createTextNode(" ")); }
      else btn.appendChild(w);
    }

    var licznik = document.createElement("span");
    licznik.className = "oferta__licznik";
    licznik.textContent = poz.querySelectorAll(".zabieg").length;
    btn.appendChild(licznik);
    nazwa.appendChild(btn);

    btn.addEventListener("click", function(){
      var otwarta = g.classList.toggle("otwarta");
      btn.setAttribute("aria-expanded", otwarta ? "true" : "false");
    });

    g.classList.add("skladana");
    btn.setAttribute("aria-expanded", "false");
  });

})();

/* ---------- opinie: pasek bez końca ----------
   Obok oryginalnego zestawu kładę dwie kopie i po przekroczeniu granicy
   przeskakuję o szerokość jednego zestawu. Skok jest niewidoczny, bo pasek
   wygląda w tym miejscu identycznie — dzięki temu przewijanie nigdy się nie kończy. */
(function(){
  var pas = document.getElementById("opiniePas");
  if(!pas) return;
  var obudowa = pas.closest(".opinie");
  var lewo    = obudowa.querySelector(".opinie__strzalka--lewo");
  var prawo   = obudowa.querySelector(".opinie__strzalka--prawo");
  var karty   = [].slice.call(pas.children);
  if(karty.length < 2) return;

  /* widoczność kart nie może zależeć od wjazdu — kopie i tak by go nie dostały */
  karty.forEach(function(k){ k.classList.add("widac"); k.style.transitionDelay = "0s"; });

  var zestaw = 0;
  var ODSTEP = 18;

  /* Szerokość kart liczona tak, żeby w pasku mieściła się DOKŁADNA ich liczba —
     bez wystającego kawałka, którego trzeba by wygaszać maską. */
  function dopasujSzerokosc(){
    var dostepne = pas.clientWidth;
    var odstep = window.matchMedia("(max-width: 640px)").matches ? 12 : ODSTEP;
    var ile = Math.max(1, Math.min(4, Math.floor(dostepne / 340)));
    var szer = (dostepne - odstep * (ile - 1)) / ile;
    pas.style.gridAutoColumns = szer + "px";
    return odstep;
  }

  function skok(x){
    var b = pas.style.scrollBehavior;
    pas.style.scrollBehavior = "auto";
    pas.scrollLeft = x;
    pas.style.scrollBehavior = b;
  }

  function zbuduj(){
    [].slice.call(pas.querySelectorAll(".opinia--kopia")).forEach(function(k){ k.remove(); });
    dopasujSzerokosc();
    for(var i = 0; i < 2; i++){
      karty.forEach(function(k){
        var kl = k.cloneNode(true);
        kl.classList.add("opinia--kopia", "widac");
        kl.setAttribute("aria-hidden", "true");
        pas.appendChild(kl);
      });
    }
    var pierwszaKopia = pas.querySelector(".opinia--kopia");
    /* mierzę odstęp między początkiem oryginału a początkiem kopii — sam
       scrollWidth zawierałby jeszcze padding paska i pętla by dryfowała */
    zestaw = pierwszaKopia.offsetLeft - karty[0].offsetLeft;
    obudowa.classList.add("przesuwalne");
    skok(zestaw);
  }

  function pilnujPetli(){
    if(!zestaw) return;
    if(pas.scrollLeft < zestaw * 0.5)      skok(pas.scrollLeft + zestaw);
    else if(pas.scrollLeft > zestaw * 1.5) skok(pas.scrollLeft - zestaw);
  }

  function przesun(kier){
    var odstep = window.matchMedia("(max-width: 640px)").matches ? 12 : ODSTEP;
    var krok = karty[0].offsetWidth + odstep;
    pas.scrollBy({left: kier * krok, behavior: "smooth"});
  }

  lewo.addEventListener("click",  function(){ przesun(-1); });
  prawo.addEventListener("click", function(){ przesun(1); });
  pas.addEventListener("scroll", pilnujPetli, {passive:true});

  var czekaj;
  window.addEventListener("resize", function(){
    clearTimeout(czekaj); czekaj = setTimeout(zbuduj, 200);
  });
  zbuduj();
})();

/* ---------- galeria efektów: karuzela 3D ----------
   Środkowy kadr z przodu, sąsiednie odsunięte i obrócone w perspektywie.
   Pozycje ustawiam w stylach inline, czyli jako STAN — gdy przejścia stoją,
   slajdy i tak lądują tam, gdzie mają być. */
(function(){
  var scena = document.getElementById("karuzelaScena");
  if(!scena) return;
  var obudowa = scena.closest(".karuzela");
  var karty   = [].slice.call(scena.querySelectorAll(".karuzela__el"));
  var kropki  = document.getElementById("karuzelaKropki");
  var lewo    = obudowa.querySelector(".karuzela__strzalka--lewo");
  var prawo   = obudowa.querySelector(".karuzela__strzalka--prawo");
  if(karty.length < 2) return;

  var ile = karty.length, teraz = 0, stoi = false, zegar = null;

  karty.forEach(function(k, i){
    var kropka = document.createElement("button");
    kropka.type = "button"; kropka.className = "karuzela__kropka";
    kropka.setAttribute("aria-label", "Zdjęcie " + (i+1));
    kropka.addEventListener("click", function(){ idzDo(i); });
    kropki.appendChild(kropka);
  });

  /* Scena musi być tak wysoka jak najwyższa karta — przy stałej wartości z CSS
     albo zostawała pusta przestrzeń, albo sterowanie uciekało poza sekcję. */
  function dopasujWysokosc(){
    var max = 0;
    karty.forEach(function(k){ max = Math.max(max, k.offsetHeight); });
    if(max) scena.style.minHeight = Math.round(max + 26) + "px";
  }

  function ustaw(odRazu){
    /* Pierwsze ułożenie bez przejścia: inaczej slajdy dochodzą na miejsce
       animacją, a gdy ta stoi, wszystkie zostają na kupie na środku. */
    if(odRazu) karty.forEach(function(k){ k.style.transition = "none"; });
    dopasujWysokosc();
    var szer = karty[0].getBoundingClientRect().width || 300;
    var bok  = szer * 0.78;                 /* odsunięcie sąsiada */
    karty.forEach(function(k, i){
      var d = (i - teraz + ile) % ile;
      if(d > ile / 2) d -= ile;             /* -1 to sąsiad z lewej */
      var t, o, z, f;
      if(d === 0){
        t = "translateX(0) scale(1) rotateY(0deg)"; o = 1; z = 30; f = "none";
        k.classList.add("karuzela__el--srodek");
      } else {
        var znak = d > 0 ? 1 : -1;
        var krok = Math.min(Math.abs(d), 2);
        t = "translateX(" + (znak * bok * krok) + "px) scale(" + (krok === 1 ? .82 : .68) + ") " +
            "rotateY(" + (-znak * (krok === 1 ? 26 : 38)) + "deg)";
        o = krok === 1 ? .78 : .45; z = 20 - krok; f = "none";
        k.classList.remove("karuzela__el--srodek");
      }
      k.style.transform = t;
      k.style.opacity   = o;
      k.style.zIndex    = z;
      k.style.filter    = f;
      k.style.boxShadow = d === 0 ? "0 30px 70px -34px rgba(84,69,64,.85)"
                                  : "0 16px 40px -30px rgba(84,69,64,.7)";
      k.setAttribute("aria-hidden", d === 0 ? "false" : "true");
    });
    [].slice.call(kropki.children).forEach(function(k, i){
      k.classList.toggle("aktywna", i === teraz);
    });
    if(odRazu){
      void scena.offsetWidth;                       /* wymuszony reflow */
      karty.forEach(function(k){ k.style.transition = ""; });
    }
  }

  function idzDo(i){ teraz = (i + ile) % ile; ustaw(); odlicz(); }
  function dalej(){ idzDo(teraz + 1); }
  function wstecz(){ idzDo(teraz - 1); }

  function odlicz(){
    clearTimeout(zegar);
    if(stoi || document.hidden) return;
    zegar = setTimeout(function(){ idzDo(teraz + 1); }, 6000);
  }

  karty.forEach(function(k, i){
    k.addEventListener("click", function(){
      if(i !== teraz) idzDo(i);                 /* boczny kadr — wysuń na środek */
      else if(window.__lupaOtworz) window.__lupaOtworz(i);
    });
    k.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); k.click(); }
    });
  });

  lewo.addEventListener("click", wstecz);
  prawo.addEventListener("click", dalej);
  obudowa.addEventListener("mouseenter", function(){ stoi = true; clearTimeout(zegar); });
  obudowa.addEventListener("mouseleave", function(){ stoi = false; odlicz(); });

  var x0 = null;
  scena.addEventListener("touchstart", function(e){ x0 = e.touches[0].clientX; }, {passive:true});
  scena.addEventListener("touchend", function(e){
    if(x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if(Math.abs(dx) > 45){ dx < 0 ? dalej() : wstecz(); }
    x0 = null;
  }, {passive:true});

  window.addEventListener("resize", function(){ ustaw(true); });
  widocznosc(obudowa, 0, function(jest){ stoi = !jest; jest ? odlicz() : clearTimeout(zegar); });
  ustaw(true);
  /* zdjęcia doczytują się leniwie, więc wysokość przeliczam też po ich załadowaniu */
  karty.forEach(function(k){
    var i = k.querySelector("img");
    if(i && !i.complete) i.addEventListener("load", function(){ ustaw(true); });
  });
})();

})();
