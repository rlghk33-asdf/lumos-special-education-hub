import { safeToolUrl, validateEntry, moveActivity, readStored, localDate, navigationTarget, diaryControls } from './core.mjs';
import * as cloud from './firebase-client.mjs';
const $ = id => document.getElementById(id);
const make = (tag, text, className) => { const element = document.createElement(tag); if(text !== undefined) element.textContent=text; if(className) element.className=className; return element; };
function icon(name) { const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); const use=document.createElementNS(svg.namespaceURI,'use'); use.setAttribute('href',`#i-${name}`); svg.setAttribute('aria-hidden','true'); svg.append(use); return svg; }
let toastTimer;
function toast(message) { $('toast').textContent=message; $('toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').hidden=true,5000); }
function load(key,fallback=[]) { try{return readStored(localStorage.getItem(`lumos:${key}`),fallback);}catch{return fallback;} }
function persist(key,value) { try{localStorage.setItem(`lumos:${key}`,JSON.stringify(value));return true;}catch{toast('브라우저 저장 공간을 사용할 수 없습니다. 변경 사항은 이번 화면에서만 유지됩니다.');return false;} }
const builtins=[
 {id:'schedule',title:'하루를 여는 시각 일정판',description:'지금 할 일, 다음 할 일을 한눈에. 예측 가능한 하루로 아이의 편안한 시작을 도와요.',category:'수업 도구',type:'로그인 없이',icon:'clock',color:'',href:'#schedule',note:'이 기기에 저장'},
 {id:'diary',title:'교사의 일기장',description:'수업 속 작은 발견과 선생님의 마음을 기록해요. 나만의 조용한 성찰 공간입니다.',category:'교사 기록',type:'Google 로그인',icon:'book',color:'purple',href:'#diary',note:cloud.configured?'나만 보는 클라우드 기록':'클라우드 연결 준비 중'}
];
let custom=load('tools').filter(x=>typeof x?.id==='string'&&typeof x.title==='string'&&x.title.length<=40&&typeof x.description==='string'&&x.description.length<=160&&safeToolUrl(x.href)).map(x=>({...x,category:'나의 도구',type:'외부 웹앱',icon:'spark',color:'custom',note:'새 창에서 열림'}));
let favorites=load('favorites').filter(x=>typeof x==='string');
const defaults=()=>[{id:crypto.randomUUID(),title:'하루 준비하기',icon:'clock',done:false},{id:crypto.randomUUID(),title:'함께 책 읽기',icon:'book',done:false},{id:crypto.randomUUID(),title:'잠깐 쉬어가기',icon:'leaf',done:false}];
let activities=load('activities',defaults()).filter(x=>typeof x?.id==='string'&&typeof x.title==='string'&&x.title.length<=40&&['clock','book','spark','leaf'].includes(x.icon)).map(x=>({...x,done:x.done===true}));
let filter='all', route='hub', user=null, entries=[], selectedId=null, dirty=false, busy=false, authReady=false, authEpoch=0;
$('today').textContent=new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'long'}).format(new Date());
function openToolDialog() { if(custom.length>=50){toast('이 브라우저에는 도구를 최대 50개까지 추가할 수 있어요.');return;} $('tool-form').reset();$('tool-dialog').showModal(); }
for(const id of ['add-tool','add-tool-bottom']) $(id).onclick=openToolDialog;
for(const id of ['privacy-side','privacy-footer']) $(id).onclick=()=>$('privacy-dialog').showModal();
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>$(button.dataset.close).close());
$('account-button').onclick=()=>location.hash='diary';
function allTools(){return [...builtins,...custom];}
function renderTools(){
  const query=$('search').value.trim().toLocaleLowerCase('ko');
  const tools=allTools(); const visible=tools.filter(tool=>(route!=='favorites'||favorites.includes(tool.id))&&(filter==='all'||tool.category===filter)&&`${tool.title} ${tool.description}`.toLocaleLowerCase('ko').includes(query));
  $('tool-count').textContent=String(tools.length);$('favorite-count').textContent=String(tools.filter(t=>favorites.includes(t.id)).length);
  $('collection-title').textContent=route==='favorites'?'즐겨찾는 도구':'선생님의 도구 상자 ✦';
  $('tool-grid').replaceChildren();$('empty-tools').hidden=visible.length>0;
  for(const tool of visible){
    const card=make('article',undefined,'tool-card');const art=make('div',undefined,`card-art ${tool.color}`);art.append(make('div',undefined,'orbit'),icon(tool.icon));
    const star=make('button',undefined,'star-button');star.setAttribute('aria-label',`${tool.title} 즐겨찾기`);star.setAttribute('aria-pressed',String(favorites.includes(tool.id)));star.append(icon('star'));star.onclick=()=>{favorites=favorites.includes(tool.id)?favorites.filter(x=>x!==tool.id):[...favorites,tool.id];persist('favorites',favorites);renderTools();const replacement=[...$('tool-grid').querySelectorAll('.star-button')].find(b=>b.getAttribute('aria-label')===star.getAttribute('aria-label'));replacement?.focus();};art.append(star);
    const content=make('div',undefined,'card-content'),tags=make('div',undefined,'tag-row');tags.append(make('span',tool.category,`tag ${tool.color}`),make('span',tool.type,'tag neutral'));
    const bottom=make('div',undefined,'card-bottom');const link=make('a','도구 열기');link.href=tool.href;link.append(icon('arrow'));if(tool.category==='나의 도구'){link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',`${tool.title} 새 창에서 열기`);}bottom.append(make('span',tool.note),link);
    content.append(tags,make('h3',tool.title),make('p',tool.description),bottom);
    if(tool.category==='나의 도구'){const remove=make('button','공방에서 제거','card-delete');remove.onclick=()=>{if(confirm(`‘${tool.title}’ 링크를 이 공방에서 제거할까요?`)){custom=custom.filter(x=>x.id!==tool.id);favorites=favorites.filter(x=>x!==tool.id);persist('tools',custom);persist('favorites',favorites);renderTools();}};content.append(remove);}
    card.append(art,content);$('tool-grid').append(card);
  }
  if(route!=='favorites'&&!query&&filter==='all'){const next=make('div',undefined,'new-card');const circle=make('div',undefined,'circle-plus');circle.append(icon('plus'));const add=make('button','새 도구 추가하기 →');add.onclick=openToolDialog;next.append(circle,make('strong','다음 마법을 기다리는 자리'),make('p','선생님의 아이디어로\n공방을 채워보세요.'),add);$('tool-grid').append(next);}
}
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});renderTools();});
$('search').oninput=renderTools;
$('tool-form').onsubmit=event=>{event.preventDefault();const href=safeToolUrl($('custom-url').value.trim());if(!href){toast('로그인 정보가 없는 공개 HTTPS 주소를 입력해 주세요.');return;}const title=$('custom-title').value.trim(),description=$('custom-description').value.trim();if(!title||!description)return;custom.push({id:crypto.randomUUID(),title,description,href,category:'나의 도구',type:'외부 웹앱',icon:'spark',color:'custom',note:'새 창에서 열림'});persist('tools',custom);$('tool-dialog').close();filter='all';document.querySelector('[data-filter="all"]').click();toast('나의 도구를 공방에 추가했습니다.');};
function saveActivities(){persist('activities',activities);renderSchedule();}
function renderSchedule(){
  const current=activities.find(x=>!x.done);$('current-activity').textContent=current?current.title:activities.length?'오늘의 활동을 모두 마쳤어요!':'일정을 준비해 주세요';
  $('schedule-progress').textContent=`전체 ${activities.length}개 중 ${activities.filter(x=>x.done).length}개 완료`;
  $('activity-list').replaceChildren();
  activities.forEach((activity,index)=>{const card=make('article',undefined,`activity ${activity.done?'done':''} ${current?.id===activity.id?'current':''}`);card.append(make('span',`${String(index+1).padStart(2,'0')} · ${activity.done?'완료':current?.id===activity.id?'지금 할 일':'다음 활동'}`,'activity-number'),icon(activity.icon),make('h3',activity.title));const actions=make('div',undefined,'activity-actions');
    const complete=make('button',activity.done?'다시 하기':'완료하기','complete');complete.setAttribute('aria-label',`${activity.title} ${activity.done?'완료 취소':'완료'}`);complete.onclick=()=>{activity.done=!activity.done;saveActivities();};actions.append(complete);
    for(const [label,direction] of [['↑',-1],['↓',1]]){const move=make('button',label);move.disabled=(index===0&&direction===-1)||(index===activities.length-1&&direction===1);move.setAttribute('aria-label',`${activity.title} ${direction===-1?'위':'아래'}로 이동`);move.onclick=()=>{activities=moveActivity(activities,activity.id,direction);saveActivities();};actions.append(move);}
    const remove=make('button','×');remove.setAttribute('aria-label',`${activity.title} 삭제`);remove.onclick=()=>{activities=activities.filter(x=>x.id!==activity.id);saveActivities();};actions.append(remove);card.append(actions);$('activity-list').append(card);});
}
$('activity-form').onsubmit=e=>{e.preventDefault();const title=$('activity-title').value.trim();if(!title)return;if(activities.length>=30){toast('일정은 최대 30개까지 추가할 수 있어요.');return;}activities.push({id:crypto.randomUUID(),title,icon:$('activity-icon').value,done:false});saveActivities();$('activity-title').value='';$('activity-title').focus();};
$('reset-schedule').onclick=()=>{activities=activities.map(x=>({...x,done:false}));saveActivities();toast('완료 표시를 초기화했습니다.');};
$('clear-schedule').onclick=()=>{if(confirm('이 기기에 저장된 모든 활동을 지울까요?')){activities=[];saveActivities();}};
$('print-schedule').onclick=()=>window.print();
function resetEditor(){selectedId=null;dirty=false;$('diary-form').reset();$('entry-date').value=localDate();$('delete-entry').hidden=true;$('body-count').textContent='0 / 10,000';}
function clearPrivate(){entries=[];resetEditor();$('entry-list').replaceChildren();$('account-name').textContent='';$('diary-workspace').hidden=true;$('auth-panel').hidden=false;}
function authError(error){const messages={'auth/popup-closed-by-user':'로그인 창을 닫았습니다. 다시 시도할 수 있어요.','auth/popup-blocked':'팝업이 차단되었습니다. 이 사이트의 팝업을 허용해 주세요.','auth/unauthorized-domain':'이 배포 도메인이 Firebase 로그인 허용 목록에 없습니다.','permission-denied':'기록 접근이 거부되었습니다. 계정과 Firebase 보안 규칙을 확인해 주세요.','unavailable':'네트워크 연결을 확인해 주세요. 기록은 아직 저장되지 않았습니다.'};return messages[error?.code]||'연결에 실패했습니다. 잠시 후 다시 시도해 주세요.';}
async function refreshEntries(){const epoch=authEpoch;const loaded=await cloud.loadEntries();if(epoch!==authEpoch)return;entries=loaded;renderEntries();}
function renderEntries(){ $('entry-list').replaceChildren();if(!entries.length){$('entry-list').append(make('p','첫 번째 기록을 남겨보세요.','small muted'));return;}for(const entry of entries){const button=make('button',undefined,`entry-item ${entry.id===selectedId?'active':''}`);button.append(make('span',entry.date),make('strong',entry.title));button.onclick=()=>{if(dirty&&!confirm('저장하지 않은 내용을 버리고 다른 기록을 열까요?'))return;selectedId=entry.id;dirty=false;$('entry-date').value=entry.date;$('entry-title').value=entry.title;$('entry-mood').value=entry.mood;$('entry-body').value=entry.body;$('delete-entry').hidden=false;updateCount();renderEntries();};$('entry-list').append(button);}}
function updateCount(){$('body-count').textContent=`${$('entry-body').value.length.toLocaleString('ko')} / 10,000`;}
$('diary-form').oninput=()=>{dirty=true;updateCount();};
$('new-entry').onclick=()=>{if(dirty&&!confirm('저장하지 않은 내용을 버리고 새 일기를 쓸까요?'))return;resetEditor();renderEntries();$('entry-title').focus();};
function setBusy(value){busy=value;$('save-entry').disabled=value;$('delete-entry').disabled=value;$('new-entry').disabled=value;$('logout').disabled=diaryControls(value).logoutDisabled;$('export-diary').disabled=value;$('diary-form').querySelectorAll('input,textarea,select').forEach(e=>e.disabled=value);$('save-entry').textContent=value?'저장 중…':'기록 저장하기';$('entry-list').querySelectorAll('button').forEach(e=>e.disabled=value);}
$('diary-form').onsubmit=async event=>{event.preventDefault();if(busy||!user)return;const value={date:$('entry-date').value,title:$('entry-title').value.trim(),mood:$('entry-mood').value,body:$('entry-body').value.trim()};const error=validateEntry(value);if(error){toast(error);return;}const epoch=authEpoch;setBusy(true);try{const id=await cloud.saveEntry(selectedId,value);if(epoch!==authEpoch)return;selectedId=id;dirty=false;$('delete-entry').hidden=false;toast('일기를 저장했습니다.');try{await refreshEntries();}catch{toast('저장은 완료했지만 목록을 불러오지 못했습니다. 다시 로그인하면 확인할 수 있어요.');}}catch(error){if(epoch===authEpoch)toast(authError(error));}finally{setBusy(false);}};
$('delete-entry').onclick=async()=>{if(!selectedId||busy||!confirm('이 일기를 영구 삭제할까요? 삭제 후에는 복구할 수 없습니다.'))return;const epoch=authEpoch;setBusy(true);try{await cloud.deleteEntry(selectedId);if(epoch!==authEpoch)return;resetEditor();await refreshEntries();toast('일기를 삭제했습니다.');}catch(error){if(epoch===authEpoch)toast(authError(error));}finally{setBusy(false);}};
$('export-diary').onclick=async()=>{if(busy||!user)return;const epoch=authEpoch;setBusy(true);try{const data=await cloud.loadEntries();if(epoch!==authEpoch)return;const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),entries:data.map(({date,title,mood,body})=>({date,title,mood,body}))},null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const link=make('a');link.href=url;link.download=`lumos-diary-${localDate()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('개인 기록 파일을 내려받았습니다. 안전하게 보관해 주세요.');}catch(error){toast(authError(error));}finally{setBusy(false);}};
$('logout').onclick=async()=>{if((dirty||busy)&&!confirm('저장 중이거나 저장하지 않은 내용이 있습니다. 화면의 기록을 비우고 로그아웃할까요?'))return;authEpoch++;user=null;clearPrivate();try{await cloud.logout();toast('로그아웃했습니다.');}catch{toast('로그아웃을 완료하지 못했습니다. 공유 기기라면 브라우저를 닫아 주세요.');}};
$('google-login').onclick=async()=>{if(!authReady)return;$('google-login').disabled=true;try{await cloud.login();}catch(error){toast(authError(error));}finally{$('google-login').disabled=!authReady;}};
let connectStarted=false;
async function initCloud(){if(connectStarted)return;connectStarted=true;if(!cloud.configured){$('auth-description').textContent='일기장의 클라우드 연결을 준비하고 있습니다. 운영자의 Firebase 설정 후 Google 로그인과 기록 저장을 사용할 수 있어요.';$('google-login').disabled=true;$('google-login').textContent='클라우드 연결 준비 중';return;}$('google-login').disabled=true;try{await cloud.connect(async nextUser=>{authEpoch++;user=nextUser;clearPrivate();if(!nextUser)return;$('auth-panel').hidden=true;$('diary-workspace').hidden=false;$('account-name').textContent=`${nextUser.displayName||'선생님'}의 비공개 서재`;try{await refreshEntries();}catch(error){toast(authError(error));}});authReady=true;$('google-login').disabled=false;}catch(error){connectStarted=false;toast(authError(error));$('auth-description').textContent='클라우드 연결에 실패했습니다. 네트워크 상태를 확인한 뒤 페이지를 새로고침해 주세요.';}}
function navigate(){
  const hash=location.hash.slice(1);
  if(hash==='tools'&&(route==='hub'||route==='favorites'))return;
  const next=navigationTarget(route,hash,false,true);
  const allowed=!(route==='diary'&&next!=='diary'&&(busy||(dirty&&!confirm('저장하지 않은 일기가 있습니다. 이 화면을 나갈까요?'))));
  const target=navigationTarget(route,hash,dirty||busy,allowed);
  if(target!==next){history.replaceState(null,'','#diary');return;}
  route=target;
  for(const view of ['hub','schedule','diary']) $(`${view}-view`).hidden=(route==='favorites'?'hub':route)!==view;
  document.querySelectorAll('[data-nav]').forEach(link=>{const active=link.dataset.nav===route;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  $('breadcrumb').textContent={hub:'공방 둘러보기',favorites:'즐겨찾는 도구',schedule:'시각 일정판',diary:'교사의 일기장'}[route];
  document.title=`${$('breadcrumb').textContent} · 루모스 특수교육 공방`;
  if(route==='schedule')renderSchedule();else if(route==='diary')initCloud();else renderTools();
  if(hash==='tools')$('tools').scrollIntoView();else window.scrollTo(0,0);
}
window.addEventListener('hashchange',navigate);window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});
resetEditor();renderTools();navigate();
