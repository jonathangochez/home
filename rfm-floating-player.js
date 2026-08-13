(function(){
  const WORKER_BASE='https://nowplaying.mygochez-website.workers.dev/nowplaying';
  const REFRESH_MS=12000;
  const LOGO='assets/rfm-logo.png';
  const STATIONS=[
    {id:'awesome80s',name:'Awesome 80s',stream:'https://listen.181fm.com/181-awesome80s_128k.mp3',group:'80s'},
    {id:'greatoldies',name:'Classic Hits 80s',stream:'https://listen.181fm.com/181-greatoldies_128k.mp3',group:'80s'},
    {id:'star90s',name:'Classic Hits 90s',stream:'https://listen.181fm.com/181-star90s_128k.mp3',group:'90s'},
    {id:'90sdance',name:'90s Dance',stream:'https://listen.181fm.com/181-90sdance_128k.mp3',group:'90s'},
    {id:'oldschool',name:'HipHop Oldies',stream:'https://listen.181fm.com/181-oldschool_128k.mp3',group:'Hip-Hop'},
    {id:'beats',name:'The Vibe Beats',stream:'https://listen.181fm.com/181-vibe_128k.mp3',group:'Modern'},
    {id:'hotters',name:'Power Hits',stream:'https://listen.181fm.com/181-power_128k.mp3',group:'Modern'},
    {id:'power2',name:'PowerFM 2',stream:'https://listen.181fm.com/181-powerexplicit_128k.mp3',group:'Modern'},
    {id:'RFMLCOM',name:'RhythmFM Latino',stream:'https://stream.zeno.fm/eq0taliilt5tv',group:'RFM',noMeta:true},
    {id:'kissfmfr',name:'KISS FM France 🇫🇷',stream:'https://kissfm.ice.infomaniak.ch/kissfm-128.mp3',group:'France'}
  ];

  const LANG={
    es:{brand:'RhythmFM Latino',live:'EN VIVO',now:'AHORA SUENA',loading:'Cargando canción…',unavailable:'Now Playing no disponible',retry:'Reintentando…',station:'Emisora',open:'Abrir On-Air',refresh:'Actualizar',play:'Reproducir',pause:'Pausar'},
    en:{brand:'RhythmFM Latino',live:'LIVE',now:'NOW PLAYING',loading:'Loading track…',unavailable:'Now Playing unavailable',retry:'Retrying…',station:'Station',open:'Open On-Air',refresh:'Refresh',play:'Play',pause:'Pause'},
    pt:{brand:'RhythmFM Latino',live:'AO VIVO',now:'TOCANDO AGORA',loading:'Carregando música…',unavailable:'Now Playing indisponível',retry:'Tentando novamente…',station:'Estação',open:'Abrir On-Air',refresh:'Atualizar',play:'Reproduzir',pause:'Pausar'}
  };

  function getLang(){return window.rfmGetLanguage?window.rfmGetLanguage():(localStorage.getItem('rfm_lang')||'es');}
  function pageIsOnAir(){return /(^|\/)on-air\.html$/.test(location.pathname.toLowerCase());}
  function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}

  function init(){
    if(document.querySelector('.rfm-float-player')) return;
    const existing=document.getElementById('player');
    const audio=existing || Object.assign(document.createElement('audio'),{autoplay:true,playsInline:true});
    if(!existing){audio.className='rfm-float-hidden-audio';audio.setAttribute('aria-hidden','true');audio.crossOrigin='anonymous';document.body.appendChild(audio);}

    const dock=document.createElement('div');
    dock.className='rfm-float-player';
    const collapsed=localStorage.getItem('rfm_float_collapsed')==='1';
    if(collapsed) dock.classList.add('is-collapsed');
    dock.innerHTML=`
      <div class="rfm-float-main">
        <div class="rfm-float-brand"><img src="${esc(LOGO)}" alt="RFM"><div class="rfm-float-brand-copy"><strong>RhythmFM Latino</strong><small>${LANG[getLang()]?.live||'EN VIVO'}</small></div></div>
        <div class="rfm-float-station" id="rfmFloatStation">
          <button type="button" class="rfm-float-station-btn" id="rfmFloatStationBtn"><span class="rfm-float-station-label"><span class="rfm-float-dot"></span><span class="rfm-float-station-name" id="rfmFloatStationName">RhythmFM Latino</span></span><span class="rfm-float-chevron">▴</span></button>
          <div class="rfm-float-menu" id="rfmFloatStationMenu"></div>
        </div>
        <div class="rfm-float-now">
          <div class="rfm-float-kicker" id="rfmFloatKicker">${LANG[getLang()]?.now||'AHORA SUENA'}</div>
          <div class="rfm-float-song" id="rfmFloatSong">${LANG[getLang()]?.loading||'Cargando canción…'}</div>
          <div class="rfm-float-artist" id="rfmFloatArtist"></div>
          <div class="rfm-float-status" id="rfmFloatStatus"></div>
        </div>
        <div class="rfm-float-controls">
          <div class="rfm-float-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <div class="rfm-float-vol"><span aria-hidden="true">🔊</span><input id="rfmFloatVol" type="range" min="0" max="100" value="80" aria-label="Volume"></div>
          <button type="button" class="rfm-float-play" id="rfmFloatPlay" aria-label="Play">▶</button>
          <button type="button" class="rfm-float-open" id="rfmFloatOpen" aria-label="Open On-Air">↗</button>
          <button type="button" class="rfm-float-refresh" id="rfmFloatRefresh" aria-label="Refresh">↻</button>
          <button type="button" class="rfm-float-collapse" id="rfmFloatCollapse" aria-label="Minimizar">−</button>
        </div>
      </div>
      <button type="button" class="rfm-float-mini" id="rfmFloatMini" aria-label="Mostrar reproductor" title="Mostrar reproductor">
        <span class="rfm-mini-ring"></span>
        <span class="rfm-mini-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="rfm-mini-dot"></span>
      </button>`;
    document.body.appendChild(dock);

    const stationWrap=dock.querySelector('#rfmFloatStation');
    const stationBtn=dock.querySelector('#rfmFloatStationBtn');
    const stationMenu=dock.querySelector('#rfmFloatStationMenu');
    const stationNameEl=dock.querySelector('#rfmFloatStationName');
    const songEl=dock.querySelector('#rfmFloatSong');
    const artistEl=dock.querySelector('#rfmFloatArtist');
    const statusEl=dock.querySelector('#rfmFloatStatus');
    const kickerEl=dock.querySelector('#rfmFloatKicker');
    const playBtn=dock.querySelector('#rfmFloatPlay');
    const vol=dock.querySelector('#rfmFloatVol');
    const openBtn=dock.querySelector('#rfmFloatOpen');
    const refreshBtn=dock.querySelector('#rfmFloatRefresh');
    const collapseBtn=dock.querySelector('#rfmFloatCollapse');
    const miniBtn=dock.querySelector('#rfmFloatMini');
    let currentId=localStorage.getItem('rfm_station')||'RFMLCOM';
    if(!STATIONS.some(s=>s.id===currentId)) currentId='RFMLCOM';
    let lastRaw='';

    const grouped=STATIONS.reduce((acc,s)=>(acc[s.group]??=[]).push(s)&&acc,{});
    stationMenu.innerHTML=Object.entries(grouped).map(([group,items])=>`<div class="rfm-float-group">${esc(group)}</div>${items.map(s=>`<button class="rfm-float-option" data-id="${esc(s.id)}">${esc(s.name)}</button>`).join('')}`).join('');

    function current(){return STATIONS.find(s=>s.id===currentId)||STATIONS[0];}
    function setPaused(paused){dock.classList.toggle('is-paused',paused);playBtn.textContent=paused?'▶':'Ⅱ';playBtn.setAttribute('aria-label',paused?LANG[getLang()].play:LANG[getLang()].pause);}
    function updateStationVisual(){stationNameEl.textContent=current().name;}
    function showStatus(text){statusEl.textContent=text||'';}
    function setCollapsed(collapsed){
      dock.classList.toggle('is-collapsed', collapsed);
      localStorage.setItem('rfm_float_collapsed', collapsed?'1':'0');
      collapseBtn.setAttribute('aria-label', collapsed ? 'Mostrar reproductor' : 'Minimizar');
      miniBtn.setAttribute('aria-label', collapsed ? 'Mostrar reproductor' : 'Reproductor minimizado');
    }

    async function startStation(id){
      currentId=id;localStorage.setItem('rfm_station',id);
      const s=current(); updateStationVisual();
      stationMenu.querySelectorAll('.rfm-float-option').forEach(b=>b.classList.toggle('active',b.dataset.id===id));
      songEl.textContent=LANG[getLang()].loading;artistEl.textContent='';showStatus('');
      if(existing){
        const mainSel=document.getElementById('stationSel');
        if(mainSel){mainSel.value=id;mainSel.dispatchEvent(new Event('change',{bubbles:true}));}
      }else{
        audio.src=s.stream; audio.load(); try{await audio.play();}catch(e){}
      }
      try{ if(audio.paused){} }catch(e){}
      await fetchNP();
      syncPlayState();
    }

    async function fetchNP(){
      const s=current();
      if(s.noMeta){songEl.textContent=LANG[getLang()].unavailable;artistEl.textContent='';showStatus('RFM / Zeno.fm');return;}
      showStatus(LANG[getLang()].retry);
      try{
        const r=await fetch(WORKER_BASE+'?stream='+encodeURIComponent(s.stream),{cache:'no-store'});
        const data=await r.json();
        if(!data.ok){songEl.textContent=LANG[getLang()].unavailable;artistEl.textContent='';showStatus(LANG[getLang()].retry);return;}
        const raw=(data.raw||'').trim(), artist=(data.artist||'').trim(), title=(data.title||'').trim();
        songEl.textContent=title||raw||'—'; artistEl.textContent=artist||''; showStatus(s.name);
        if(raw && raw!==lastRaw){lastRaw=raw;songEl.style.textShadow='0 0 16px rgba(255,255,255,.18),0 0 24px rgba(255,42,163,.45)';setTimeout(()=>songEl.style.textShadow='none',900);}
      }catch(e){songEl.textContent=LANG[getLang()].unavailable;artistEl.textContent='';showStatus(LANG[getLang()].retry);}
    }
    function syncPlayState(){setPaused(audio.paused);}
    function applyLang(lang){const l=LANG[lang]||LANG.es;kickerEl.textContent=l.now;playBtn.setAttribute('aria-label',audio.paused?l.play:l.pause);dock.querySelector('.rfm-float-brand-copy small').textContent=l.live;openBtn.setAttribute('aria-label',l.open);refreshBtn.setAttribute('aria-label',l.refresh);if(!artistEl.textContent || /Cargando|Loading|Carregando/.test(songEl.textContent)) songEl.textContent=l.loading;}

    stationBtn.addEventListener('click',e=>{e.stopPropagation();stationWrap.classList.toggle('open');});
    document.addEventListener('click',e=>{if(!stationWrap.contains(e.target)) stationWrap.classList.remove('open');});
    stationMenu.addEventListener('click',e=>{const b=e.target.closest('.rfm-float-option');if(!b)return;stationWrap.classList.remove('open');startStation(b.dataset.id);});
    playBtn.addEventListener('click',async()=>{try{if(audio.paused){if(pageIsOnAir() && window.rfmOnAirPlay){window.rfmOnAirPlay();}else await audio.play();}else audio.pause();}catch(e){} syncPlayState();});
    refreshBtn.addEventListener('click',fetchNP);
    collapseBtn.addEventListener('click',()=>setCollapsed(true));
    miniBtn.addEventListener('click',()=>setCollapsed(false));
    openBtn.addEventListener('click',()=>location.href='on-air.html');
    vol.value=localStorage.getItem('rfm_vol')||'80';
    vol.addEventListener('input',()=>{audio.volume=Number(vol.value)/100;localStorage.setItem('rfm_vol',vol.value);});
    audio.volume=Number(vol.value)/100;
    audio.addEventListener('play',syncPlayState);audio.addEventListener('pause',syncPlayState);

    window.addEventListener('rfm:languagechange',e=>applyLang(e.detail?.lang||getLang()));
    window.addEventListener('storage',e=>{if(e.key==='rfm_lang')applyLang(e.newValue||'es');});

    updateStationVisual();
    stationMenu.querySelectorAll('.rfm-float-option').forEach(b=>b.classList.toggle('active',b.dataset.id===currentId));
    applyLang(getLang());
    setCollapsed(localStorage.getItem('rfm_float_collapsed')==='1');
    startStation(currentId);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
