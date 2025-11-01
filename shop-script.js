// shop-script.js - simulated login, follow-check, product admin using localStorage

(() => {
  // DOM
  const loginBtn = document.getElementById('loginBtn');
  const loginModal = document.getElementById('loginModal');
  const doLogin = document.getElementById('doLogin');
  const cancelLogin = document.getElementById('cancelLogin');
  const loginUser = document.getElementById('loginUser');
  const loginFollow = document.getElementById('loginFollow');
  const logoutBtn = document.getElementById('logoutBtn');

  const welcome = document.getElementById('welcome');
  const shopArea = document.getElementById('shopArea');
  const followPrompt = document.getElementById('followPrompt');
  const addProductBtn = document.getElementById('addProductBtn');
  const productGrid = document.getElementById('productGrid');
  const adminPanel = document.getElementById('adminPanel');
  const messageList = document.getElementById('messageList');

  const productModal = document.getElementById('productModal');
  const prodTitle = document.getElementById('prodTitle');
  const prodPrice = document.getElementById('prodPrice');
  const prodImage = document.getElementById('prodImage');
  const prodDesc = document.getElementById('prodDesc');
  const saveProduct = document.getElementById('saveProduct');
  const cancelProduct = document.getElementById('cancelProduct');
  const productModalTitle = document.getElementById('productModalTitle');

  const dmModal = document.getElementById('dmModal');
  const dmTitle = document.getElementById('dmTitle');
  const dmTarget = document.getElementById('dmTarget');
  const dmText = document.getElementById('dmText');
  const sendDM = document.getElementById('sendDM');
  const cancelDM = document.getElementById('cancelDM');

  // state
  let currentUser = null; // { username, follows }
  let editingProductId = null;

  // storage keys
  const PKEY = 'mrflame_products_v1';
  const MKEY = 'mrflame_messages_v1';
  const UKEY = 'mrflame_current_user';

  // default products (if none in storage)
  const defaultProducts = [
    { id: id(), title: 'MR. FLAME Tee', price: '₹799', image: 'bgmi.jpg', desc: 'Premium cotton tee' },
    { id: id(), title: 'MR. FLAME Hoodie', price: '₹1499', image: 'palworld.jpg', desc: 'Warm & comfy hoodie' },
    { id: id(), title: 'MR. FLAME Mousepad', price: '₹299', image: 'Gta.jpg', desc: 'Large gaming mousepad' },
  ];

  // helpers
  function id() { return 'p_' + Math.random().toString(36).slice(2,9); }
  function saveProducts(list){ localStorage.setItem(PKEY, JSON.stringify(list)); }
  function loadProducts(){ return JSON.parse(localStorage.getItem(PKEY) || 'null') || defaultProducts; }
  function saveMessages(msgs){ localStorage.setItem(MKEY, JSON.stringify(msgs || [])); }
  function loadMessages(){ return JSON.parse(localStorage.getItem(MKEY) || '[]'); }
  function saveUser(user){ localStorage.setItem(UKEY, JSON.stringify(user || null)); }
  function loadUser(){ return JSON.parse(localStorage.getItem(UKEY) || 'null'); }

  // init
  function init(){
    const u = loadUser();
    if (u) {
      currentUser = u;
      showLoggedIn();
    } else {
      showLoggedOut();
    }
    renderProducts();
    renderMessages();
  }

  // render products
  function renderProducts(){
    const products = loadProducts();
    productGrid.innerHTML = '';
    products.forEach(p => {
      const box = document.createElement('div');
      box.className = 'card-prod';
      box.innerHTML = `
        <img src="${p.image}" alt="${escapeHtml(p.title)}">
        <div class="prod-title">${escapeHtml(p.title)}</div>
        <div class="prod-price">${escapeHtml(p.price)}</div>
        <div class="muted" style="font-size:13px;color:rgba(255,255,255,0.75)">${escapeHtml(p.desc || '')}</div>
        <div class="prod-actions">
          <div>
            <button class="small-btn buy-btn" data-id="${p.id}">Buy Now</button>
            <button class="small-btn dm-btn" data-id="${p.id}">DM</button>
          </div>
          <div>
            <button class="small-btn edit-btn hidden" data-id="${p.id}">Edit</button>
            <button class="small-btn delete-btn hidden" data-id="${p.id}">Delete</button>
          </div>
        </div>
      `;
      productGrid.appendChild(box);
    });

    // attach handlers
    productGrid.querySelectorAll('.buy-btn').forEach(b => b.addEventListener('click', onBuy));
    productGrid.querySelectorAll('.dm-btn').forEach(b => b.addEventListener('click', onDMClick));
    productGrid.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', onEditProduct));
    productGrid.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', onDeleteProduct));
    updateAdminControls();
  }

  function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // update display according to login state
  function showLoggedIn(){
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    welcome.classList.add('hidden');

    if (currentUser.follows) {
      shopArea.classList.remove('hidden');
      followPrompt.classList.add('hidden');
    } else {
      shopArea.classList.add('hidden');
      followPrompt.classList.remove('hidden');
    }

    // if admin
    if (currentUser.username && currentUser.username.toLowerCase() === 'itszflame') {
      addProductBtn.classList.remove('hidden');
      adminPanel.classList.remove('hidden');
      // show edit/delete buttons
      document.querySelectorAll('.edit-btn, .delete-btn').forEach(el => el.classList.remove('hidden'));
    } else {
      addProductBtn.classList.add('hidden');
      adminPanel.classList.add('hidden');
      document.querySelectorAll('.edit-btn, .delete-btn').forEach(el => el.classList.add('hidden'));
    }
  }

  function showLoggedOut(){
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    welcome.classList.remove('hidden');
    shopArea.classList.add('hidden');
    followPrompt.classList.add('hidden');
    addProductBtn.classList.add('hidden');
    adminPanel.classList.add('hidden');
  }

  // render messages
  function renderMessages(){
    const msgs = loadMessages();
    messageList.innerHTML = '';
    if (msgs.length === 0) {
      messageList.innerHTML = '<div class="muted">No visitor messages yet.</div>';
      return;
    }
    msgs.forEach(m => {
      const el = document.createElement('div');
      el.className = 'message-item';
      el.innerHTML = `<div><strong>${escapeHtml(m.from)}</strong><div style="font-size:13px;color:rgba(255,255,255,0.75)">${escapeHtml(m.text)}</div></div>
                      <div><button class="small-btn msg-dm-btn" data-id="${m.id}">DM</button></div>`;
      messageList.appendChild(el);
    });
    messageList.querySelectorAll('.msg-dm-btn').forEach(b => b.addEventListener('click', onAdminDM));
  }

  // login flow (simulated)
  loginBtn.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
    loginUser.value = '';
    loginFollow.checked = false;
  });
  cancelLogin.addEventListener('click', () => loginModal.classList.add('hidden'));

  doLogin.addEventListener('click', () => {
    const user = (loginUser.value || '').trim();
    const follows = !!loginFollow.checked;
    if (!user) {
      alert('Enter a username to continue (simulation)');
      return;
    }
    currentUser = { username: user, follows: follows };
    saveUser(currentUser);
    loginModal.classList.add('hidden');
    showLoggedIn();
    renderProducts();
    renderMessages();
  });

  logoutBtn.addEventListener('click', () => {
    currentUser = null;
    saveUser(null);
    showLoggedOut();
  });

  // admin: open add product modal
  addProductBtn.addEventListener('click', () => {
    editingProductId = null;
    productModalTitle.textContent = 'Add Product';
    prodTitle.value = prodPrice.value = prodImage.value = prodDesc.value = '';
    productModal.classList.remove('hidden');
  });
  cancelProduct.addEventListener('click', () => productModal.classList.add('hidden'));

  saveProduct.addEventListener('click', () => {
    const title = (prodTitle.value || '').trim();
    const price = (prodPrice.value || '').trim();
    const image = (prodImage.value || '').trim() || 'Gta.jpg';
    const desc = (prodDesc.value || '').trim();
    if (!title || !price) { alert('Title and price are required'); return; }

    const products = loadProducts();
    if (editingProductId) {
      // update
      const idx = products.findIndex(p=>p.id===editingProductId);
      if (idx >= 0) {
        products[idx].title = title;
        products[idx].price = price;
        products[idx].image = image;
        products[idx].desc = desc;
      }
    } else {
      products.unshift({ id: id(), title, price, image, desc });
    }
    saveProducts(products);
    productModal.classList.add('hidden');
    renderProducts();
  });

  // edit & delete
  function onEditProduct(ev){
    const pid = ev.currentTarget.dataset.id;
    const products = loadProducts();
    const p = products.find(x=>x.id===pid);
    if (!p) return;
    editingProductId = p.id;
    productModalTitle.textContent = 'Edit Product';
    prodTitle.value = p.title;
    prodPrice.value = p.price;
    prodImage.value = p.image;
    prodDesc.value = p.desc;
    productModal.classList.remove('hidden');
  }
  function onDeleteProduct(ev){
    if (!confirm('Delete product?')) return;
    const pid = ev.currentTarget.dataset.id;
    let products = loadProducts();
    products = products.filter(p=>p.id!==pid);
    saveProducts(products);
    renderProducts();
  }

  // buy
  function onBuy(ev){
    if (!currentUser) {
      alert('Please login to buy.');
      return;
    }
    if (!currentUser.follows) {
      alert('You must follow @itszflame to buy.');
      return;
    }
    const pid = ev.currentTarget.dataset.id;
    const products = loadProducts();
    const p = products.find(x=>x.id===pid);
    alert(`Thanks! This is a simulated "Buy Now" for ${p.title} — integrate payment later.`);
  }

  // DM (user clicking DM on product) -> opens dm modal and saves message
  function onDMClick(ev){
    if (!currentUser) {
      alert('Please login to DM.');
      return;
    }
    const pid = ev.currentTarget.dataset.id;
    const products = loadProducts();
    const p = products.find(x=>x.id===pid);
    // show DM modal targeted at admin
    dmTitle.textContent = `Message about: ${p.title}`;
    dmTarget.textContent = `To: @itszflame (admin)`;
    dmText.value = '';
    dmModal.classList.remove('hidden');

    // save temporary dataset
    dmModal.dataset.targetPid = pid;
  }

  cancelDM.addEventListener('click', ()=> dmModal.classList.add('hidden'));

  sendDM.addEventListener('click', () => {
    const text = (dmText.value || '').trim();
    if (!text) { alert('Write a message'); return; }
    const msgs = loadMessages();
    const msg = { id: id(), from: currentUser.username, text, pid: dmModal.dataset.targetPid, at: Date.now() };
    msgs.unshift(msg);
    saveMessages(msgs);
    dmModal.classList.add('hidden');
    renderMessages();
    alert('Message sent (simulated). Admin can reply via admin panel.');
  });

  // Admin DM to visitor (from messages list)
  function onAdminDM(ev){
    const mid = ev.currentTarget.dataset.id;
    const msgs = loadMessages();
    const m = msgs.find(x=>x.id===mid);
    if (!m) return;
    dmTitle.textContent = `Reply to ${m.from}`;
    dmTarget.textContent = `To: ${m.from}`;
    dmText.value = '';
    dmModal.classList.remove('hidden');
    dmModal.dataset.replyTo = m.from;
  }

  // When admin sends DM from admin panel -> just store as admin->visitor message
  sendDM.addEventListener('click', () => {
    // this handler already used above; but if admin replying:
    if (!dmModal.dataset.replyTo) return;
    const to = dmModal.dataset.replyTo;
    const text = (dmText.value || '').trim();
    if (!text) { alert('Write a message'); return; }
    // store a simulated reply message in messages (mark as from admin)
    const msgs = loadMessages();
    const msg = { id: id(), from: 'admin(itszflame)', to, text, at: Date.now() };
    msgs.unshift(msg);
    saveMessages(msgs);
    dmModal.classList.add('hidden');
    dmModal.dataset.replyTo = '';
    renderMessages();
    alert('Reply saved (simulated).');
  });

  // helper: update admin-only controls visibility
  function updateAdminControls(){
    if (currentUser && currentUser.username && currentUser.username.toLowerCase()==='itszflame') {
      document.querySelectorAll('.edit-btn, .delete-btn').forEach(el => el.classList.remove('hidden'));
    } else {
      document.querySelectorAll('.edit-btn, .delete-btn').forEach(el => el.classList.add('hidden'));
    }
  }

  // utility click delegation for edit/delete because they may appear after render
  productGrid.addEventListener('click', (ev) => {
    const ed = ev.target.closest('.edit-btn');
    const del = ev.target.closest('.delete-btn');
    if (ed) onEditProduct({ currentTarget: ed });
    if (del) onDeleteProduct({ currentTarget: del });
  });

  // init app
  init();

})();
