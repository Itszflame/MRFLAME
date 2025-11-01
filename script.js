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
