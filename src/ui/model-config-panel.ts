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
:root{--surface:rgba(30,30,32,.82);--surface-2:rgba(255,255,255,.06);--surface-3:rgba(255,255,255,.11);--ink:#d4d4d4;--muted:#9a9aa2;--rule:rgba(255,255,255,.12);--primary:#3b82f6;--error:#f44747;--success:#4ec9b0;--radius:10px;--dur:140ms}
[data-theme="light"]{--surface:rgba(246,246,248,.88);--surface-2:rgba(0,0,0,.045);--surface-3:rgba(0,0,0,.09);--ink:#222226;--muted:#62626a;--rule:rgba(0,0,0,.14)}
[data-contrast="true"]{--muted:var(--ink);--rule:rgba(128,128,128,.55)}
*{box-sizing:border-box}html,body{height:100%;margin:0}body{background:transparent!important;color:var(--ink);font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;user-select:none}.shell{height:100vh;display:flex;flex-direction:column;overflow:hidden;background:var(--surface);-webkit-backdrop-filter:blur(24px) saturate(1.4);backdrop-filter:blur(24px) saturate(1.4);border:1px solid var(--rule);border-radius:14px;animation:appear var(--dur) ease-out}@keyframes appear{from{opacity:0;transform:translateY(4px)}}
header,.footer{flex:none;display:flex;align-items:center;gap:8px;padding:10px 14px;border-color:var(--rule);background:var(--surface-2);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}header{border-bottom:1px solid var(--rule)}.title{flex:1;font-weight:700}.workspace{flex:1;min-height:0;display:grid;grid-template-columns:180px 180px minmax(320px,1fr);overflow:hidden}.pane{min-width:0;overflow:auto;padding:12px;border-right:1px solid var(--rule)}.pane:last-child{border-right:0}.section-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-weight:700}.list{display:flex;flex-direction:column;gap:3px}.item{padding:7px 8px;border:1px solid transparent;border-radius:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis}.item:hover,.item.active{background:var(--surface-3);border-color:var(--rule)}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.field{min-width:0}.wide{grid-column:1/-1}label{display:block;margin-bottom:4px;color:var(--muted)}input,select,textarea,button{font:inherit;color:var(--ink)}input,select,textarea{width:100%;padding:7px 9px;background:var(--surface-2);border:1px solid var(--rule);border-radius:6px;user-select:text}input[type="checkbox"]{width:auto}textarea{min-height:90px;resize:vertical}.advanced{min-height:180px}.tool,.btn{padding:6px 10px;background:var(--surface-2);border:1px solid var(--rule);border-radius:6px;cursor:pointer}.tool:hover,.btn:hover{background:var(--surface-3)}.primary{background:var(--primary);border-color:transparent;color:white}.footer{justify-content:flex-end;border-top:1px solid var(--rule)}.status{margin-right:auto;color:var(--muted)}.status.error{color:var(--error)}.status.success{color:var(--success)}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,.item:focus-visible{outline:2px solid var(--primary);outline-offset:1px}kbd{color:var(--muted)}[data-reduce-motion="true"] *{animation:none!important;transition:none!important}
</style></head><body><div class="shell">
<header><span class="title" data-i18n="title"></span><button class="tool" id="gd-lang">EN</button><button class="tool" id="gd-zoom-out">A−</button><button class="tool" id="gd-zoom-in">A+</button><button class="tool" id="gd-zoom-reset">⟲</button></header>
<main class="workspace">
<section class="pane"><div class="section-title"><span data-i18n="providers"></span></div><div class="list" id="provider-list" role="listbox"></div></section>
<section class="pane"><div class="section-title"><span data-i18n="models"></span></div><div class="list" id="model-list" role="listbox"></div></section>
<section class="pane"><div class="form-grid">
<div class="field"><label for="provider-id" data-i18n="providerId"></label><input id="provider-id"></div>
<div class="field"><label for="provider-api" data-i18n="api"></label><input id="provider-api"></div>
<div class="field wide"><label for="provider-base-url" data-i18n="baseUrl"></label><input id="provider-base-url"></div>
<div class="field wide"><label for="provider-api-key" data-i18n="apiKey"></label><input id="provider-api-key" autocomplete="off"></div>
<div class="field wide"><label for="provider-headers" data-i18n="headers"></label><textarea id="provider-headers"></textarea></div>
<div class="field"><label><input id="provider-auth-header" type="checkbox"> <span data-i18n="authHeader"></span></label></div>
<div class="field"><label for="model-id" data-i18n="modelId"></label><input id="model-id"></div>
<div class="field"><label for="model-name" data-i18n="modelName"></label><input id="model-name"></div>
<div class="field"><label for="model-api" data-i18n="api"></label><input id="model-api"></div>
<div class="field"><label><input id="model-reasoning" type="checkbox"> <span data-i18n="reasoning"></span></label></div>
<div class="field"><label for="model-context-window" data-i18n="contextWindow"></label><input id="model-context-window" type="number"></div>
<div class="field"><label for="model-max-tokens" data-i18n="maxTokens"></label><input id="model-max-tokens" type="number"></div>
<div class="field wide"><label for="model-input" data-i18n="input"></label><input id="model-input" placeholder="text,image"></div>
<div class="field wide"><label for="model-advanced-json" data-i18n="modelAdvanced"></label><textarea id="model-advanced-json"></textarea></div>
<div class="field wide"><label for="advanced-json" data-i18n="advanced"></label><textarea class="advanced" id="advanced-json"></textarea></div>
</div></section></main>
<footer class="footer"><span class="status" id="status"></span><button class="btn" id="b-import" data-i18n="import"></button><button class="btn" id="b-validate" data-i18n="validate"></button><button class="btn" id="b-preview" data-i18n="preview"></button><button class="btn" id="b-cancel" data-i18n="cancel"></button><button class="btn primary" id="b-apply" data-i18n="apply"></button></footer>
</div><script>
var UI_TEXT={zh:{title:"模型配置",providers:"供应商",models:"模型",providerId:"供应商 ID",api:"API 类型",baseUrl:"基础 URL",apiKey:"API Key（密钥）",headers:"Headers（请求头 JSON）",authHeader:"使用认证请求头",modelId:"模型 ID",modelName:"模型名称",reasoning:"推理模型",contextWindow:"上下文窗口",maxTokens:"最大输出",input:"输入类型",modelAdvanced:"模型高级字段 JSON",advanced:"完整配置 JSON（含未知字段）",import:"导入 YAML",validate:"校验",preview:"预览差异",cancel:"取消 Esc",apply:"确认应用",valid:"配置有效",invalid:"配置无效"},en:{title:"Model Config",providers:"Providers",models:"Models",providerId:"Provider ID",api:"API type",baseUrl:"Base URL",apiKey:"API key",headers:"Headers JSON",authHeader:"Use auth header",modelId:"Model ID",modelName:"Model name",reasoning:"Reasoning model",contextWindow:"Context window",maxTokens:"Max output",input:"Input types",modelAdvanced:"Model advanced JSON",advanced:"Full config JSON (unknown fields included)",import:"Import YAML",validate:"Validate",preview:"Preview diff",cancel:"Cancel Esc",apply:"Confirm apply",valid:"Config is valid",invalid:"Config is invalid"}};
var lang="zh",zoom=1,config=${safeConfig},providerIndex=0,modelIndex=0;
function el(id){return document.getElementById(id)}function t(key){return UI_TEXT[lang][key]||key}function texts(){document.querySelectorAll("[data-i18n]").forEach(function(node){node.textContent=t(node.dataset.i18n)});el("gd-lang").textContent=lang==="zh"?"EN":"中文"}
function providerEntries(){return Object.entries(config.providers||{})}function selectedProvider(){return providerEntries()[providerIndex]||null}function selectedModel(){var p=selectedProvider();return p&&Array.isArray(p[1].models)?p[1].models[modelIndex]||null:null}
function renderLists(){var providers=providerEntries(),pl=el("provider-list"),ml=el("model-list");pl.textContent="";providers.forEach(function(entry,i){var row=document.createElement("div");row.className="item"+(i===providerIndex?" active":"");row.tabIndex=i===providerIndex?0:-1;row.role="option";row.textContent=entry[0];row.addEventListener("click",function(){saveForm();providerIndex=i;modelIndex=0;render()});pl.appendChild(row)});ml.textContent="";var p=selectedProvider(),models=p&&Array.isArray(p[1].models)?p[1].models:[];models.forEach(function(model,i){var row=document.createElement("div");row.className="item"+(i===modelIndex?" active":"");row.tabIndex=i===modelIndex?0:-1;row.role="option";row.textContent=model.name||model.id;row.addEventListener("click",function(){saveForm();modelIndex=i;render()});ml.appendChild(row)})}
function json(value){return JSON.stringify(value===undefined?{}:value,null,2)}function known(source,keys){var out={};Object.keys(source||{}).forEach(function(key){if(!keys.includes(key))out[key]=source[key]});return out}
function renderForm(){var p=selectedProvider(),m=selectedModel(),provider=p?p[1]:{},model=m||{};el("provider-id").value=p?p[0]:"";el("provider-api").value=provider.api||"";el("provider-base-url").value=provider.baseUrl||"";el("provider-api-key").value=provider.apiKey||"";el("provider-headers").value=json(provider.headers);el("provider-auth-header").checked=provider.authHeader===true;el("model-id").value=model.id||"";el("model-name").value=model.name||"";el("model-api").value=model.api||"";el("model-reasoning").checked=model.reasoning===true;el("model-context-window").value=model.contextWindow||"";el("model-max-tokens").value=model.maxTokens||"";el("model-input").value=Array.isArray(model.input)?model.input.join(","):"";el("model-advanced-json").value=json(known(model,["id","name","api","reasoning","contextWindow","maxTokens","input"]));el("advanced-json").value=json(config)}
function optional(target,key,value){if(value===""||value===undefined)delete target[key];else target[key]=value}function parsed(id){return JSON.parse(el(id).value||"{}")}
function saveForm(){var entry=selectedProvider();if(!entry)return;var oldId=entry[0],p=entry[1],newId=el("provider-id").value.trim()||oldId;optional(p,"api",el("provider-api").value.trim());optional(p,"baseUrl",el("provider-base-url").value.trim());optional(p,"apiKey",el("provider-api-key").value);p.headers=parsed("provider-headers");p.authHeader=el("provider-auth-header").checked;var m=selectedModel();if(m){var extra=parsed("model-advanced-json");Object.keys(m).forEach(function(key){if(!["id","name","api","reasoning","contextWindow","maxTokens","input"].includes(key))delete m[key]});Object.assign(m,extra);m.id=el("model-id").value.trim();optional(m,"name",el("model-name").value.trim());optional(m,"api",el("model-api").value.trim());m.reasoning=el("model-reasoning").checked;optional(m,"contextWindow",el("model-context-window").value?Number(el("model-context-window").value):"");optional(m,"maxTokens",el("model-max-tokens").value?Number(el("model-max-tokens").value):"");var inputs=el("model-input").value.split(",").map(function(x){return x.trim()}).filter(Boolean);optional(m,"input",inputs.length?inputs:"")}if(newId!==oldId){var next={};Object.entries(config.providers).forEach(function(item){next[item[0]===oldId?newId:item[0]]=item[1]});config.providers=next}el("advanced-json").value=json(config)}
function useAdvanced(){config=JSON.parse(el("advanced-json").value);providerIndex=Math.min(providerIndex,Math.max(0,providerEntries().length-1));modelIndex=0;render()}function render(){renderLists();renderForm();texts()}function send(action){try{if(action!=="import"&&action!=="cancel")saveForm();window.glimpse.send({action:action,config:config})}catch(error){status(String(error),false)}}function status(message,ok){var node=el("status");node.textContent=message;node.className="status "+(ok?"success":"error")}
["import","validate","preview","apply","cancel"].forEach(function(action){el("b-"+action).addEventListener("click",function(){send(action)})});el("advanced-json").addEventListener("change",function(){try{useAdvanced();status(t("valid"),true)}catch(error){status(String(error),false)}});el("gd-lang").addEventListener("click",function(){lang=lang==="zh"?"en":"zh";texts()});function setZoom(value){zoom=Math.max(.8,Math.min(1.5,Math.round(value*10)/10));document.body.style.zoom=String(zoom)}el("gd-zoom-out").addEventListener("click",function(){setZoom(zoom-.1)});el("gd-zoom-in").addEventListener("click",function(){setZoom(zoom+.1)});el("gd-zoom-reset").addEventListener("click",function(){setZoom(1)});
document.addEventListener("keydown",function(e){var mod=e.metaKey||e.ctrlKey;if(mod&&(e.key==="+"||e.key==="=")){setZoom(zoom+.1);e.preventDefault()}else if(mod&&e.key==="-"){setZoom(zoom-.1);e.preventDefault()}else if(mod&&e.key==="0"){setZoom(1);e.preventDefault()}else if(e.key==="Escape")send("cancel");else if(e.key==="Enter"&&mod)send("apply");else if(e.key==="Enter"&&!e.target.closest("textarea"))send("preview");else if(e.key==="ArrowDown"||e.key==="ArrowUp"){var list=e.target.closest(".list");if(list){var rows=Array.from(list.querySelectorAll(".item")),index=rows.indexOf(e.target),next=(index+(e.key==="ArrowDown"?1:-1)+rows.length)%rows.length;rows[next]?.click();rows[next]?.focus();e.preventDefault()}}});
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
