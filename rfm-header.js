(function(){
  const get=()=>window.rfmGetLanguage?window.rfmGetLanguage():(localStorage.getItem('rfm_lang')||'es');
  const sectionFor=()=>{const f=(location.pathname.split('/').pop()||'index.html').toLowerCase();return f==='index.html'||f===''?'home':f==='on-air.html'?'onair':f==='rfm-tv.html'?'tv':f==='contacto.html'||f==='gracias.html'?'contact':f==='about.html'? 'about' : ['programacion.html','estilos.html'].includes(f)?'onair': ['terms.html','privacy.html','cookies.html','copyright.html'].includes(f)?'about':null;};
  function updateHeader(lang){
    const labels={es:{home:'Inicio',onair:'On-Air',tv:'RFM TV',contact:'Contacto',about:'Sobre nosotros'},en:{home:'Home',onair:'On-Air',tv:'RFM TV',contact:'Contact',about:'About'},pt:{home:'Início',onair:'On-Air',tv:'RFM TV',contact:'Contato',about:'Sobre nós'}}[lang]||null;
    if(labels) document.querySelectorAll('.rfm-main-nav [data-rfm-i18n]').forEach(el=>{const k=el.dataset.rfmI18n;if(labels[k])el.textContent=labels[k];});
    document.querySelectorAll('.rfm-lang-current').forEach(el=>el.textContent=lang==='es'?'Español':lang==='en'?'English':'Português');
    document.querySelectorAll('.rfm-main-nav>a').forEach(a=>a.classList.toggle('active',a.dataset.section===sectionFor()));
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const wrap=document.querySelector('.rfm-lang');
    const btn=wrap?.querySelector('.rfm-lang-btn');
    updateHeader(get());
    btn?.addEventListener('click',e=>{e.stopPropagation();const open=wrap.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));});
    document.addEventListener('click',e=>{if(wrap&&!wrap.contains(e.target)){wrap.classList.remove('open');btn?.setAttribute('aria-expanded','false');}});
    wrap?.querySelectorAll('[data-rfm-lang]').forEach(b=>b.addEventListener('click',()=>{
      const lang=b.dataset.rfmLang;localStorage.setItem('rfm_lang',lang);updateHeader(lang);if(window.rfmApplyPageLanguage)window.rfmApplyPageLanguage(lang);window.dispatchEvent(new CustomEvent('rfm:languagechange',{detail:{lang}}));wrap.classList.remove('open');btn?.setAttribute('aria-expanded','false');
    }));
  });
})();
