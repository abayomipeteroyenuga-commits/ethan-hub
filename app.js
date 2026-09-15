const cfg=window.ETHAN_HUB_CONFIG||{};
const sb=(cfg.supabaseUrl&&cfg.supabasePublishableKey&&window.supabase)?window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey):null;
const apps=[
 ['🏫','Ethan ERP & LMS','Academy portal, courses, learning, fees, progress and administration.',cfg.erpUrl||'https://app.ethandigitalacademy.org','Connected'],
 ['🎓','Ethan Learn','Dedicated online digital learning platform.','https://learn.ethandigitalacademy.org'],
 ['🤖','Ethan AI','AI search, chat and productivity.','https://search.ethandigitalacademy.org'],
 ['📄','Ethan Office','Documents, spreadsheets and presentations.','https://office.ethandigitalacademy.org'],
 ['🎮','Ethan Games','Games and interactive experiences.','https://games.ethandigitalacademy.org'],
 ['📍','Ethan GPS','Navigation and location tools.','https://gps.ethandigitalacademy.org'],
 ['🏆','Certificates','View and verify Ethan certificates.',null,'Coming Soon'],
 ['☁️','Ethan Cloud','Personal Ethan file storage.',null,'Coming Soon'],
 ['💼','Ethan Career','Portfolio, CV and opportunities.',null,'Coming Soon']
];
const grid=document.querySelector('#apps');
apps.forEach(a=>{const d=document.createElement('article');d.className='app';const badge=a[4]?`<span class="soon">${a[4]}</span>`:'';d.innerHTML=`<div class="icon">${a[0]}</div><h3>${a[1]}</h3><p>${a[2]}</p>${badge}${a[3]?`<button data-url="${a[3]}">Open</button>`:''}`;grid.appendChild(d)});
const msg=t=>document.querySelector('#authMessage').textContent=t;

async function openErpWithSso(button){
  if(!sb) return msg('Ethan ID authentication is unavailable.');
  const original=button.textContent;
  try{
    button.disabled=true; button.textContent='Connecting…';
    const {data:{session}}=await sb.auth.getSession();
    if(!session){ msg('Sign in to Ethan ID first.'); return; }
    if(!cfg.ssoFunctionUrl){ window.location.href=cfg.erpUrl; return; }
    const res=await fetch(cfg.ssoFunctionUrl,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({action:'create',access_token:session.access_token,refresh_token:session.refresh_token,target:'erp'})});
    const out=await res.json();
    if(!res.ok||!out.ticket) throw new Error(out.error||'Unable to create secure Ethan ID handoff.');
    const u=new URL(cfg.erpUrl); u.searchParams.set('ethan_sso',out.ticket); window.location.href=u.toString();
  }catch(err){ msg(err.message||'Unable to open ERP & LMS.'); }
  finally{ button.disabled=false; button.textContent=original; }
}

function showDashboard(user){document.querySelector('#auth').hidden=true;document.querySelector('#dashboard').hidden=false;const name=user?.user_metadata?.full_name||user?.user_metadata?.first_name||user?.email?.split('@')[0]||'Ethan User';document.querySelector('.welcome h1').textContent=`Welcome, ${name}`;document.querySelector('.avatar').textContent=name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
document.addEventListener('click',e=>{const t=e.target;if(t.matches('.tab')){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');document.querySelector('#signin').hidden=t.dataset.tab!=='signin';document.querySelector('#create').hidden=t.dataset.tab!=='create'}if(t.dataset.url){ if(t.dataset.url===(cfg.erpUrl||'https://app.ethandigitalacademy.org')) openErpWithSso(t); else window.open(t.dataset.url,'_blank') }});
document.querySelector('#signin').addEventListener('submit',async e=>{e.preventDefault();if(!sb)return msg('Authentication configuration is unavailable.');const inputs=e.currentTarget.querySelectorAll('input');msg('Signing in…');const {data,error}=await sb.auth.signInWithPassword({email:inputs[0].value.trim(),password:inputs[1].value});if(error)return msg(error.message);showDashboard(data.user)});
document.querySelector('#create').addEventListener('submit',async e=>{e.preventDefault();if(!sb)return msg('Authentication configuration is unavailable.');const inputs=e.currentTarget.querySelectorAll('input');const select=e.currentTarget.querySelector('select');if(inputs[2].value!==inputs[3].value)return msg('Passwords do not match.');const fullName=inputs[0].value.trim();msg('Creating your Ethan ID…');const {data,error}=await sb.auth.signUp({email:inputs[1].value.trim(),password:inputs[2].value,options:{data:{full_name:fullName,first_name:fullName.split(/\s+/)[0]||'',last_name:fullName.split(/\s+/).slice(1).join(' '),role:'student',learner_type:(select.value||'Student').toLowerCase()}}});if(error)return msg(error.message);if(data.session)showDashboard(data.user);else msg('Ethan ID created. Check your email to confirm your account, then sign in.')});
document.querySelector('.link').onclick=async()=>{const email=document.querySelector('#signin input[type=email]').value.trim();if(!email)return msg('Enter your email address first.');const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin});msg(error?error.message:'Password reset instructions have been sent to your email.')};
document.querySelector('#signout').onclick=async()=>{if(sb)await sb.auth.signOut();location.reload()};
document.querySelector('#accountBtn').onclick=()=>{document.querySelector('#dashboard').scrollIntoView({behavior:'smooth'})};
(async()=>{if(!sb)return;const {data}=await sb.auth.getSession();if(data.session)showDashboard(data.session.user);sb.auth.onAuthStateChange((_event,session)=>{if(session)showDashboard(session.user)})})();
