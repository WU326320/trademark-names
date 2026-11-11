'use strict';
(() => {
  const {rules,validate,normalize,key}=window.Trademark;
  const $=id=>document.getElementById(id);
  const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const state={groups:[],name:'',ids:[],filter:'all',busy:false,run:0,controller:null,cancelled:false};
  const selected=()=>[...document.querySelectorAll('input[name=rule]:checked')].map(e=>e.value);
  const label=id=>rules.find(r=>r.id===id).label;
  const statusText={ready:'已完成',partial:'部分完成',error:'生成失败',unavailable:'不适用'};
  let toastTimer;
  function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,2800);}
  function info(title,paragraphs,example){$('dialog-title').textContent=title;$('dialog-content').replaceChildren();paragraphs.filter(Boolean).forEach(p=>$('dialog-content').append(el('p','',p)));if(example)$('dialog-content').append(el('div','dialog-example',example));$('info-dialog').showModal();}
  function changed(){ $('char-count').textContent=`${[...normalize($('name').value)].length} / 30`;$('selection-count').textContent=`已选择 ${selected().length} 项规则 · 可多选`;$('form-error').hidden=true;$('name').removeAttribute('aria-invalid');$('stale-note').hidden=!state.name||(state.name===normalize($('name').value)&&state.ids.join()===selected().join()); }
  rules.forEach(r=>{const wrap=el('div','rule-option'),l=el('label'),c=el('input');c.type='checkbox';c.name='rule';c.value=r.id;c.checked=r.id==='partial';l.append(c,el('span','',r.label));const b=el('button','rule-info','?');b.type='button';b.setAttribute('aria-label',`${r.label}规则说明`);b.onclick=()=>info(r.label,[r.description,r.extra],r.example);wrap.append(l,b);$('rule-options').append(wrap);});
  $('name').oninput=changed;$('rule-options').onchange=changed;
  function selectAll(value){document.querySelectorAll('input[name=rule]').forEach(c=>c.checked=value);changed();}
  $('select-all').onclick=()=>selectAll(true);$('clear-selection').onclick=()=>selectAll(false);
  document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{$('name').value=b.dataset.example;changed();$('name').focus();});
  $('try-example').onclick=()=>{$('name').value='途虎';changed();$('name').focus();};
  $('help').onclick=()=>info('使用说明',[
    '输入一个名称，多选规则后点击生成。各组依次完成并即时展示，每组最多50个去重候选；不足时显示实际条数。',
    '逆序、减字、换序和连续提取由程序计算。其他候选由 DeepSeek 生成，每组最多请求两次，会使用账户额度。取消会停止后续调用，已提交请求是否计费以 DeepSeek 为准。',
    '读音相同按不区分声调的逐字拼音校验。多音字的语境、形似字、英文译义和通用词属性仍需人工核对。',
    '点击卡片复制单条，复制本组复制该组全部，复制全部会跨组去重且不受筛选影响。',
    '在页面填写自己的 DeepSeek API Key，浏览器直接访问 DeepSeek。密钥仅用于当前页面，不写入本地存储、Cookie 或网站服务器；刷新、关闭或点击清除后需重新填写。测试连接只查询模型列表，实际生成会使用你自己的账户额度。'
  ]);
  $('close-info').onclick=$('ack-info').onclick=()=>$('info-dialog').close();$('close-copy').onclick=()=>$('copy-dialog').close();$('select-copy').onclick=()=>{$('copy-text').focus();$('copy-text').select();};
  const dedupe=names=>{const seen=new Set();return names.filter(n=>{const k=key(n);if(seen.has(k))return false;seen.add(k);return true;});};
  async function copy(names){const all=dedupe(names);if(!all.length)return;const text=all.join('\n');try{await navigator.clipboard.writeText(text);toast(`已复制 ${all.length} 个名称`);}catch{$('copy-text').value=text;if(!$('copy-dialog').open)$('copy-dialog').showModal();$('copy-text').focus();$('copy-text').select();}}
  $('copy-all').onclick=()=>copy(state.groups.flatMap(g=>g.items.map(i=>i.name)));
  function filters(){ $('result-filters').replaceChildren();[{id:'all',text:'全部规则'},...state.groups.map(g=>({id:g.id,text:`${label(g.id)} ${g.items.length}`}))].forEach(o=>{const b=el('button','filter',o.text);b.type='button';b.dataset.filter=o.id;b.setAttribute('aria-pressed',String(state.filter===o.id));b.onclick=()=>{state.filter=o.id;filters();render();};$('result-filters').append(b);}); }
  function card(item){const b=el('button','name-card');b.type='button';b.setAttribute('aria-label',`复制 ${item.name}`);const n=el('span','candidate'),chars=[...item.name],original=[...state.name];chars.forEach((c,i)=>n.append(el('span',chars.length===original.length&&c!==original[i]?'changed':'',c)));const mark=el('span','copy-mark','⧉');mark.setAttribute('aria-hidden','true');b.append(n,mark);b.onclick=()=>copy([item.name]);return b;}
  function render(){const target=$('result-content');target.replaceChildren();const query=key($('result-search').value);let shown=0;
    state.groups.filter(g=>state.filter==='all'||state.filter===g.id).forEach(g=>{const items=g.items.filter(i=>key(i.name).includes(query));if(query&&!items.length)return;shown++;
      const section=el('section','result-group');section.dataset.rule=g.id;section.dataset.status=g.status;
      const top=el('div','group-top'),title=el('div','group-title');title.append(el('h3','',label(g.id)),el('small','',`${g.items.length} 条`),el('span','state-label',statusText[g.status]||g.status),el('span','source',g.source));const b=el('button','text-button','复制本组');b.type='button';b.disabled=!g.items.length;b.onclick=()=>copy(g.items.map(i=>i.name));top.append(title,b);section.append(top,el('p','group-note',g.note));
      if(!items.length)section.append(el('div','group-message',g.status==='error'?'本组请求失败，请按提示处理后重新生成。':g.status==='unavailable'?'此规则不适用于当前名称。':'本次未得到符合规则的候选名称。'));
      [...new Set(items.map(i=>i.subtype))].forEach(type=>{const values=items.filter(i=>i.subtype===type);if(type)section.append(el('h4','subtype',`${type} · ${values.length} 条`));const grid=el('div','name-grid');values.forEach(i=>grid.append(card(i)));section.append(grid);});target.append(section);
    });if(!shown)target.append(el('p','no-matches',state.busy?'正在生成，请稍候…':state.cancelled?'已取消，尚无完成的分组。':'没有匹配的名称，请更换搜索词或分组。')); }
  $('result-search').oninput=render;
  function summary(){const count=dedupe(state.groups.flatMap(g=>g.items.map(i=>i.name))).length;const failed=state.groups.filter(g=>g.status==='error'||g.status==='partial').length;$('total-count').textContent=count;$('copy-all').disabled=!count;$('result-summary').textContent=`「${state.name}」 · 已处理 ${state.groups.length}/${state.ids.length} 组 · 去重 ${count} 个名称${failed?` · ${failed} 组未完整完成`:''}${state.cancelled?' · 已取消，保留完成分组':''}`;}
  let keyTest=null;
  function connection(text,ok=false){$('connection').textContent=text;$('connection').dataset.ready=String(ok);}
  function stopKeyTest(){keyTest?.abort();keyTest=null;$('test-key').disabled=state.busy;}
  function busy(value){state.busy=value;$('controls-fieldset').disabled=value;$('api-key').disabled=value;$('test-key').disabled=value||!!keyTest;$('progress-area').hidden=!value;document.querySelector('.results').setAttribute('aria-busy',String(value));}
  $('api-key').oninput=()=>{stopKeyTest();connection($('api-key').value.trim()?'密钥已填写，可测试连接或直接生成。':'未填写密钥，本地规则仍可使用。');};
  $('toggle-key').onclick=()=>{const show=$('api-key').type==='password';$('api-key').type=show?'text':'password';$('toggle-key').textContent=show?'隐藏':'显示';$('toggle-key').setAttribute('aria-pressed',String(show));};
  $('test-key').onclick=async()=>{stopKeyTest();const controller=new AbortController();keyTest=controller;$('test-key').disabled=true;connection('正在连接 DeepSeek…');try{const message=await window.TrademarkEngine.testConnection($('api-key').value.trim(),{signal:controller.signal});if(keyTest===controller)connection(message,true);}catch(e){if(keyTest===controller)connection(e.message);}finally{if(keyTest===controller){keyTest=null;$('test-key').disabled=state.busy;}}};
  async function submit(event){event.preventDefault();if(state.busy)return;const raw=$('name').value,ids=selected(),error=validate(raw,ids);
    if(error){$('form-error').textContent=error;$('form-error').hidden=false;if(validate(raw,['exact'])){$('name').setAttribute('aria-invalid','true');$('name').focus();}else document.querySelector('input[name=rule]').focus();return;}
    stopKeyTest();
    Object.assign(state,{name:normalize(raw),ids,groups:[],filter:'all',cancelled:false});$('results-tools').hidden=false;$('result-search').value='';$('stale-note').hidden=true;$('form-error').hidden=true;$('progress').value=0;busy(true);filters();render();summary();
    const run=++state.run;const controller=new AbortController();state.controller=controller;
    try{for(let i=0;i<ids.length;i++){
      $('progress-label').textContent=`正在生成 ${label(ids[i])} · ${i+1}/${ids.length}`;
      let group;
      try{group=await window.TrademarkEngine.generateGroup(state.name,ids[i],{config:{apiKey:$('api-key').value.trim(),model:'deepseek-flash',timeoutMs:60000},signal:controller.signal});}
      catch(e){if(controller.signal.aborted)return;group={id:ids[i],status:'error',source:'请求失败',items:[],note:e.name==='TimeoutError'?'请求超时，请重试。':e instanceof TypeError?'无法连接服务，请检查服务是否运行。':e.message};}
      if(run!==state.run)return;state.groups.push(group);$('progress').value=(i+1)/ids.length*100;filters();render();summary();
    }}finally{if(run===state.run){busy(false);state.controller=null;}}
    if(run===state.run)toast(state.groups.some(g=>['error','partial'].includes(g.status))?'部分分组未完成，请查看各组提示。':'本次结果已整理。');
  }
  $('generator').onsubmit=submit;$('cancel').onclick=()=>{state.run++;state.controller?.abort();state.controller=null;state.cancelled=true;busy(false);summary();render();toast('已取消，保留已完成结果。');};
  function clearKey(){stopKeyTest();if(state.busy)$('cancel').click();$('api-key').value='';$('api-key').type='password';$('toggle-key').textContent='显示';$('toggle-key').setAttribute('aria-pressed','false');connection('密钥已清除，本地规则仍可使用。');}
  $('clear-key').onclick=clearKey;
  window.addEventListener('pagehide',clearKey);
  window.addEventListener('pageshow',event=>{if(event.persisted)clearKey();});
})();
