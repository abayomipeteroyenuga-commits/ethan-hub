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
const PUBLIC_ROLES=new Set(['student','professional','business owner','business_owner','business-owner']);
const STAFF_ROLES=new Set(['instructor','admin','super admin','super_admin','super-admin']);
const ALLOWED_ROLES=new Set([...PUBLIC_ROLES,...STAFF_ROLES]);
const normalizeRole=v=>String(v||'').trim().toLowerCase();
function userRole(user){return normalizeRole(user?.app_metadata?.role||user?.user_metadata?.role||user?.user_metadata?.learner_type||'student');}
async function getHubProfile(user){
 if(!sb||!user?.id)return null;
 const {data,error}=await sb.from('ethan_profiles').select('user_id,role,approved,approved_at').eq('user_id',user.id).maybeSingle();
 if(error){console.error('Ethan profile:',error);return null;}
 return data;
}
async function isHubMember(user){
 const profile=await getHubProfile(user);
 return !!profile && profile.approved===true && ALLOWED_ROLES.has(normalizeRole(profile.role));
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
    if(!(await isHubMember(session.user))){ denyAccess('Your Ethan ID is awaiting Super Admin approval.'); return; }
    if(!cfg.ssoFunctionUrl){ window.location.href=url; return; }
    const res=await fetch(cfg.ssoFunctionUrl,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({action:'create',access_token:session.access_token,refresh_token:session.refresh_token,target:target})});
    const out=await res.json();
    if(!res.ok||!out.ticket) throw new Error(out.error||'Unable to create secure Ethan ID handoff.');
    const u=new URL(url); u.searchParams.set('ethan_sso',out.ticket); window.location.href=u.toString();
  }catch(err){ msg(err.message||'Unable to open the connected Ethan service.'); }
  finally{ button.disabled=false; button.textContent=original; }
}

async function showDashboard(user){
 const profile=await getHubProfile(user);
 if(!profile||profile.approved!==true){denyAccess('Account created successfully, but Ethan Hub access is pending Super Admin approval.');return false;}
 const role=normalizeRole(profile.role);
 if(!ALLOWED_ROLES.has(role)){denyAccess('This Ethan ID does not have an approved Ethan Hub role.');return false;}
 document.querySelector('#auth').hidden=true;document.querySelector('#dashboard').hidden=false;
 const name=user?.user_metadata?.full_name||user?.user_metadata?.first_name||user?.email?.split('@')[0]||'Ethan User';
 document.querySelector('.welcome h1').textContent=`Welcome, ${name}`;
 document.querySelector('.welcome p').textContent=`${roleLabel(role)} · Approved Ethan Hub account.`;
 document.querySelector('.avatar').textContent=name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
 return true;
}
document.addEventListener('click',e=>{const t=e.target;if(t.matches('.tab')){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');document.querySelector('#signin').hidden=t.dataset.tab!=='signin';document.querySelector('#create').hidden=t.dataset.tab!=='create'}if(t.dataset.url){const u=t.dataset.url;if(u===(cfg.erpUrl||'https://app.ethandigitalacademy.org'))openServiceWithSso(t,'erp',u);else if(u===(cfg.officeUrl||'https://office.ethandigitalacademy.org'))openServiceWithSso(t,'office',u);else if(u===(cfg.aiUrl||'https://search.ethandigitalacademy.org'))openServiceWithSso(t,'ai',u);else if(u===(cfg.neonBikeUrl||'https://neonbike.ethandigitalacademy.org'))openServiceWithSso(t,'neon-bike',u);else window.open(u,'_blank')}});
document.querySelector('#signin').addEventListener('submit',async e=>{e.preventDefault();if(!sb)return msg('Authentication configuration is unavailable.');const form=e.currentTarget,inputs=form.querySelectorAll('input'),button=form.querySelector('.primary');button.disabled=true;button.textContent='Signing in…';msg('Signing in securely…');try{const result=await Promise.race([sb.auth.signInWithPassword({email:inputs[0].value.trim(),password:inputs[1].value}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Sign-in is taking longer than expected. Check your connection and try again.')),12000))]);const {data,error}=result;if(error)return msg(error.message);if(!data?.session)return msg('Sign-in could not establish a session. Please try again.');await showDashboard(data.user)}catch(err){msg(err.message||'Unable to sign in. Please try again.')}finally{button.disabled=false;button.textContent='Sign In'}});
document.querySelector('#create').addEventListener('submit',async e=>{e.preventDefault();if(!sb)return msg('Authentication configuration is unavailable.');const inputs=e.currentTarget.querySelectorAll('input');const select=e.currentTarget.querySelector('select');if(inputs[2].value!==inputs[3].value)return msg('Passwords do not match.');const fullName=inputs[0].value.trim();msg('Creating your Ethan ID…');const {data,error}=await sb.auth.signUp({email:inputs[1].value.trim(),password:inputs[2].value,options:{emailRedirectTo:`${location.origin}/auth/callback`,data:{full_name:fullName,first_name:fullName.split(/\s+/)[0]||'',last_name:fullName.split(/\s+/).slice(1).join(' '),role:'student',learner_type:(PUBLIC_ROLES.has(normalizeRole(select.value))?normalizeRole(select.value):'student')}}});if(error)return msg(error.message);if(data.session)denyAccess('Ethan ID created successfully. Your Hub access is pending Super Admin approval.');
else msg('Ethan ID created. Confirm your email if requested. Hub access will begin only after Super Admin approval.')});
document.querySelector('.link').onclick=async()=>{const email=document.querySelector('#signin input[type=email]').value.trim();if(!email)return msg('Enter your email address first.');const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin});msg(error?error.message:'Password reset instructions have been sent to your email.')};
document.querySelector('#signout').onclick=async()=>{if(sb)await sb.auth.signOut();location.reload()};
document.querySelector('#accountBtn').onclick=()=>{document.querySelector('#dashboard').scrollIntoView({behavior:'smooth'})};
(async()=>{
  if(!sb)return;

  // Register first so callback-created sessions are never missed.
  sb.auth.onAuthStateChange((_event,session)=>{
    if(session){
      if(location.pathname==='/auth/callback')history.replaceState({},'', '/');
      showDashboard(session.user);
    }
  });

  const isCallback=location.pathname==='/auth/callback';
  if(isCallback){
    msg('Email confirmed. Signing you in automatically…');
    try{
      const code=new URLSearchParams(location.search).get('code');
      if(code){
        const {error}=await sb.auth.exchangeCodeForSession(code);
        if(error)throw error;
      }

      // Wait briefly for Supabase to finish processing implicit/hash callbacks.
      let session=null;
      for(let i=0;i<12&&!session;i++){
        const {data,error}=await sb.auth.getSession();
        if(error)throw error;
        session=data.session;
        if(!session)await new Promise(r=>setTimeout(r,250));
      }

      if(session){
        history.replaceState({},'', '/');
        showDashboard(session.user);
      }else{
        msg('Your email is confirmed. Your secure session was not returned, so please sign in once to continue.');
      }
    }catch(err){
      msg(err.message||'Your email was confirmed, but automatic sign-in could not finish. Please sign in once.');
    }
  }else{
    const {data,error}=await sb.auth.getSession();
    if(!error&&data.session)showDashboard(data.session.user);
  }
})();
