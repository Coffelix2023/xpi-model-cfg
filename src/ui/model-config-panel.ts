import {
  type JsonValue,
  type ModelsConfig,
  redactModelsConfig,
  validateModelsConfig,
} from "../lib/models-config.ts";

const REDACTED = "[REDACTED]";

export function restoreRedactedValues(
  original: ModelsConfig,
  edited: ModelsConfig,
): ModelsConfig {
  return restoreValue(original, edited) as ModelsConfig;
}
export function buildModelConfigPanelHtml(config: ModelsConfig): string {
  const safeConfig = JSON.stringify(redactModelsConfig(config)).replaceAll(
    "<",
    "\\u003c",
  );
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
 :root{--surface:#1e1e20;--surface-2:#2a2a2d;--surface-3:#3a3a40;--ink:#d4d4d4;--muted:#9a9aa2;--rule:#4a4a50;--primary:#3b82f6;--error:#f44747;--success:#4ec9b0;--radius:10px}
[data-theme="light"]{--surface:#f6f6f8;--surface-2:#ededf0;--surface-3:#e2e2e6;--ink:#222226;--muted:#62626a;--rule:#c8c8ce}[data-contrast="true"]{--muted:var(--ink);--rule:#808080}
*{box-sizing:border-box}html,body{height:100%;margin:0}body{background:var(--surface)!important;color:var(--ink);font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;user-select:none}.shell{height:100vh;display:flex;flex-direction:column;overflow:hidden;background:var(--surface);border:1px solid var(--rule);border-radius:14px}
header,.footer{flex:none;display:flex;align-items:center;gap:8px;padding:10px 14px;border-color:var(--rule);background:var(--surface-2)}header{border-bottom:1px solid var(--rule)}.title{flex:1;font-weight:700}.workspace{flex:1;min-height:0;display:grid;grid-template-columns:180px 250px minmax(320px,1fr);overflow:hidden}.pane{min-width:0;overflow:auto;padding:12px;border-right:1px solid var(--rule)}.pane:last-child{border-right:0}.section-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-weight:700}.list{display:flex;flex-direction:column;gap:3px}.item{padding:7px 8px;border:1px solid transparent;border-radius:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis}.item:hover,.item.active{background:var(--surface-3);border-color:var(--rule)}.form-grid{display:flex;flex-direction:column;gap:10px}.field{min-width:0}.wide{grid-column:auto}label{display:block;margin-bottom:4px;color:var(--muted)}input,select,textarea,button{font:inherit;color:var(--ink)}input,select,textarea{width:100%;padding:7px 9px;background:var(--surface-2);border:1px solid var(--rule);border-radius:6px;user-select:text}input[type="checkbox"]{width:auto}textarea{min-height:90px;resize:vertical}.advanced{min-height:300px}.tool,.btn{padding:6px 10px;background:var(--surface-2);border:1px solid var(--rule);border-radius:6px;cursor:pointer}.tool:hover,.btn:hover{background:var(--surface-3)}.primary{background:var(--primary);border-color:transparent;color:white}.footer{justify-content:flex-end;border-top:1px solid var(--rule)}.status{margin-right:auto;color:var(--muted)}.status.error{color:var(--error)}.status.success{color:var(--success)}.tabs{display:flex;gap:4px;margin-bottom:12px}.tab.active{background:var(--primary);color:white}.hidden{display:none!important}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,.item:focus-visible{outline:2px solid var(--primary);outline-offset:1px}kbd{color:var(--muted)}
</style></head><body><div class="shell">
<header><span class="title" data-i18n="title"></span><button class="tool" id="gd-lang">EN</button><button class="tool" id="gd-zoom-out">A−</button><button class="tool" id="gd-zoom-in">A+</button><button class="tool" id="gd-zoom-reset">⟲</button></header>
<main class="workspace">
<section class="pane"><div class="section-title"><span data-i18n="providers"></span></div><div class="list" id="provider-list" role="listbox"></div></section>
<section class="pane"><div class="section-title"><span data-i18n="providerConfig"></span></div><div class="form-grid">
<div class="field"><label for="provider-id" data-i18n="providerId"></label><input id="provider-id"></div>
<div class="field"><label for="provider-api" data-i18n="api"></label><select id="provider-api"><option value="openai-completions">openai-completions</option><option value="openai-responses">openai-responses</option><option value="anthropic-messages">anthropic-messages</option><option value="google-generative-ai">google-generative-ai</option></select></div>
<div class="field"><label for="provider-base-url" data-i18n="baseUrl"></label><input id="provider-base-url"></div>
<div class="field"><label for="provider-api-key" data-i18n="apiKey"></label><input id="provider-api-key" autocomplete="off"></div>
<div class="field"><label for="provider-headers" data-i18n="headers"></label><textarea id="provider-headers"></textarea></div>
<div class="field"><label><input id="provider-auth-header" type="checkbox"> <span data-i18n="authHeader"></span></label></div>
</div><div class="section-title"><span data-i18n="models"></span></div><div class="list" id="model-list" role="listbox"></div></section>
<section class="pane"><div class="tabs"><button class="tool tab active" id="tab-model" data-i18n="modelConfig"></button></div>
<div id="model-view"><div class="form-grid">
<div class="field"><label for="model-id" data-i18n="modelId"></label><input id="model-id"></div>
<div class="field"><label for="model-name" data-i18n="modelName"></label><input id="model-name"></div>
<div class="field"><label><input id="model-reasoning" type="checkbox"> <span data-i18n="reasoning"></span></label></div>
<div class="field"><label for="model-context-window" data-i18n="contextWindow"></label><input id="model-context-window" type="number"></div>
<div class="field"><label for="model-max-tokens" data-i18n="maxTokens"></label><input id="model-max-tokens" type="number"></div>
<div class="field"><label for="model-input" data-i18n="input"></label><input id="model-input" placeholder="text,image"></div>
<div class="field"><label for="cost-input" data-i18n="costInput"></label><input id="cost-input" type="number" min="0" step="any"></div>
<div class="field"><label for="cost-output" data-i18n="costOutput"></label><input id="cost-output" type="number" min="0" step="any"></div>
<div class="field"><label for="cost-cache-read" data-i18n="costCacheRead"></label><input id="cost-cache-read" type="number" min="0" step="any"></div>
<div class="field"><label for="cost-cache-write" data-i18n="costCacheWrite"></label><input id="cost-cache-write" type="number" min="0" step="any"></div>
<div class="field"><label for="currency" data-i18n="currency"></label><select id="currency"><option value="CNY">CNY</option><option value="USD">USD</option></select></div>
<div class="field wide"><label for="model-advanced-json" data-i18n="modelAdvanced"></label><textarea id="model-advanced-json"></textarea></div>
</div></div></section></main>
<footer class="footer"><span class="status" id="status"></span><button class="btn" id="b-validate" data-i18n="validate"></button><button class="btn" id="b-preview" data-i18n="preview"></button><button class="btn" id="b-cancel" data-i18n="cancel"></button><button class="btn" id="b-apply" data-i18n="apply"></button><button class="btn primary" id="b-confirm" data-i18n="confirm"></button></footer>
</div><script>
var UI_TEXT={zh:{title:"模型配置",providers:"供应商",models:"模型",providerConfig:"供应商配置",modelConfig:"模型配置",providerId:"供应商 ID",api:"API 类型",baseUrl:"基础 URL",apiKey:"API Key（密钥）",headers:"Headers（请求头 JSON）",authHeader:"使用认证请求头",modelId:"模型 ID",modelName:"模型名称",reasoning:"推理模型",contextWindow:"上下文窗口",maxTokens:"最大输出",input:"输入类型",costInput:"输入成本 / 1M",costOutput:"输出成本 / 1M",costCacheRead:"缓存读取成本 / 1M",costCacheWrite:"缓存写入成本 / 1M",currency:"币种",modelAdvanced:"模型高级字段 JSON",validate:"校验",preview:"预览差异",cancel:"取消",apply:"应用",confirm:"确定",valid:"配置有效",invalid:"配置无效"},en:{title:"Model Config",providers:"Providers",models:"Models",providerConfig:"Provider config",modelConfig:"Model config",providerId:"Provider ID",api:"API type",baseUrl:"Base URL",apiKey:"API key",headers:"Headers JSON",authHeader:"Use auth header",modelId:"Model ID",modelName:"Model name",reasoning:"Reasoning model",contextWindow:"Context window",maxTokens:"Max output",input:"Input types",costInput:"Input cost / 1M",costOutput:"Output cost / 1M",costCacheRead:"Cache read cost / 1M",costCacheWrite:"Cache write cost / 1M",currency:"Currency",modelAdvanced:"Model advanced JSON",validate:"Validate",preview:"Preview diff",cancel:"Cancel",apply:"Apply",confirm:"OK",valid:"Config is valid",invalid:"Config is invalid"}};
var lang="zh",zoom=1,config=${safeConfig},providerIndex=0,modelIndex=0,activeCurrency="CNY";
function el(id){return document.getElementById(id)}function t(key){return UI_TEXT[lang][key]||key}function texts(){document.querySelectorAll("[data-i18n]").forEach(function(node){node.textContent=t(node.dataset.i18n)});el("gd-lang").textContent=lang==="zh"?"EN":"中文"}
function providerEntries(){return Object.entries(config.providers||{})}function selectedProvider(){return providerEntries()[providerIndex]||null}function selectedModel(){var p=selectedProvider();return p&&Array.isArray(p[1].models)?p[1].models[modelIndex]||null:null}
function renderLists(){var providers=providerEntries(),pl=el("provider-list"),ml=el("model-list");pl.textContent="";providers.forEach(function(entry,i){var row=document.createElement("div");row.className="item"+(i===providerIndex?" active":"");row.tabIndex=i===providerIndex?0:-1;row.role="option";row.textContent=entry[0];row.addEventListener("click",function(){saveForm();providerIndex=i;modelIndex=0;render()});pl.appendChild(row)});ml.textContent="";var p=selectedProvider(),models=p&&Array.isArray(p[1].models)?p[1].models:[];models.forEach(function(model,i){var row=document.createElement("div");row.className="item"+(i===modelIndex?" active":"");row.tabIndex=i===modelIndex?0:-1;row.role="option";row.textContent=model.name||model.id;row.addEventListener("click",function(){saveForm();modelIndex=i;render()});ml.appendChild(row)})}
function json(value){return JSON.stringify(value===undefined?{}:value,null,2)}function known(source,keys){var out={};Object.keys(source||{}).forEach(function(key){if(!keys.includes(key))out[key]=source[key]});return out}function costValue(value){var number=typeof value==="number"?value:0;return activeCurrency==="CNY"?number*7:number}
function renderForm(){var p=selectedProvider(),m=selectedModel(),provider=p?p[1]:{},model=m||{};el("provider-id").value=p?p[0]:"";var api=provider.api||"openai-completions",apiOption=el("provider-api").querySelector('option[value="'+api+'"]');if(!apiOption){apiOption=document.createElement("option");apiOption.value=api;apiOption.textContent=api;el("provider-api").appendChild(apiOption)}el("provider-api").value=api;el("provider-base-url").value=provider.baseUrl||"";el("provider-api-key").value=provider.apiKey||"";el("provider-headers").value=json(provider.headers);el("provider-auth-header").checked=provider.authHeader===true;el("model-id").value=model.id||"";el("model-name").value=model.name||"";el("model-reasoning").checked=model.reasoning===true;el("model-context-window").value=model.contextWindow||"";el("model-max-tokens").value=model.maxTokens||"";el("model-input").value=Array.isArray(model.input)?model.input.join(","):"";el("currency").value=activeCurrency;["input","output","cacheRead","cacheWrite"].forEach(function(key){el("cost-"+(key==="cacheRead"?"cache-read":key==="cacheWrite"?"cache-write":key)).value=costValue(model.cost&&model.cost[key])});el("model-advanced-json").value=json(known(model,["id","name","api","reasoning","contextWindow","maxTokens","input","cost"]))}
function optional(target,key,value){if(value===""||value===undefined)delete target[key];else target[key]=value}function parsed(id){return JSON.parse(el(id).value||"{}")}function readCost(id){var value=Number(el(id).value);if(!Number.isFinite(value)||value<0)throw new Error("Invalid cost: "+id);return activeCurrency==="CNY"?value/7:value}
function saveForm(){var entry=selectedProvider();if(!entry)return;var oldId=entry[0],p=entry[1],newId=el("provider-id").value.trim()||oldId;optional(p,"api",el("provider-api").value.trim()||"openai-completions");optional(p,"baseUrl",el("provider-base-url").value.trim());optional(p,"apiKey",el("provider-api-key").value);p.headers=parsed("provider-headers");p.authHeader=el("provider-auth-header").checked;var m=selectedModel();if(m){var extra=parsed("model-advanced-json");Object.keys(m).forEach(function(key){if(!["id","name","api","reasoning","contextWindow","maxTokens","input","cost"].includes(key))delete m[key]});Object.assign(m,extra);m.id=el("model-id").value.trim();optional(m,"name",el("model-name").value.trim());m.reasoning=el("model-reasoning").checked;optional(m,"contextWindow",el("model-context-window").value?Number(el("model-context-window").value):"");optional(m,"maxTokens",el("model-max-tokens").value?Number(el("model-max-tokens").value):"");var inputs=el("model-input").value.split(",").map(function(x){return x.trim()}).filter(Boolean);optional(m,"input",inputs.length?inputs:"");m.cost=Object.assign({},m.cost,{input:readCost("cost-input"),output:readCost("cost-output"),cacheRead:readCost("cost-cache-read"),cacheWrite:readCost("cost-cache-write")})}if(newId!==oldId){var next={};Object.entries(config.providers).forEach(function(item){next[item[0]===oldId?newId:item[0]]=item[1]});config.providers=next}}
function render(){renderLists();renderForm();texts()}function send(action){try{if(action!=="cancel")saveForm();window.glimpse.send({action:action,config:config})}catch(error){status(String(error),false)}}
["validate","preview","apply","confirm","cancel"].forEach(function(action){el("b-"+action).addEventListener("click",function(){send(action)})});el("currency").addEventListener("change",function(){saveForm();activeCurrency=el("currency").value;renderForm()});el("gd-lang").addEventListener("click",function(){lang=lang==="zh"?"en":"zh";texts()});function setZoom(value){zoom=Math.max(.8,Math.min(1.5,Math.round(value*10)/10));document.body.style.zoom=String(zoom)}el("gd-zoom-out").addEventListener("click",function(){setZoom(zoom-.1)});el("gd-zoom-in").addEventListener("click",function(){setZoom(zoom+.1)});el("gd-zoom-reset").addEventListener("click",function(){setZoom(1)});
document.addEventListener("keydown",function(e){var mod=e.metaKey||e.ctrlKey;if(mod&&(e.key==="+"||e.key==="=")){setZoom(zoom+.1);e.preventDefault()}else if(mod&&e.key==="-"){setZoom(zoom-.1);e.preventDefault()}else if(mod&&e.key==="0"){setZoom(1);e.preventDefault()}else if(e.key==="ArrowDown"||e.key==="ArrowUp"){var list=e.target.closest(".list");if(list){var rows=Array.from(list.querySelectorAll(".item")),index=rows.indexOf(e.target),next=(index+(e.key==="ArrowDown"?1:-1)+rows.length)%rows.length;rows[next]?.click();rows[next]?.focus();e.preventDefault()}}});
window.addEventListener("message",function(e){var d=e.data||{};if(d.type==="config"){config=d.config;providerIndex=0;modelIndex=0;render()}if(d.type==="result")status(d.message,d.ok)});document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";document.documentElement.dataset.reduceMotion=String(matchMedia("(prefers-reduced-motion:reduce)").matches);render();
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
