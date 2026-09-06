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
doOdkrycia.forEach(function(el, i){
  el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + "ms";
  widocznosc(el, -60, function(jest){ if(jest) el.classList.add("widac"); });
});
/* bezpiecznik, gdyby liczenie widoczności nie zadziałało */
setTimeout(function(){ doOdkrycia.forEach(function(el){ el.classList.add("widac"); }); }, 2500);

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

})();
