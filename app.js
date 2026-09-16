const cfg=window.ETHAN_HUB_CONFIG||{};
const sb=(cfg.supabaseUrl&&cfg.supabasePublishableKey&&window.supabase)?window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const apps=[
 ['🏫','Ethan ERP & LMS','Academy portal, courses, learning, fees, progress and administration.',cfg.erpUrl||'https://app.ethandigitalacademy.org','Connected'],
 ['🎓','Ethan Learn','Dedicated online digital learning platform.','https://learn.ethandigitalacademy.org'],
 ['🤖','Ethan AI','AI search, chat and productivity.',cfg.aiUrl||'https://search.ethandigitalacademy.org','Connected'],
 ['📄','Ethan Office','Documents, spreadsheets and presentations.',cfg.officeUrl||'https://office.ethandigitalacademy.org','Connected'],
 ['🎮','Ethan Games','Games and interactive experiences.','https://games.ethandigitalacademy.org'],
 ['📍','Ethan GPS','Navigation and location tools.','https://gps.ethandigitalacademy.org'],
 ['🏆','Certificates','View and verify Ethan certificates.',null,'Coming Soon'],
 ['☁️','Ethan Cloud','Personal Ethan file storage.',null,'Coming Soon'],
 ['💼','Ethan Career','Portfolio, CV and opportunities.',null,'Coming Soon']
];
const grid=document.querySelector('#apps');
apps.forEach(a=>{const d=document.createElement('article');d.className='app';const badge=a[4]?`<span class="soon">${a[4]}</span>`:'';d.innerHTML=`<div class="icon">${a[0]}</div><h3>${a[1]}</h3><p>${a[2]}</p>${badge}${a[3]?`<button data-url="${a[3]}">Open</button>`:''}`;grid.appendChild(d)});
const msg=t=>document.querySelector('#authMessage').textContent=t;
const PUBLIC_ROLES=new Set(['student','professional','business_owner']);
const STAFF_ROLES=new Set(['instructor','admin','super_admin']);
const ALLOWED_ROLES=new Set([...PUBLIC_ROLES,...STAFF_ROLES]);
const normalizeRole=v=>{
 const r=String(v||'').trim().toLowerCase().replace(/[ -]+/g,'_');
 return r==='businessowner'?'business_owner':r;
};
function userRole(user){return normalizeRole(user?.app_metadata?.role||user?.user_metadata?.role||user?.user_metadata?.learner_type||'student');}
async function getHubProfile(user){
 if(!sb||!user?.id)return null;
 const {data,error}=await sb.from('ethan_profiles').select('user_id,role,approved,approved_at,approved_by').eq('user_id',user.id).maybeSingle();
 if(error){console.error('Ethan profile lookup failed:',error);throw error;}
 return data||null;
}
async function isHubMember(user){
 const profile=await getHubProfile(user);
 return !!profile && profile.email_verified===true && ALLOWED_ROLES.has(normalizeRole(profile.role));
}
function roleLabel(role){return role.replace(/[_-]/g,' ').replace(/\b\w/g,x=>x.toUpperCase());}
function denyAccess(text='Your Ethan ID has not been approved for Ethan Hub yet. Please wait for Super Admin approval.'){
 document.querySelector('#dashboard').hidden=true;document.querySelector('#auth').hidden=false;msg(text);
}


async function openServiceWithSso(button,target,url){
  if(!sb) return msg('Ethan ID authentication is unavailable.');
  const original=button.textContent;
  try{
    button.disabled=true; button.textContent='Connecting…';
    const {data:{session}}=await sb.auth.getSession();
    if(!session){ msg('Sign in to Ethan ID first.'); return; }
    if(!(await isHubMember(session.user))){ denyAccess('Please verify your Ethan ID email before opening connected services.'); return; }
    if(!cfg.ssoFunctionUrl){ window.location.href=url; return; }
    const res=await fetch(cfg.ssoFunctionUrl,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({action:'create',access_token:session.access_token,refresh_token:session.refresh_token,target:target})});
    const out=await res.json();
    if(!res.ok||!out.ticket) throw new Error(out.error||'Unable to create secure Ethan ID handoff.');
    const u=new URL(url); u.searchParams.set('ethan_sso',out.ticket); window.location.href=u.toString();
  }catch(err){ msg(err.message||'Unable to open the connected Ethan service.'); }
  finally{ button.disabled=false; button.textContent=original; }
}


let adminProfiles=[];
function renderAdminProfiles(){
 const body=document.querySelector('#approvalTable tbody'),note=document.querySelector('#adminMessage');
 const q=(document.querySelector('#userSearch')?.value||'').trim().toLowerCase();
 const status=document.querySelector('#statusFilter')?.value||'all';
 const rows=adminProfiles.filter(x=>{
   const matches=!q||x.user_id.toLowerCase().includes(q)||normalizeRole(x.role).includes(q);
   const state=status==='all'||(status==='approved'&&x.approved===true)||(status==='pending'&&x.approved!==true);
   return matches&&state;
 });
 body.innerHTML='';
 for(const x of rows){
  const tr=document.createElement('tr');
  tr.innerHTML=`<td><code title="${x.user_id}">${x.user_id.slice(0,8)}…</code></td>
  <td><select data-role>${['student','professional','business_owner','instructor','admin','super_admin'].map(r=>`<option value="${r}" ${r===normalizeRole(x.role)?'selected':''}>${roleLabel(r)}</option>`).join('')}</select></td>
  <td><strong>${x.approved?'Approved':'Pending'}</strong></td>
  <td><button data-approve="${x.user_id}">${x.approved?'Update':'Approve'}</button> ${x.approved?`<button data-revoke="${x.user_id}">Revoke</button>`:''}</td>`;
  body.appendChild(tr);
 }
 const approved=adminProfiles.filter(x=>x.approved===true).length;
 const pending=adminProfiles.length-approved;
 const admins=adminProfiles.filter(x=>normalizeRole(x.role)==='super_admin'&&x.approved===true).length;
 const stats=document.querySelector('#adminStats');
 if(stats)stats.innerHTML=`<span>Total <b>${adminProfiles.length}</b></span><span>Approved <b>${approved}</b></span><span>Pending <b>${pending}</b></span><span>Super Admins <b>${admins}</b></span>`;
 note.textContent=rows.length?`${rows.length} account(s) shown.`:'No accounts match this filter.';
}

let adminProfiles=[];
const msg=t=>{const e=document.querySelector('#authMessage');if(e)e.textContent=t};
const PUBLIC_ROLES=new Set(['student','professional','business_owner']);
const ALLOWED_ROLES=new Set(['student','professional','business_owner','instructor','admin','super_admin']);
const normalizeRole=v=>String(v||'student').trim().toLowerCase().replace(/[ -]+/g,'_');
const roleLabel=r=>normalizeRole(r).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

async function getHubProfile(user){
 if(!sb||!user?.id)return null;
 const {data,error}=await sb.from('ethan_profiles')
   .select('user_id,full_name,email,role,email_verified,approved,approved_at,approved_by,created_at,updated_at')
   .eq('user_id',user.id).maybeSingle();
 if(error)throw error;
 return data;
}
function showAuth(message=''){
 document.querySelector('#auth').hidden=false;
 document.querySelector('#dashboard').hidden=true;
 document.querySelector('#confirmationPage').hidden=true;
 document.querySelector('header').hidden=false;
 document.querySelector('main').hidden=false;
 document.querySelector('footer').hidden=false;
 if(message)msg(message);
}
function showConfirmation(title,text,buttonText='Continue to Sign In'){
 document.querySelector('header').hidden=true;
 document.querySelector('main').hidden=true;
 document.querySelector('footer').hidden=true;
 const page=document.querySelector('#confirmationPage');page.hidden=false;
 document.querySelector('#confirmationTitle').textContent=title;
 document.querySelector('#confirmationText').textContent=text;
 const b=document.querySelector('#confirmationContinue');b.hidden=false;b.textContent=buttonText;
}
async function showDashboard(user){
 let profile;
 try{profile=await getHubProfile(user)}catch(e){showAuth('Ethan Hub could not verify your account. Please try again.');return}
 if(!profile){showAuth('Your Ethan ID profile is not ready yet. Please contact Ethan Digital Academy.');return}
 if(!profile.email_verified){showAuth('Please verify your email address before signing in to Ethan Hub.');return}
 
 if(!ALLOWED_ROLES.has(normalizeRole(profile.role))){showAuth('Your Ethan ID does not have a valid Hub role.');return}
 document.querySelector('#auth').hidden=true;document.querySelector('#dashboard').hidden=false;
 const name=profile.full_name||user.user_metadata?.full_name||profile.email?.split('@')[0]||'Ethan User';
 document.querySelector('.welcome h1').textContent=`Welcome, ${name}`;
 document.querySelector('.welcome p').textContent=`${roleLabel(profile.role)} · Verified Ethan ID`;
 document.querySelector('.avatar').textContent=name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
 
}
function renderAdmin(){
 const body=document.querySelector('#approvalTable tbody');
 const q=(document.querySelector('#userSearch')?.value||'').toLowerCase();
 const status=document.querySelector('#statusFilter')?.value||'all';
 const rows=adminProfiles.filter(x=>{
  const match=!q||String(x.full_name||'').toLowerCase().includes(q)||String(x.email||'').toLowerCase().includes(q)||normalizeRole(x.role).includes(q);
  const state=status==='all'||(status==='pending'&&!x.approved)||(status==='approved'&&x.approved);
  return match&&state;
 });
 body.innerHTML=rows.map(x=>`<tr>
 <td><strong>${x.full_name||'—'}</strong><br><small>${x.email||x.user_id}</small></td>
 <td>${x.email_verified?'Verified':'Unverified'}</td>
 <td><select data-role>${[...ALLOWED_ROLES].map(r=>`<option value="${r}" ${normalizeRole(x.role)===r?'selected':''}>${roleLabel(r)}</option>`).join('')}</select></td>
 <td><strong>${x.approved?'Approved':'Pending'}</strong></td>
 <td><button data-approve="${x.user_id}">${x.approved?'Update':'Approve'}</button>${x.approved?` <button data-revoke="${x.user_id}">Revoke</button>`:''}</td>
 </tr>`).join('')||'<tr><td colspan="5">No matching users.</td></tr>';
 const stats=document.querySelector('#adminStats');
 if(stats)stats.innerHTML=`<span>Total <b>${adminProfiles.length}</b></span><span>Verified <b>${adminProfiles.filter(x=>x.email_verified).length}</b></span><span>Pending <b>${adminProfiles.filter(x=>!x.approved).length}</b></span><span>Approved <b>${adminProfiles.filter(x=>x.approved).length}</b></span>`;
}
async function loadAdmin(profile){
 const panel=document.querySelector('#superAdminPanel');
 if(normalizeRole(profile?.role)!=='super_admin'||!profile?.approved){panel.hidden=true;return}
 panel.hidden=false;
 const {data,error}=await sb.from('ethan_profiles').select('*').order('created_at',{ascending:false});
 const note=document.querySelector('#adminMessage');
 if(error){note.textContent=error.message;return}
 adminProfiles=data||[];renderAdmin();
}
async function updateUser(id,approved,role){
 const note=document.querySelector('#adminMessage');
 const {data:{user:me}}=await sb.auth.getUser();
 if(!me)return;
 if(id===me.id&&(!approved||normalizeRole(role)!=='super_admin')){note.textContent='You cannot revoke or demote the Super Admin account currently in use.';return}
 const target=adminProfiles.find(x=>x.user_id===id);
 if(approved&&!target?.email_verified){note.textContent='Verify the user email before approving Hub access.';return}
 const payload={role:normalizeRole(role),approved,updated_at:new Date().toISOString(),
  approved_at:approved?new Date().toISOString():null,approved_by:approved?me.id:null};
 const {error}=await sb.from('ethan_profiles').update(payload).eq('user_id',id);
 if(error){note.textContent=error.message;return}
 note.textContent=approved?'User approved/updated successfully.':'User access revoked.';
 await loadAdmin(await getHubProfile(me));
}

document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-approve],[data-revoke]');
 if(b){const row=b.closest('tr'),role=row.querySelector('[data-role]').value;b.disabled=true;
 try{await updateUser(b.dataset.approve||b.dataset.revoke,!!b.dataset.approve,role)}finally{b.disabled=false}return}
 const t=e.target;
 if(t.matches('.tab')){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');document.querySelector('#signin').hidden=t.dataset.tab!=='signin';document.querySelector('#create').hidden=t.dataset.tab!=='create'}
 if(t.dataset.url){const u=t.dataset.url;if(u===(cfg.erpUrl||'https://app.ethandigitalacademy.org'))openServiceWithSso(t,'erp',u);else if(u===(cfg.officeUrl||'https://office.ethandigitalacademy.org'))openServiceWithSso(t,'office',u);else if(u===(cfg.aiUrl||'https://search.ethandigitalacademy.org'))openServiceWithSso(t,'ai',u);else window.open(u,'_blank')}
});
document.querySelector('#userSearch')?.addEventListener('input',renderAdmin);
document.querySelector('#statusFilter')?.addEventListener('change',renderAdmin);
document.querySelector('#refreshUsers')?.addEventListener('click',async()=>{const {data:{user}}=await sb.auth.getUser();if(user)await loadAdmin(await getHubProfile(user))});

document.querySelector('#signin').addEventListener('submit',async e=>{
 e.preventDefault();const inputs=e.currentTarget.querySelectorAll('input');msg('Signing in…');
 const {data,error}=await sb.auth.signInWithPassword({email:inputs[0].value.trim(),password:inputs[1].value});
 if(error)return msg(error.message);
 await showDashboard(data.user);
});
document.querySelector('#create').addEventListener('submit',async e=>{
 e.preventDefault();const inputs=e.currentTarget.querySelectorAll('input'),select=e.currentTarget.querySelector('select');
 if(inputs[2].value!==inputs[3].value)return msg('Passwords do not match.');
 const fullName=inputs[0].value.trim(),role=normalizeRole(select.value);
 const {data,error}=await sb.auth.signUp({email:inputs[1].value.trim(),password:inputs[2].value,
  options:{emailRedirectTo:`${location.origin}/auth/callback`,data:{full_name:fullName,learner_type:PUBLIC_ROLES.has(role)?role:'student'}}});
 if(error)return msg(error.message);
 msg('Ethan ID created. Check your email and confirm your address. After verification, you can sign in to Ethan Hub.');
});
document.querySelector('.link').onclick=async()=>{const email=document.querySelector('#signin input[type=email]').value.trim();if(!email)return msg('Enter your email first.');const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin});msg(error?error.message:'Password reset email sent.')};
document.querySelector('#signout').onclick=async()=>{await sb.auth.signOut();location.href=(location.protocol==='file:'?'./index.html':'/')};
document.querySelector('#confirmationContinue').onclick=()=>{location.href=(location.protocol==='file:'?'./index.html':'/')};

(async()=>{
 if(!sb)return;
 const callback=location.pathname==='/auth/callback';
 if(callback)showConfirmation('Confirming your Ethan ID…','Please wait while we verify your email.','Continue');
 sb.auth.onAuthStateChange(async(event,session)=>{
  if(callback&&session&&(event==='SIGNED_IN'||event==='INITIAL_SESSION')){
   try{await sb.rpc('mark_my_ethan_email_verified')}catch(e){console.warn(e)}
   showConfirmation('Email Verified Successfully','Your Ethan ID email has been verified successfully. You can now sign in to Ethan Hub.','Continue to Ethan Hub');
   return;
  }
  if(!callback&&session)await showDashboard(session.user);
 });
 const {data:{session}}=await sb.auth.getSession();
 if(!callback&&session)await showDashboard(session.user);
})();
