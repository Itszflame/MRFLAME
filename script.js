// script.js - full-screen red/orange overlay + whoosh (WebAudio) + link interception

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("overlay");
  const overlayText = document.getElementById("overlayText");
  const bgVideo = document.getElementById("bgVideo");

  // Random messages for the overlay
  const messages = [
    "Mission Starting 🚀",
    "Equipping Gear 🔫",
    "Respawning... 💀",
    "Syncing Loadout ⚙️",
    "Booting Shaders ✨",
    "Spawning into match...",
    "Loading Highlights 🎮",
    "Charging Ultimate ⚡",
    "Preparing Stream 🔥",
    "Mission: Acquire Loot 🏆"
  ];

  // elements to intercept (all a tags that open externally or new tab)
  const links = Array.from(document.querySelectorAll('a[href]'));

  // WebAudio whoosh function (short, programmatic)
  function playWhoosh() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;

      // create noise buffer
      const bufferSize = ctx.sampleRate * 0.3; // 0.3s noise
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // pink-ish noise: random * envelope
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // lowpass to shape whoosh
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(2200, now);
      lp.frequency.exponentialRampToValueAtTime(400, now + 0.25);

      // gain envelope
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(1.0, now + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

      // bright click on top
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.18);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.0001, now);
      oscGain.gain.exponentialRampToValueAtTime(0.14, now + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      // connect graph
      noise.connect(lp);
      lp.connect(g);
      osc.connect(oscGain);
      oscGain.connect(g);
      g.connect(ctx.destination);

      noise.start(now);
      osc.start(now);

      // stop sources
      noise.stop(now + 0.35);
      osc.stop(now + 0.30);

      // close context after short delay to conserve resources
      setTimeout(() => { try { ctx.close(); } catch (e) {} }, 700);
    } catch (e) {
      // silently fail if WebAudio not supported
      console.warn("Whoosh sound not available:", e);
    }
  }

  // Intercept clicks
  links.forEach(a => {
    // If link is an internal anchor or has data-no-overlay="true", ignore
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#") || a.dataset.noOverlay === "true") return;

    a.addEventListener("click", (ev) => {
      // allow ctrl/cmd/middle click to open normally
      if (ev.ctrlKey || ev.metaKey || ev.button === 1) return;

      ev.preventDefault();

      // pick random message each click
      const msg = messages[Math.floor(Math.random() * messages.length)];
      overlayText.textContent = msg;

      // show overlay
      overlay.classList.remove("hidden");
      overlay.setAttribute("aria-hidden", "false");

      // play whoosh slightly before navigation for punch
      setTimeout(playWhoosh, 280);

      // small delay so user sees the overlay animation
      const delay = 1800; // ms
      setTimeout(() => {
        // open link in same behavior as target attribute
        const target = a.target || "_self";
        if (target === "_blank") {
          window.open(a.href, "_blank", "noopener");
        } else {
          window.location.href = a.href;
        }
        // hide overlay shortly after (in case navigation blocked)
        setTimeout(() => {
          overlay.classList.add("hidden");
          overlay.setAttribute("aria-hidden", "true");
        }, 900);
      }, delay);
    });
  });

  // Instagram follow & DM: try app deep link first then fallback
  const instaFollow = document.getElementById("instaFollow");
  const instaDM = document.getElementById("instaDM");
  const username = "itszflame";

  function openInstaAppThenWeb(webUrl) {
    // show overlay + message
    overlayText.textContent = "Opening Instagram...";
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    setTimeout(playWhoosh, 220);

    // attempt to open app
    const appUrl = `instagram://user?username=${username}`;
    const start = Date.now();
    window.location = appUrl;

    setTimeout(() => {
      if (Date.now() - start < 1500) {
        window.open(webUrl, "_blank", "noopener");
      }
      setTimeout(() => {
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
      }, 900);
    }, 900);
  }

  if (instaFollow) {
    instaFollow.addEventListener("click", (ev) => {
      ev.preventDefault();
      openInstaAppThenWeb(instaFollow.href);
    });
  }
  if (instaDM) {
    instaDM.addEventListener("click", (ev) => {
      ev.preventDefault();
      openInstaAppThenWeb(instaDM.href);
    });
  }

  // small performance: pause video on small screens (optional)
  try {
    if (bgVideo && window.innerWidth < 520) {
      bgVideo.pause();
      bgVideo.style.display = "none";
    }
  } catch (e) {}

});
// script.js - MR. FLAME shared logic (overlay, whoosh, floating labels helpers, product defaults, page handlers)

(function(){
  /* ========== OVERLAY + WHOOSH ========== */
  // ensure an overlay element exists (pages include it)
  let overlay = document.getElementById('navOverlay') || document.getElementById('overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'navOverlay';
    overlay.className = 'overlay hidden';
    overlay.innerHTML = `<div class="overlay-glow"></div>
      <div class="overlay-content" role="status" aria-live="polite">
        <div class="spinner-orb"><div class="orb-inner"></div></div>
        <div id="overlayText" class="overlay-text">Loading...</div>
      </div>`;
    document.body.appendChild(overlay);
  }
  const overlayText = overlay.querySelector('#overlayText') || overlay.querySelector('.overlay-text');

  // whoosh using WebAudio
  function playWhoosh(){
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.25;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for(let i=0;i<bufferSize;i++){
        data[i] = (Math.random()*2-1) * (1 - i/bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(2200, now); lp.frequency.exponentialRampToValueAtTime(400, now+0.2);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(1.0, now+0.04); g.gain.exponentialRampToValueAtTime(0.0001, now+0.28);
      const osc = ctx.createOscillator(); osc.type='sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(900, now+0.16);
      const oscGain = ctx.createGain(); oscGain.gain.setValueAtTime(0.0001, now); oscGain.gain.exponentialRampToValueAtTime(0.14, now+0.03); oscGain.gain.exponentialRampToValueAtTime(0.0001, now+0.25);
      noise.connect(lp); lp.connect(g);
      osc.connect(oscGain); oscGain.connect(g);
      g.connect(ctx.destination);
      noise.start(now); osc.start(now);
      noise.stop(now+0.32); osc.stop(now+0.30);
      setTimeout(()=>{ try{ ctx.close(); } catch(e){} }, 700);
    } catch(e) {
      // no audio permitted
    }
  }

  // simple overlay API
  const MRFLAME_overlay = {
    show(text){
      overlayText && (overlayText.textContent = text || 'Loading...');
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden','false');
      playWhoosh();
    },
    hide(){
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden','true');
    }
  };
  window.MRFLAME_overlay = MRFLAME_overlay;

  /* ========== FLOATING LABELS POLISH ========== */
  function setupFloatingInputs(root=document){
    const floats = root.querySelectorAll('.floating input, .floating textarea');
    floats.forEach(inp=>{
      // initial state
      if(inp.value) inp.classList.add('filled');
      inp.addEventListener('input', ()=> inp.classList.toggle('filled', !!inp.value));
      inp.addEventListener('focus', ()=> inp.classList.add('filled'));
      inp.addEventListener('blur', ()=> { if(!inp.value) inp.classList.remove('filled'); });
    });
  }
  // run on load
  document.addEventListener('DOMContentLoaded', ()=> setupFloatingInputs(document));

  /* ========== DEFAULT PRODUCTS SHELF ========== */
  (function ensureProducts(){
    const KEY = 'mrflame_products';
    if(!localStorage.getItem(KEY)){
      const defaults = [
        { id:'p1', title:'GameSetupFile', price:'₹999', image:'bgmi.jpg', desc:'Complete game setup package' },
        { id:'p2', title:'My PC', price:'₹59,999', image:'palworld.jpg', desc:'Custom gaming rig' },
        { id:'p3', title:'Mouse Pad', price:'₹299', image:'Gta.jpg', desc:'Large cloth mouse pad' },
        { id:'p4', title:'Flame Hoodie', price:'₹1599', image:'Logo.jpeg', desc:'Comfortable branded hoodie' },
        { id:'p5', title:'Gaming Keyboard Combo', price:'₹3499', image:'palworld.jpg', desc:'Keyboard + wrist rest combo' }
      ];
      localStorage.setItem(KEY, JSON.stringify(defaults));
    }
  })();

  /* ========== BACKGROUND VIDEO TWEAKS ========== */
  // pause/hide video on tiny screens (saves data)
  try {
    const vids = document.querySelectorAll('video.bg-video');
    vids.forEach(v => {
      if(window.innerWidth < 520){
        v.pause();
        v.style.display = 'none';
      }
      v.style.zIndex = '-3';
      v.style.objectFit = 'cover';
    });
  } catch(e){}

  /* ========== OPTIONAL: handle quick page-specific behaviors ========== */
  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page || window.location.pathname;
    // run any known setup functions for page types if needed (they are embedded in each html)
    // no-op here; pages include small scripts to call overlay etc.
  });

  // Expose helpers if needed
  window.MRFLAME_helpers = {
    setupFloatingInputs
  };

})();

