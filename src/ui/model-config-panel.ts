import {
  type JsonValue,
  type ModelsConfig,
  redactModelsConfig,
  validateModelsConfig,
} from "../lib/models-config.ts";

const REDACTED = "[REDACTED]";
const ENVIRONMENT_REFERENCE =
  /(^|[^$])\$(?:[A-Za-z_][A-Za-z0-9_]*|\{[A-Za-z_][A-Za-z0-9_]*\})/;

export function redactPanelConfig(config: ModelsConfig): ModelsConfig {
  const redacted = redactModelsConfig(config);
  for (const [providerId, provider] of Object.entries(config.providers)) {
    const apiKey = provider.apiKey;
    if (typeof apiKey === "string" && isEnvironmentReference(apiKey)) {
      redacted.providers[providerId].apiKey = apiKey;
    }
  }
  return redacted;
}

function isEnvironmentReference(value: string): boolean {
  return ENVIRONMENT_REFERENCE.test(value);
}
export function restoreRedactedValues(
  original: ModelsConfig,
  edited: ModelsConfig,
): ModelsConfig {
  const restored = restoreValue(original, edited) as ModelsConfig;
  for (const [providerId, provider] of Object.entries(original.providers)) {
    const editedProvider = restored.providers[providerId];
    if (
      editedProvider &&
      (!editedProvider.apiKey || editedProvider.apiKey === REDACTED)
    ) {
      editedProvider.apiKey = provider.apiKey;
    }
  }
  return restored;
}

export function buildModelConfigPanelHtml(config: ModelsConfig): string {
  const safeConfig = JSON.stringify(redactPanelConfig(config)).replaceAll(
    "<",
    "\\u003c",
  );
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
 :root{--surface:#1e1e20;--surface-2:#2a2a2d;--surface-3:#3a3a40;--ink:#d4d4d4;--muted:#9a9aa2;--rule:#4a4a50;--primary:#3b82f6;--error:#f44747;--success:#4ec9b0;--radius:10px}
[data-theme="light"]{--surface:#f6f6f8;--surface-2:#ededf0;--surface-3:#e2e2e6;--ink:#222226;--muted:#62626a;--rule:#c8c8ce}[data-contrast="true"]{--muted:var(--ink);--rule:#808080}
*{box-sizing:border-box}html,body{height:100%;margin:0}body{background:var(--surface)!important;color:var(--ink);font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;user-select:none}.shell{height:100vh;display:flex;flex-direction:column;overflow:hidden;background:var(--surface);border:1px solid var(--rule);border-radius:14px}
header,.footer{flex:none;display:flex;align-items:center;gap:8px;padding:10px 14px;border-color:var(--rule);background:var(--surface-2)}header{border-bottom:1px solid var(--rule)}.title{flex:1;font-weight:700}.workspace{flex:1;min-height:0;display:grid;grid-template-columns:180px 250px minmax(320px,1fr);overflow:hidden}.pane{min-width:0;overflow:auto;padding:12px;border-right:1px solid var(--rule)}.pane:last-child{border-right:0}.section-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-weight:700}.list{display:flex;flex-direction:column;gap:3px}.item{padding:7px 8px;border:1px solid transparent;border-radius:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis}.item:hover,.item.active{background:var(--surface-3);border-color:var(--rule)}.form-grid{display:flex;flex-direction:column;gap:10px}.field{min-width:0}.wide{grid-column:auto}label{display:block;margin-bottom:4px;color:var(--muted)}.thinking-levels{display:flex;align-items:center;gap:12px}.thinking-levels label{display:flex;align-items:center;gap:4px;margin:0}input,select,textarea,button{font:inherit;color:var(--ink)}input,select,textarea{width:100%;padding:7px 9px;background:var(--surface-2);border:1px solid var(--rule);border-radius:6px;user-select:text}input[type="checkbox"]{width:auto}textarea{min-height:90px;resize:vertical}.advanced{min-height:300px}.tool,.btn{padding:6px 10px;background:var(--surface-2);border:1px solid var(--rule);border-radius:6px;cursor:pointer}.tool:hover,.btn:hover{background:var(--surface-3)}.primary{background:var(--primary);border-color:transparent;color:white}.footer{justify-content:flex-end;border-top:1px solid var(--rule)}.status{margin-right:auto;color:var(--muted)}.status.error{color:var(--error)}.status.success{color:var(--success)}.tabs{display:flex;gap:4px;margin-bottom:12px}.tab.active{background:var(--primary);color:white}.hidden{display:none!important}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,.item:focus-visible{outline:2px solid var(--primary);outline-offset:1px}kbd{color:var(--muted)}dialog{width:min(420px,calc(100% - 32px));padding:0;color:var(--ink);background:var(--surface-2);border:1px solid var(--rule);border-radius:8px}dialog::backdrop{background:#0008}.dialog-body{padding:18px}.dialog-title{margin:0 0 8px;font-size:14px}.dialog-message{margin:0;color:var(--muted);white-space:pre-wrap}.dialog-actions{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid var(--rule)}
.dialog-message{max-height:360px;overflow:auto;user-select:text}
</style></head><body><div class="shell">
<header><span class="title" data-i18n="title"></span><button class="tool" id="gd-lang">EN</button><button class="tool" id="gd-zoom-out">A−</button><button class="tool" id="gd-zoom-in">A+</button><button class="tool" id="gd-zoom-reset">⟲</button></header>
<main class="workspace">
<section class="pane"><div class="section-title"><span data-i18n="providers"></span><span><button class="tool" id="provider-up" type="button" title="Move provider up">↑</button><button class="tool" id="provider-down" type="button" title="Move provider down">↓</button><button class="tool" id="provider-add" type="button" title="Add provider">+</button><button class="tool" id="provider-delete" type="button" title="Delete provider">−</button></span></div><div class="list" id="provider-list" role="listbox"></div></section>
<section class="pane"><div class="section-title"><span data-i18n="providerConfig"></span></div><div class="form-grid">
<div class="field"><label for="provider-id" data-i18n="providerId"></label><input id="provider-id"></div>
<div class="field"><label for="provider-api" data-i18n="api"></label><select id="provider-api"><option value="openai-completions">openai-completions</option><option value="openai-responses">openai-responses</option><option value="anthropic-messages">anthropic-messages</option><option value="google-generative-ai">google-generative-ai</option></select></div>
<div class="field"><label for="provider-base-url" data-i18n="baseUrl"></label><input id="provider-base-url"></div>
<div class="field"><label for="provider-api-key" data-i18n="apiKey"></label><input id="provider-api-key" autocomplete="off" type="password"></div>
<div class="field"><label for="provider-headers" data-i18n="headers"></label><textarea id="provider-headers"></textarea></div>
<div class="field"><label><input id="provider-auth-header" type="checkbox"> <span data-i18n="authHeader"></span></label></div>
</div><div class="section-title"><span data-i18n="models"></span><span><button class="tool" id="model-add" type="button" title="Add model">+</button><button class="tool" id="model-delete" type="button" title="Delete model">−</button></span></div><div class="list" id="model-list" role="listbox"></div></section>
<section class="pane"><div class="tabs"><button class="tool tab active" id="tab-model" data-i18n="modelConfig"></button></div>
<div id="model-view"><div class="form-grid">
<div class="field"><label for="model-id" data-i18n="modelId"></label><input id="model-id"></div>
<div class="field"><label for="model-name" data-i18n="modelName"></label><input id="model-name"></div>
<div class="field"><label><input id="model-reasoning" type="checkbox"> <span data-i18n="reasoning"></span></label></div>
<div class="field"><label for="model-context-window" data-i18n="contextWindow"></label><input id="model-context-window" type="number"></div>
<div class="field"><label for="model-max-tokens" data-i18n="maxTokens"></label><input id="model-max-tokens" type="number"></div>
<div class="field"><label for="model-input" data-i18n="input"></label><input id="model-input" placeholder="text,image"></div>
<div class="field thinking-levels"><label><input id="thinking-medium" type="checkbox"> medium</label><label><input id="thinking-high" type="checkbox"> high</label><label><input id="thinking-xhigh" type="checkbox"> xhigh</label></div>
<div class="field"><label for="cost-input" data-i18n="costInput"></label><input id="cost-input" type="number" min="0" step="any"></div>
<div class="field"><label for="cost-output" data-i18n="costOutput"></label><input id="cost-output" type="number" min="0" step="any"></div>
<div class="field"><label for="cost-cache-read" data-i18n="costCacheRead"></label><input id="cost-cache-read" type="number" min="0" step="any"></div>
<div class="field"><label for="cost-cache-write" data-i18n="costCacheWrite"></label><input id="cost-cache-write" type="number" min="0" step="any"></div>
<div class="field"><label for="currency" data-i18n="currency"></label><select id="currency"><option value="CNY">CNY</option><option value="USD">USD</option></select></div>
</div></div></section></main>
<footer class="footer"><span class="status" id="status"></span><button class="btn" id="b-validate" data-i18n="validate"></button><button class="btn" id="b-preview" data-i18n="preview"></button><button class="btn" id="b-cancel" data-i18n="cancel"></button><button class="btn" id="b-apply" data-i18n="apply"></button><button class="btn primary" id="b-confirm" data-i18n="confirm"></button></footer>
<dialog id="confirm-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-message"><div class="dialog-body"><h2 class="dialog-title" id="confirm-title"></h2><p class="dialog-message" id="confirm-message"></p></div><div class="dialog-actions"><button class="btn" id="confirm-reject" data-i18n="cancel"></button><button class="btn primary" id="confirm-accept"></button></div></dialog>
</div><script>
var UI_TEXT={zh:{title:"模型配置",providers:"供应商",models:"模型",providerConfig:"供应商配置",modelConfig:"模型配置",providerId:"供应商 ID",api:"API 类型",baseUrl:"基础 URL",apiKey:"API Key（密钥）",headers:"Headers（请求头 JSON）",authHeader:"使用认证请求头",modelId:"模型 ID",modelName:"模型名称",reasoning:"推理模型",contextWindow:"上下文窗口",maxTokens:"最大输出",input:"输入类型",costInput:"输入成本 / 1M",costOutput:"输出成本 / 1M",costCacheRead:"缓存读取成本 / 1M",costCacheWrite:"缓存写入成本 / 1M",currency:"币种",validate:"校验",preview:"预览差异",cancel:"取消",apply:"应用",confirm:"确定",valid:"配置有效",invalid:"配置无效"},en:{title:"Model Config",providers:"Providers",models:"Models",providerConfig:"Provider config",modelConfig:"Model config",providerId:"Provider ID",api:"API type",baseUrl:"Base URL",apiKey:"API key",headers:"Headers JSON",authHeader:"Use auth header",modelId:"Model ID",modelName:"Model name",reasoning:"Reasoning model",contextWindow:"Context window",maxTokens:"Max output",input:"Input types",costInput:"Input cost / 1M",costOutput:"Output cost / 1M",costCacheRead:"Cache read cost / 1M",costCacheWrite:"Cache write cost / 1M",currency:"Currency",validate:"Validate",preview:"Preview diff",cancel:"Cancel",apply:"Apply",confirm:"OK",valid:"Config is valid",invalid:"Config is invalid"}};
var lang="zh",zoom=1,config=${safeConfig},providerIndex=0,modelIndex=0,activeCurrency="CNY",pendingAction=null,renderedApiKey="";
function el(id){return document.getElementById(id)}function t(key){return UI_TEXT[lang][key]||key}function texts(){document.querySelectorAll("[data-i18n]").forEach(function(node){node.textContent=t(node.dataset.i18n)});el("gd-lang").textContent=lang==="zh"?"EN":"中文"}
function providerEntries(){return Object.entries(config.providers||{})}function selectedProvider(){return providerEntries()[providerIndex]||null}function selectedModel(){var p=selectedProvider();return p&&Array.isArray(p[1].models)?p[1].models[modelIndex]||null:null}function uniqueId(prefix,items){var n=1;while(items.some(function(id){return id===prefix+"-"+n}))n++;return prefix+"-"+n}function moveProvider(offset){saveForm();var entries=providerEntries(),next=providerIndex+offset;if(next<0||next>=entries.length)return;var item=entries.splice(providerIndex,1)[0];entries.splice(next,0,item);config.providers=Object.fromEntries(entries);providerIndex=next;render()}function addProvider(){saveForm();var id=uniqueId("provider",Object.keys(config.providers));config.providers[id]={models:[]};providerIndex=providerEntries().length-1;modelIndex=0;render()}function addModel(){var entry=selectedProvider();if(!entry)return;saveForm();var models=entry[1].models||[];var id=uniqueId("model",models.map(function(model){return model.id}));entry[1].models=models.concat([{id:id}]);modelIndex=models.length;render()}function deleteSelected(){if(pendingAction==="delete-provider"){var entries=providerEntries();if(entries.length){entries.splice(providerIndex,1);config.providers=Object.fromEntries(entries);providerIndex=Math.min(providerIndex,Math.max(0,entries.length-1));modelIndex=0;render()}}else if(pendingAction==="delete-model"){var entry=selectedProvider();if(entry&&Array.isArray(entry[1].models)){entry[1].models.splice(modelIndex,1);modelIndex=Math.min(modelIndex,Math.max(0,entry[1].models.length-1));render()}}pendingAction=null}function requestDelete(action){if(action==="delete-provider"&&!selectedProvider())return;if(action==="delete-model"&&!selectedModel())return;pendingAction=action;showConfirmation(action)}
function renderLists(){var providers=providerEntries(),pl=el("provider-list"),ml=el("model-list");pl.textContent="";providers.forEach(function(entry,i){var row=document.createElement("div");row.className="item"+(i===providerIndex?" active":"");row.tabIndex=i===providerIndex?0:-1;row.role="option";row.draggable=true;row.textContent=entry[0];row.addEventListener("click",function(){saveForm();providerIndex=i;modelIndex=0;render()});row.addEventListener("dragstart",function(e){e.dataTransfer.setData("text/plain",String(i))});row.addEventListener("dragover",function(e){e.preventDefault()});row.addEventListener("drop",function(e){e.preventDefault();saveForm();var from=Number(e.dataTransfer.getData("text/plain")),entries=providerEntries(),item=entries.splice(from,1)[0];entries.splice(i,0,item);config.providers=Object.fromEntries(entries);providerIndex=i;modelIndex=0;render()});pl.appendChild(row)});ml.textContent="";var p=selectedProvider(),models=p&&Array.isArray(p[1].models)?p[1].models:[];models.forEach(function(model,i){var row=document.createElement("div");row.className="item"+(i===modelIndex?" active":"");row.tabIndex=i===modelIndex?0:-1;row.role="option";row.textContent=model.name||model.id;row.addEventListener("click",function(){saveForm();modelIndex=i;render()});ml.appendChild(row)})}
function json(value){return JSON.stringify(value===undefined?{}:value,null,2)}function costValue(value){var number=typeof value==="number"?value:0;return activeCurrency==="CNY"?number*7:number}
function renderForm(){var p=selectedProvider(),m=selectedModel(),provider=p?p[1]:{},model=m||{};el("provider-id").value=p?p[0]:"";var api=provider.api||"openai-completions",apiOption=el("provider-api").querySelector('option[value="'+api+'"]');if(!apiOption){apiOption=document.createElement("option");apiOption.value=api;apiOption.textContent=api;el("provider-api").appendChild(apiOption)}el("provider-api").value=api;el("provider-base-url").value=provider.baseUrl||"";renderedApiKey=provider.apiKey||"";el("provider-api-key").value=renderedApiKey;el("provider-api-key").type=renderedApiKey==="[REDACTED]"?"password":"text";el("provider-headers").value=json(provider.headers);el("provider-auth-header").checked=provider.authHeader===true;el("model-id").value=model.id||"";el("model-name").value=model.name||"";el("model-reasoning").checked=model.reasoning===true;el("model-context-window").value=model.contextWindow||"";el("model-max-tokens").value=model.maxTokens||"";el("model-input").value=Array.isArray(model.input)?model.input.join(","):"";["medium","high","xhigh"].forEach(function(level){el("thinking-"+level).checked=typeof (model.thinkingLevelMap||{})[level]==="string"&&(model.thinkingLevelMap||{})[level].length>0});el("currency").value=activeCurrency;["input","output","cacheRead","cacheWrite"].forEach(function(key){el("cost-"+(key==="cacheRead"?"cache-read":key==="cacheWrite"?"cache-write":key)).value=costValue(model.cost&&model.cost[key])})}
function optional(target,key,value){if(value===""||value===undefined)delete target[key];else target[key]=value}function parsed(id){return JSON.parse(el(id).value||"{}")}function readCost(id){var value=Number(el(id).value);if(!Number.isFinite(value)||value<0)throw new Error("Invalid cost: "+id);return activeCurrency==="CNY"?value/7:value}
function saveForm(){var entry=selectedProvider();if(!entry)return;var oldId=entry[0],p=entry[1],newId=el("provider-id").value.trim()||oldId;optional(p,"api",el("provider-api").value.trim()||"openai-completions");optional(p,"baseUrl",el("provider-base-url").value.trim());var apiKey=el("provider-api-key").value;if(apiKey!==renderedApiKey)optional(p,"apiKey",apiKey);p.headers=parsed("provider-headers");p.authHeader=el("provider-auth-header").checked;var m=selectedModel();if(m){m.id=el("model-id").value.trim();optional(m,"name",el("model-name").value.trim());m.reasoning=el("model-reasoning").checked;optional(m,"contextWindow",el("model-context-window").value?Number(el("model-context-window").value):"");optional(m,"maxTokens",el("model-max-tokens").value?Number(el("model-max-tokens").value):"");var inputs=el("model-input").value.split(",").map(function(x){return x.trim()}).filter(Boolean);optional(m,"input",inputs.length?inputs:"");var thinking=Object.assign({},m.thinkingLevelMap);["medium","high","xhigh"].forEach(function(level){thinking[level]=el("thinking-"+level).checked?(typeof thinking[level]==="string"&&thinking[level]?thinking[level]:level):null});m.thinkingLevelMap=thinking;m.cost=Object.assign({},m.cost,{input:readCost("cost-input"),output:readCost("cost-output"),cacheRead:readCost("cost-cache-read"),cacheWrite:readCost("cost-cache-write")})}if(newId!==oldId){var next={};Object.entries(config.providers).forEach(function(item){next[item[0]===oldId?newId:item[0]]=item[1]});config.providers=next}}
function render(){renderLists();renderForm();var providers=providerEntries(),providerCount=providers.length,modelCount=selectedProvider()&&Array.isArray(selectedProvider()[1].models)?selectedProvider()[1].models.length:0;el("provider-up").disabled=providerIndex<=0;el("provider-down").disabled=providerIndex>=providerCount-1;el("provider-delete").disabled=providerCount===0;el("model-add").disabled=providerCount===0;el("model-delete").disabled=modelCount===0;texts()}function status(message,ok){var node=el("status");node.textContent=message||"";node.className="status"+(message?" "+(ok?"success":"error"):"")}function send(action){try{if(action!=="cancel")saveForm();window.glimpse.send({action:action,config:config})}catch(error){status(String(error),false)}}
var CONFIRM_TEXT={zh:{cancel:{title:"取消模型配置？",message:"未应用的修改将丢失，确定关闭窗口？",accept:"放弃修改"},apply:{title:"应用模型配置？",message:"保存当前修改并保持窗口打开。",accept:"应用"},confirm:{title:"保存并关闭模型配置？",message:"保存当前修改并关闭窗口。",accept:"确定"},"delete-provider":{title:"删除供应商？",message:"确认删除当前供应商及其模型？",accept:"删除"},"delete-model":{title:"删除模型？",message:"确认删除当前模型？",accept:"删除"}},en:{cancel:{title:"Cancel model configuration?",message:"Unapplied changes will be lost. Close this window?",accept:"Discard changes"},apply:{title:"Apply model configuration?",message:"Save the current changes and keep the window open.",accept:"Apply"},confirm:{title:"Save and close model configuration?",message:"Save the current changes and close the window.",accept:"OK"},"delete-provider":{title:"Delete provider?",message:"Delete this provider and its models?",accept:"Delete"},"delete-model":{title:"Delete model?",message:"Delete this model?",accept:"Delete"}}};
function showConfirmation(action,message){var copy=CONFIRM_TEXT[lang][action];pendingAction=action;el("confirm-title").textContent=copy.title;el("confirm-message").textContent=message||copy.message;el("confirm-accept").textContent=copy.accept;el("confirm-dialog").showModal()}function requestAction(action){if(action==="validate"||action==="preview"){send(action);return}if(action==="cancel"){showConfirmation(action);return}send("prepare-"+action)}function dismissConfirmation(){pendingAction=null;el("confirm-dialog").close()}
["validate","preview","apply","confirm","cancel"].forEach(function(action){el("b-"+action).addEventListener("click",function(){requestAction(action)})});el("provider-up").addEventListener("click",function(){moveProvider(-1)});el("provider-down").addEventListener("click",function(){moveProvider(1)});el("provider-add").addEventListener("click",addProvider);el("provider-delete").addEventListener("click",function(){requestDelete("delete-provider")});el("model-add").addEventListener("click",addModel);el("model-delete").addEventListener("click",function(){requestDelete("delete-model")});el("confirm-reject").addEventListener("click",dismissConfirmation);el("confirm-accept").addEventListener("click",function(){var action=pendingAction;dismissConfirmation();if(action==="delete-provider"||action==="delete-model"){pendingAction=action;deleteSelected()}else if(action)send(action)});el("confirm-dialog").addEventListener("cancel",function(event){event.preventDefault();dismissConfirmation()});el("currency").addEventListener("change",function(){saveForm();activeCurrency=el("currency").value;renderForm()});el("gd-lang").addEventListener("click",function(){lang=lang==="zh"?"en":"zh";texts()});function setZoom(value){zoom=Math.max(.8,Math.min(1.5,Math.round(value*10)/10));document.body.style.zoom=String(zoom)}el("gd-zoom-out").addEventListener("click",function(){setZoom(zoom-.1)});el("gd-zoom-in").addEventListener("click",function(){setZoom(zoom+.1)});el("gd-zoom-reset").addEventListener("click",function(){setZoom(1)});
document.addEventListener("keydown",function(e){var mod=e.metaKey||e.ctrlKey;if(mod&&(e.key==="+"||e.key==="=")){setZoom(zoom+.1);e.preventDefault()}else if(mod&&e.key==="-"){setZoom(zoom-.1);e.preventDefault()}else if(mod&&e.key==="0"){setZoom(1);e.preventDefault()}else if(e.key==="ArrowDown"||e.key==="ArrowUp"){var list=e.target.closest(".list");if(list){var rows=Array.from(list.querySelectorAll(".item")),index=rows.indexOf(e.target),next=(index+(e.key==="ArrowDown"?1:-1)+rows.length)%rows.length;rows[next]?.click();rows[next]?.focus();e.preventDefault()}}});
window.addEventListener("message",function(e){var d=e.data||{};if(d.type==="config"){config=d.config;providerIndex=0;modelIndex=0;render()}if(d.type==="confirmation")showConfirmation(d.action,d.message);if(d.type==="result")status(d.message,d.ok)});document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";document.documentElement.dataset.reduceMotion=String(matchMedia("(prefers-reduced-motion:reduce)").matches);render();
</script></body></html>`;
}

function restoreValue(original: unknown, edited: unknown): JsonValue {
  if (edited === REDACTED) return original as JsonValue;
  if (Array.isArray(edited)) {
    const originalArray = Array.isArray(original) ? original : [];
    return edited.map((value, index) => restoreValue(originalArray[index], value));
  }
  if (isRecord(edited)) {
    const originalRecord = isRecord(original) ? original : {};
    return Object.fromEntries(
      Object.entries(edited).map(([key, value]) => [
        key,
        restoreValue(originalRecord[key], value),
      ]),
    );
  }
  return edited as JsonValue;
}

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parsePanelConfig(original: ModelsConfig, value: unknown): ModelsConfig {
  return validateModelsConfig(
    restoreRedactedValues(original, validateModelsConfig(value)),
  );
}
