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
  var kafle   = [].slice.call(document.querySelectorAll(".galeria__el"));
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

  kafle.forEach(function(el, i){
    el.addEventListener("click", function(){ otworz(i, el); });
    el.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); otworz(i, el); }
    });
  });

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
   Jedenaście pozycji z opisami to na wąskim ekranie kilka ekranów samego tekstu.
   Na desktopie nic się nie zmienia — wszystko zostaje rozwinięte. */
(function(){
  var grupy = [].slice.call(document.querySelectorAll(".oferta__grupa"));
  if(!grupy.length) return;
  var waskie = window.matchMedia("(max-width: 900px)");

  grupy.forEach(function(g, i){
    var nazwa = g.querySelector(".oferta__nazwa");
    var poz   = g.querySelector(".oferta__poz");
    if(!nazwa || !poz) return;

    poz.id = "oferta-grupa-" + i;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "oferta__przycisk";
    btn.setAttribute("aria-controls", poz.id);
    while(nazwa.firstChild) btn.appendChild(nazwa.firstChild);

    var licznik = document.createElement("span");
    licznik.className = "oferta__licznik";
    licznik.textContent = poz.querySelectorAll(".zabieg").length;
    btn.appendChild(licznik);
    nazwa.appendChild(btn);

    btn.addEventListener("click", function(){
      if(!waskie.matches) return;                 /* na desktopie nic nie zwijamy */
      var otwarta = g.classList.toggle("otwarta");
      btn.setAttribute("aria-expanded", otwarta ? "true" : "false");
    });
  });

  function ustaw(){
    grupy.forEach(function(g){
      var btn = g.querySelector(".oferta__przycisk");
      if(!btn) return;
      if(waskie.matches){
        g.classList.add("skladana");
        btn.setAttribute("aria-expanded", g.classList.contains("otwarta") ? "true" : "false");
      } else {
        g.classList.remove("skladana");
        btn.removeAttribute("aria-expanded");     /* po obrocie telefonu wraca pełna lista */
      }
    });
  }
  ustaw();
  if(waskie.addEventListener) waskie.addEventListener("change", ustaw);
  else if(waskie.addListener) waskie.addListener(ustaw);
})();

/* ---------- opinie: przesuwany pasek ----------
   Strzałki i kropki pokazują się dopiero, gdy jest co przewijać — przy trzech
   opiniach na szerokim ekranie pasek się mieści i sterowanie znika samo. */
(function(){
  var pas = document.getElementById("opiniePas");
  if(!pas) return;
  var obudowa = pas.closest(".opinie");
  var lewo  = obudowa.querySelector(".opinie__strzalka--lewo");
  var prawo = obudowa.querySelector(".opinie__strzalka--prawo");
  var kropki = document.getElementById("opinieKropki");
  var karty = [].slice.call(pas.querySelectorAll(".opinia"));
  if(!karty.length) return;

  function jestCoPrzewijac(){ return pas.scrollWidth - pas.clientWidth > 8; }

  karty.forEach(function(_, i){
    var k = document.createElement("button");
    k.type = "button"; k.className = "opinie__kropka";
    k.setAttribute("aria-label", "Opinia " + (i+1));
    k.addEventListener("click", function(){ przewinDo(i); });
    kropki.appendChild(k);
  });

  function przewinDo(i){
    var cel = karty[Math.max(0, Math.min(karty.length-1, i))];
    pas.scrollTo({left: cel.offsetLeft - pas.offsetLeft, behavior:"smooth"});
  }
  function terazWidoczna(){
    var x = pas.scrollLeft + pas.clientWidth/3;
    var naj = 0, min = Infinity;
    karty.forEach(function(k,i){
      var d = Math.abs((k.offsetLeft - pas.offsetLeft) - pas.scrollLeft);
      if(d < min){ min = d; naj = i; }
    });
    return naj;
  }
  function odswiez(){
    var da = jestCoPrzewijac();
    obudowa.classList.toggle("przesuwalne", da);
    if(!da) return;
    var i = terazWidoczna();
    [].slice.call(kropki.children).forEach(function(k, j){
      k.classList.toggle("aktywna", j === i);
    });
    lewo.hidden  = pas.scrollLeft <= 4;
    prawo.hidden = pas.scrollLeft >= pas.scrollWidth - pas.clientWidth - 4;
  }

  lewo.addEventListener("click",  function(){ przewinDo(terazWidoczna() - 1); });
  prawo.addEventListener("click", function(){ przewinDo(terazWidoczna() + 1); });
  pas.addEventListener("scroll", odswiez, {passive:true});
  window.addEventListener("resize", odswiez);
  odswiez();
})();

})();
