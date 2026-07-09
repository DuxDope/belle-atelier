// Belle·Atelier v4 — galería 3 fotos por tono
let products=[], settings={whatsapp:'',logo_url:''}, activeFilter='todos';
let selectedEmoji='💄', authToken=localStorage.getItem('ba_token')||'';
let variantRows=[], logoUrl='', selectedVariant=null, currentProduct=null;
let editingProductId=null, variantIdCounter=0;

const fmt = n => 'CLP '+Number(n).toLocaleString('es-CL');
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)}
function isAdmin(){return!!authToken}
function updateNavForAuth(){
  document.getElementById('btn-admin-nav').style.display=isAdmin()?'':'none';
  document.getElementById('btn-login-nav').style.display=isAdmin()?'none':'';
  document.getElementById('btn-logout-nav').style.display=isAdmin()?'':'none';
}

// ── Settings ──────────────────────────────────
async function fetchSettings(){
  try{const res=await fetch('/api/settings');if(res.ok){settings=await res.json();applyLogo();if(document.getElementById('s-whatsapp'))document.getElementById('s-whatsapp').value=settings.whatsapp||''}}catch(e){}
}
function applyLogo(){
  const img=document.getElementById('logo-img'),text=document.getElementById('brand-text');
  if(settings.logo_url){img.src=settings.logo_url;img.style.display='';text.style.display='none'}
  else{img.style.display='none';text.style.display=''}
}

// ── Productos ─────────────────────────────────
async function fetchProducts(){
  showLoading(true);
  try{const res=await fetch('/api/products');if(!res.ok)throw new Error();products=await res.json();renderGrid()}
  catch{showToast('⚠ No se pudo cargar el catálogo')}
  finally{showLoading(false)}
}
function showLoading(on){
  document.getElementById('loading').style.display=on?'grid':'none';
  document.getElementById('product-grid').style.display=on?'none':'grid';
}
function renderGrid(){
  const grid=document.getElementById('product-grid'),empty=document.getElementById('empty-state');
  let filtered=activeFilter==='todos'?products:activeFilter==='nuevos'?products.filter(p=>p.badge==='nuevo'):products.filter(p=>p.cat===activeFilter);
  document.getElementById('catalog-count').textContent=filtered.length;
  if(!filtered.length){grid.innerHTML='';empty.style.display='block';return}
  empty.style.display='none';
  grid.innerHTML=filtered.map(p=>{
    const variants=p.variants||[];
    const prices=variants.map(v=>v.price).filter(Boolean);
    const minP=prices.length?Math.min(...prices):0,maxP=prices.length?Math.max(...prices):0;
    const priceStr=!prices.length?'—':minP===maxP?fmt(minP):`${fmt(minP)} – ${fmt(maxP)}`;
    const firstImg=variants.find(v=>v.image_url)?.image_url||p.image_url||'';
    const imgHtml=firstImg?`<img src="${esc(firstImg)}" alt="${esc(p.name)}" loading="lazy">`:`<span class="emoji-product">${p.emoji||'💄'}</span>`;
    return`<div class="product-card" onclick="openModal(${p.id})" role="button" tabindex="0" onkeydown="if(event.key==='Enter')openModal(${p.id})">
      <div class="card-img">${imgHtml}${p.badge?`<span class="card-badge ${p.badge}">${p.badge.toUpperCase()}</span>`:''}</div>
      <div class="card-body">
        <div class="card-brand">${esc(p.brand)}</div>
        <div class="card-name">${esc(p.name)}</div>
        ${variants.length>1?`<div class="card-variants-count">${variants.length} tonos disponibles</div>`:''}
        <div class="card-desc">${esc((p.desc||p.description||'').substring(0,72))}…</div>
        <div class="card-footer"><div class="card-price">${priceStr}</div><span class="card-tag">${esc(p.cat)}</span></div>
      </div></div>`;
  }).join('');
}
function filterCat(cat){
  activeFilter=cat;
  document.querySelectorAll('.nav-links a').forEach(a=>a.classList.toggle('active',a.dataset.cat===cat));
  document.querySelectorAll('.filter-btn').forEach(b=>{
    const t=b.textContent.toLowerCase().replace(/[^a-záéíóúüñ]/gi,'');
    b.classList.toggle('active',t===cat||(cat==='todos'&&t==='todos')||(cat==='nuevos'&&t.includes('nuevo')));
  });
  renderGrid();
}

// ── Modal producto ────────────────────────────
function openModal(id){
  currentProduct=products.find(x=>x.id===id);selectedVariant=null;
  if(!currentProduct)return;
  const p=currentProduct;
  document.getElementById('modal-brand').textContent=p.brand.toUpperCase();
  document.getElementById('modal-name').textContent=p.name;
  document.getElementById('modal-desc').textContent=p.desc||p.description||'';
  document.getElementById('modal-note').textContent=p.info||'';
  const tags=[p.cat,p.badge].filter(Boolean);
  document.getElementById('modal-tags').innerHTML=tags.map(t=>`<span class="modal-info-tag">${esc(t)}</span>`).join('');
  const variants=p.variants||[];
  const varList=document.getElementById('variants-list');
  document.getElementById('variant-detail').style.display='none';
  if(variants.length){
    varList.innerHTML=variants.map(v=>`
      <button class="variant-chip ${v.stock===0?'agotado':''}" onclick="selectVariant(${v.id})" id="vc-${v.id}">
        ${v.image_url?`<img class="chip-img" src="${esc(v.image_url)}" alt="${esc(v.tone)}">`:''}
        ${esc(v.tone)}${v.stock===0?' (Agotado)':''}
      </button>`).join('');
    const first=variants.find(v=>v.stock>0)||variants[0];
    if(first)selectVariant(first.id);
  }else{varList.innerHTML='';setGallery([],p.emoji||'💄')}
  document.getElementById('btn-wsp').style.display=settings.whatsapp?'':'none';
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow='hidden';
}

function selectVariant(variantId){
  const p=currentProduct;if(!p)return;
  selectedVariant=(p.variants||[]).find(v=>v.id===variantId);if(!selectedVariant)return;
  document.querySelectorAll('.variant-chip').forEach(c=>c.classList.remove('active'));
  document.getElementById('vc-'+variantId)?.classList.add('active');
  // Construir galería con las fotos de este tono
  const imgs=[selectedVariant.image_url,selectedVariant.image_url2,selectedVariant.image_url3].filter(Boolean);
  setGallery(imgs,p.emoji||'💄');
  const detail=document.getElementById('variant-detail');detail.style.display='flex';
  document.getElementById('variant-price').textContent=fmt(selectedVariant.price);
  const stockEl=document.getElementById('variant-stock');
  if(selectedVariant.stock===0){stockEl.textContent='Agotado';stockEl.className='variant-stock agotado'}
  else if(selectedVariant.stock<=5){stockEl.textContent='¡Últimas unidades!';stockEl.className='variant-stock bajo'}
  else{stockEl.textContent='';stockEl.className='variant-stock'}
  document.getElementById('btn-wsp').disabled=selectedVariant.stock===0;
}

function setGallery(imgs,emoji){
  const mainEl=document.getElementById('gallery-main');
  const thumbsEl=document.getElementById('gallery-thumbs');
  if(!imgs.length){
    mainEl.innerHTML=`<span id="modal-emoji">${emoji}</span>`;
    thumbsEl.innerHTML='';return;
  }
  // Mostrar primera imagen
  mainEl.innerHTML=`<img id="modal-photo" src="${esc(imgs[0])}" alt="">`;
  // Miniaturas solo si hay más de 1
  if(imgs.length>1){
    thumbsEl.innerHTML=imgs.map((url,i)=>`
      <div class="gallery-thumb ${i===0?'active':''}" onclick="switchPhoto('${esc(url)}',this)">
        <img src="${esc(url)}" alt="foto ${i+1}">
      </div>`).join('');
  }else{thumbsEl.innerHTML=''}
}

function switchPhoto(url,thumbEl){
  document.getElementById('modal-photo')?.setAttribute('src',url);
  document.querySelectorAll('.gallery-thumb').forEach(t=>t.classList.remove('active'));
  thumbEl.classList.add('active');
}

function openWsp(){
  if(!currentProduct||!selectedVariant||!settings.whatsapp)return;
  const msg=encodeURIComponent(`Hola! Me interesa:\n*${currentProduct.name}*\nTono: ${selectedVariant.tone}\nPrecio: ${fmt(selectedVariant.price)}\n\n¿Está disponible?`);
  window.open(`https://wa.me/${settings.whatsapp}?text=${msg}`,'_blank');
}
function closeModal(){document.getElementById('modal').classList.remove('open');document.body.style.overflow='';currentProduct=null;selectedVariant=null}

// ── Login ─────────────────────────────────────
function openLogin(){document.getElementById('login-modal').classList.add('open');document.body.style.overflow='hidden';document.getElementById('login-error').style.display='none';setTimeout(()=>document.getElementById('l-email').focus(),100)}
function closeLogin(){document.getElementById('login-modal').classList.remove('open');document.body.style.overflow=''}
async function doLogin(){
  const email=document.getElementById('l-email').value.trim(),pass=document.getElementById('l-pass').value;
  const errEl=document.getElementById('login-error'),btn=document.getElementById('btn-login-submit');
  if(!email||!pass){errEl.textContent='Completa email y contraseña';errEl.style.display='block';return}
  btn.disabled=true;btn.textContent='Ingresando...';
  try{
    const res=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});
    const data=await res.json();
    if(!res.ok){errEl.textContent=data.error||'Credenciales incorrectas';errEl.style.display='block';return}
    authToken=data.token;localStorage.setItem('ba_token',authToken);closeLogin();updateNavForAuth();showToast('✓ Sesión iniciada');
    document.getElementById('l-email').value='';document.getElementById('l-pass').value='';
  }catch{errEl.textContent='Error de conexión';errEl.style.display='block'}
  finally{btn.disabled=false;btn.textContent='Ingresar'}
}
function logout(){authToken='';localStorage.removeItem('ba_token');updateNavForAuth();showToast('Sesión cerrada')}

// ── Admin panel ───────────────────────────────
function openAdmin(){
  if(!isAdmin()){openLogin();return}
  document.getElementById('admin-overlay').classList.add('open');document.body.style.overflow='hidden';
  renderAdminList();if(!variantRows.length)addVariantRow();
  fetchSettings().then(()=>{
    document.getElementById('s-whatsapp').value=settings.whatsapp||'';
    if(settings.logo_url){document.getElementById('logo-preview-img').src=settings.logo_url;document.getElementById('logo-placeholder').style.display='none';document.getElementById('logo-preview').style.display='block';logoUrl=settings.logo_url}
  });
}
function closeAdmin(){document.getElementById('admin-overlay').classList.remove('open');document.body.style.overflow=''}
function showTab(tab){
  document.getElementById('tab-productos').style.display=tab==='productos'?'':'none';
  document.getElementById('tab-ajustes').style.display=tab==='ajustes'?'':'none';
  document.querySelectorAll('.admin-tab').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase().includes(tab)));
}

// ── Variantes admin ───────────────────────────
function addVariantRow(existing){
  const localId=++variantIdCounter;
  const d=existing||{id:null,tone:'',price:'',stock:'',image_url:'',image_url2:'',image_url3:''};
  variantRows.push({localId,dbId:d.id,tone:d.tone,price:d.price,stock:d.stock,image_url:d.image_url||'',image_url2:d.image_url2||'',image_url3:d.image_url3||''});
  const container=document.getElementById('variants-rows');
  const row=document.createElement('div');
  row.className='variant-row';row.id='vrow-'+localId;
  row.innerHTML=`
    <div class="variant-row-top">
      <div><label>Tono / nombre</label><input type="text" value="${esc(d.tone)}" placeholder="Ej: Rojo cereza" onchange="updateVariantRow(${localId},'tone',this.value)"></div>
      <div><label>Precio CLP</label><input type="number" value="${d.price||''}" placeholder="12990" onchange="updateVariantRow(${localId},'price',this.value)"></div>
      <div><label>Stock</label><input type="number" value="${d.stock!==null&&d.stock!==undefined?d.stock:''}" placeholder="10" onchange="updateVariantRow(${localId},'stock',this.value)"></div>
      <button class="btn-remove-row" onclick="removeVariantRow(${localId})">×</button>
    </div>
    <div class="variant-photos-label">Fotos del tono (hasta 3)</div>
    <div class="variant-row-photos">
      ${[1,2,3].map(n=>{
        const field=n===1?'image_url':n===2?'image_url2':'image_url3';
        const val=d[field]||'';
        return`<div class="photo-slot">
          <div class="photo-preview-wrap ${val?'has-photo':''}" id="pwrap-${localId}-${n}" onclick="triggerPhotoUpload(${localId},${n})">
            ${val?`<img src="${esc(val)}" alt="foto ${n}" id="pimg-${localId}-${n}">`:`<span class="upload-icon-sm">📷</span>`}
            <button class="btn-remove-photo" onclick="removeVariantPhoto(event,${localId},${n})">×</button>
          </div>
          <input type="file" id="pfile-${localId}-${n}" accept="image/*" style="display:none" onchange="uploadVariantPhoto(${localId},${n},this)">
          <span class="photo-slot-label">Foto ${n}</span>
        </div>`;
      }).join('')}
    </div>`;
  container.appendChild(row);
}

function triggerPhotoUpload(localId,n){document.getElementById(`pfile-${localId}-${n}`).click()}

async function uploadVariantPhoto(localId,n,input){
  const file=input.files[0];if(!file)return;
  const wrap=document.getElementById(`pwrap-${localId}-${n}`);
  wrap.innerHTML='<span class="upload-icon-sm">⏳</span>';
  try{
    const url=await uploadToCloudinary(file);
    const field=n===1?'image_url':n===2?'image_url2':'image_url3';
    updateVariantRow(localId,field,url);
    wrap.innerHTML=`<img src="${esc(url)}" alt="foto ${n}" id="pimg-${localId}-${n}"><button class="btn-remove-photo" onclick="removeVariantPhoto(event,${localId},${n})">×</button>`;
    wrap.classList.add('has-photo');
  }catch(e){showToast('⚠ Error subiendo foto');wrap.innerHTML='<span class="upload-icon-sm">📷</span>'}
}

function removeVariantPhoto(e,localId,n){
  e.stopPropagation();
  const field=n===1?'image_url':n===2?'image_url2':'image_url3';
  updateVariantRow(localId,field,'');
  const wrap=document.getElementById(`pwrap-${localId}-${n}`);
  wrap.innerHTML='<span class="upload-icon-sm">📷</span>';
  wrap.classList.remove('has-photo');
  document.getElementById(`pfile-${localId}-${n}`).value='';
}

function updateVariantRow(localId,field,value){const row=variantRows.find(r=>r.localId===localId);if(row)row[field]=value}
function removeVariantRow(localId){
  if(variantRows.length<=1){showToast('Debe haber al menos un tono');return}
  variantRows=variantRows.filter(r=>r.localId!==localId);
  document.getElementById('vrow-'+localId)?.remove();
}

async function uploadToCloudinary(file){
  const signRes=await fetch('/api/upload-sign',{method:'POST',headers:{'Authorization':'Bearer '+authToken}});
  if(!signRes.ok)throw new Error('No se pudo obtener firma');
  const{signature,timestamp,apiKey,cloudName,folder}=await signRes.json();
  const fd=new FormData();fd.append('file',file);fd.append('api_key',apiKey);fd.append('timestamp',timestamp);fd.append('signature',signature);fd.append('folder',folder);
  const upRes=await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,{method:'POST',body:fd});
  if(!upRes.ok)throw new Error('Error Cloudinary');
  return(await upRes.json()).secure_url;
}

// ── Crear / Editar ────────────────────────────
function submitProduct(){editingProductId?updateProduct():addProduct()}

async function addProduct(){
  const name=document.getElementById('f-name').value.trim(),brand=document.getElementById('f-brand').value.trim();
  const cat=document.getElementById('f-cat').value,desc=document.getElementById('f-desc').value.trim();
  const info=document.getElementById('f-info').value.trim(),badge=document.getElementById('f-badge').value;
  if(!name||!brand||!desc){showToast('⚠ Completa nombre, marca y descripción');return}
  const valid=variantRows.filter(v=>v.tone&&v.price);
  if(!valid.length){showToast('⚠ Agrega al menos un tono con nombre y precio');return}
  const btn=document.getElementById('btn-submit');btn.disabled=true;document.getElementById('btn-submit-text').textContent='Publicando...';
  try{
    const res=await fetch('/api/products',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+authToken},
      body:JSON.stringify({name,brand,cat,desc,info,badge,emoji:selectedEmoji,image_url:'',variants:valid})});
    if(res.status===401){showToast('⚠ Sesión expirada');logout();return}
    if(!res.ok){const e=await res.json();throw new Error(e.error)}
    products.unshift(await res.json());renderGrid();renderAdminList();resetForm();showToast('✓ Producto publicado');
  }catch(err){showToast('⚠ '+err.message)}
  finally{btn.disabled=false;document.getElementById('btn-submit-text').textContent='Publicar producto'}
}

async function updateProduct(){
  const name=document.getElementById('f-name').value.trim(),brand=document.getElementById('f-brand').value.trim();
  const cat=document.getElementById('f-cat').value,desc=document.getElementById('f-desc').value.trim();
  const info=document.getElementById('f-info').value.trim(),badge=document.getElementById('f-badge').value;
  if(!name||!brand||!desc){showToast('⚠ Completa nombre, marca y descripción');return}
  const valid=variantRows.filter(v=>v.tone&&v.price).map(v=>({id:v.dbId||null,tone:v.tone,price:v.price,stock:v.stock,image_url:v.image_url,image_url2:v.image_url2,image_url3:v.image_url3}));
  if(!valid.length){showToast('⚠ Agrega al menos un tono con nombre y precio');return}
  const btn=document.getElementById('btn-submit');btn.disabled=true;document.getElementById('btn-submit-text').textContent='Guardando...';
  try{
    const res=await fetch(`/api/products/${editingProductId}`,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+authToken},
      body:JSON.stringify({name,brand,cat,desc,info,badge,emoji:selectedEmoji,image_url:'',variants:valid})});
    if(res.status===401){showToast('⚠ Sesión expirada');logout();return}
    if(!res.ok){const e=await res.json();throw new Error(e.error)}
    const updated=await res.json();
    const idx=products.findIndex(p=>p.id===editingProductId);if(idx!==-1)products[idx]=updated;
    renderGrid();renderAdminList();cancelEdit();showToast('✓ Producto actualizado');
  }catch(err){showToast('⚠ '+err.message)}
  finally{btn.disabled=false;document.getElementById('btn-submit-text').textContent=editingProductId?'Guardar cambios':'Publicar producto'}
}

async function editProduct(id){
  let product=products.find(p=>p.id===id);if(!product)return;
  try{const res=await fetch(`/api/products/${id}`);if(res.ok)product=await res.json()}catch(e){}
  editingProductId=id;
  document.getElementById('f-name').value=product.name;
  document.getElementById('f-brand').value=product.brand;
  document.getElementById('f-cat').value=product.cat;
  document.getElementById('f-desc').value=product.desc||product.description||'';
  document.getElementById('f-info').value=product.info||'';
  document.getElementById('f-badge').value=product.badge||'';
  selectedEmoji=product.emoji||'💄';
  document.querySelectorAll('.emoji-opt').forEach(el=>el.classList.toggle('selected',el.dataset.e===selectedEmoji));
  variantRows=[];variantIdCounter=0;document.getElementById('variants-rows').innerHTML='';
  (product.variants||[]).forEach(v=>addVariantRow(v));
  if(!(product.variants||[]).length)addVariantRow();
  document.getElementById('form-title').innerHTML=`Editando: <em style="color:var(--rose-dark)">${esc(product.name)}</em>`;
  document.getElementById('btn-submit-text').textContent='Guardar cambios';
  document.getElementById('btn-cancel-edit').style.display='';
  showTab('productos');
  document.querySelector('.admin-panel').scrollTo({top:0,behavior:'smooth'});
}

function cancelEdit(){editingProductId=null;resetForm()}
function resetForm(){
  ['f-name','f-brand','f-desc','f-info'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f-badge').value='';document.getElementById('f-cat').value='labios';
  document.querySelectorAll('.emoji-opt').forEach(e=>e.classList.remove('selected'));
  document.querySelector('.emoji-opt[data-e="💄"]').classList.add('selected');
  selectedEmoji='💄';variantRows=[];variantIdCounter=0;document.getElementById('variants-rows').innerHTML='';
  addVariantRow();editingProductId=null;
  document.getElementById('form-title').textContent='Nuevo producto';
  document.getElementById('btn-submit-text').textContent='Publicar producto';
  document.getElementById('btn-cancel-edit').style.display='none';
}

async function deleteProduct(id){
  if(!confirm('¿Eliminar este producto?'))return;
  try{
    const res=await fetch(`/api/products/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+authToken}});
    if(!res.ok)throw new Error();products=products.filter(p=>p.id!==id);
    renderGrid();renderAdminList();if(editingProductId===id)cancelEdit();showToast('Producto eliminado');
  }catch{showToast('⚠ No se pudo eliminar')}
}

function renderAdminList(){
  const wrap=document.getElementById('admin-list-wrap');
  if(!products.length){wrap.style.display='none';return}
  document.getElementById('admin-count').textContent=products.length;wrap.style.display='block';
  document.getElementById('admin-list').innerHTML=products.map(p=>{
    const img=(p.variants||[]).find(v=>v.image_url)?.image_url||p.image_url||'';
    const thumb=img?`<div class="admin-item-img"><img src="${esc(img)}" alt=""></div>`:`<div class="admin-item-img">${p.emoji||'💄'}</div>`;
    return`<div class="admin-item">${thumb}
      <div class="admin-item-info"><div class="admin-item-name">${esc(p.name)}</div><div class="admin-item-meta">${esc(p.brand)} · ${p.cat} · ${(p.variants||[]).length} tono(s)</div></div>
      <div class="admin-item-actions"><button class="btn-edit" onclick="editProduct(${p.id})">Editar</button><button class="btn-delete" onclick="deleteProduct(${p.id})">Eliminar</button></div>
    </div>`;
  }).join('');
}

// ── Ajustes ───────────────────────────────────
document.getElementById('logo-file').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  document.getElementById('logo-placeholder').style.display='none';document.getElementById('logo-progress').style.display='block';
  try{logoUrl=await uploadToCloudinary(file);document.getElementById('logo-preview-img').src=logoUrl;document.getElementById('logo-progress').style.display='none';document.getElementById('logo-preview').style.display='block'}
  catch{showToast('⚠ Error subiendo logo');document.getElementById('logo-placeholder').style.display='block';document.getElementById('logo-progress').style.display='none'}
});
function removeLogo(){logoUrl='';document.getElementById('logo-file').value='';document.getElementById('logo-preview').style.display='none';document.getElementById('logo-placeholder').style.display='block'}
async function saveSettings(){
  try{
    const res=await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+authToken},body:JSON.stringify({whatsapp:document.getElementById('s-whatsapp').value.trim(),logo_url:logoUrl})});
    if(!res.ok)throw new Error();settings.whatsapp=document.getElementById('s-whatsapp').value.trim();settings.logo_url=logoUrl;applyLogo();showToast('✓ Ajustes guardados');
  }catch{showToast('⚠ No se pudo guardar')}
}

// ── Emoji ─────────────────────────────────────
document.getElementById('emoji-picker').addEventListener('click',e=>{
  const opt=e.target.closest('.emoji-opt');if(!opt)return;
  document.querySelectorAll('.emoji-opt').forEach(el=>el.classList.remove('selected'));opt.classList.add('selected');selectedEmoji=opt.dataset.e;
});

// ── Eventos globales ──────────────────────────
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeAdmin();closeLogin()}});
['modal','login-modal'].forEach(id=>document.getElementById(id).addEventListener('click',function(e){if(e.target===this){closeModal();closeLogin()}}));
document.getElementById('admin-overlay').addEventListener('click',function(e){if(e.target===this)closeAdmin()});
document.getElementById('l-pass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});
document.getElementById('hamburger').addEventListener('click',()=>document.getElementById('nav-links').classList.toggle('open'));

// ── Init ──────────────────────────────────────
updateNavForAuth();fetchSettings();fetchProducts();
