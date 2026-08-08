let token=localStorage.getItem("sp_token"), me=null;
const T={
 en:{home:"Home",services:"Services",wallet:"Wallet",transactions:"Transactions",support:"Support",profile:"Profile",logout:"Logout",night:"Night mode",welcome:"WELCOME BACK",heroText:"Manage services, wallet and applications from one secure dashboard.",servicesEyebrow:"SERVICES",available:"Available Services",lastActivity:"Last Account Activity",recharge:"Recharge Wallet",rechargeText:"Add funds using your authorised payment gateway.",continuePayment:"Continue to payment"},
 hi:{home:"होम",services:"सेवाएं",wallet:"वॉलेट",transactions:"लेन-देन",support:"सपोर्ट",profile:"प्रोफाइल",logout:"लॉगआउट",night:"नाइट मोड",welcome:"वापसी पर स्वागत है",heroText:"एक सुरक्षित डैशबोर्ड से सेवाएं, वॉलेट और आवेदन मैनेज करें।",servicesEyebrow:"सेवाएं",available:"उपलब्ध सेवाएं",lastActivity:"हाल की गतिविधि",recharge:"वॉलेट रिचार्ज",rechargeText:"अपने अधिकृत पेमेंट गेटवे से राशि जोड़ें।",continuePayment:"पेमेंट जारी रखें"},
 hinglish:{home:"Home",services:"Services",wallet:"Wallet",transactions:"Transactions",support:"Support",profile:"Profile",logout:"Logout",night:"Night mode",welcome:"WELCOME BACK",heroText:"Ek secure dashboard se services, wallet aur applications manage karein.",servicesEyebrow:"SERVICES",available:"Available Services",lastActivity:"Last Account Activity",recharge:"Wallet Recharge",rechargeText:"Apne authorised payment gateway se balance add karein.",continuePayment:"Payment Continue Karein"}
};
const ICONS={aadhaar:"🪪",samagra:"◎",details:"🔎",nsdl:"💳",pan:"▣",vehicle:"🏍️",ration:"◉",voter:"☝️",farmer:"🌾",electricity:"⚡",rtps:"SP",janaadhaar:"जन",familyid:"FamilyID",learning:"TEST",other:"▣"};
function api(url,opt={}){opt.headers={...(opt.headers||{}),Authorization:`Bearer ${token}`};return fetch(url,opt).then(async r=>{let d=await r.json();if(r.status===401){logout();throw Error("Login required")}if(!r.ok)throw Error(d.error||"Request failed");return d})}
async function login(e){e.preventDefault();try{let d=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:username.value,password:password.value})}).then(r=>r.json());if(!d.token)throw Error(d.error);token=d.token;localStorage.setItem("sp_token",token);showApp()}catch(e){alert(e.message)}}
loginForm.addEventListener("submit",login);
async function showApp(){loginScreenHide();me=(await api("/api/me")).user;name.textContent=me.name;avatar.textContent=me.name.slice(0,2).toUpperCase();wallet.textContent="₹"+Number(me.wallet_balance).toLocaleString("en-IN",{minimumFractionDigits:2});verification.textContent=me.verification_status;loadServices();loadTransactions()}
function loginScreenHide(){document.getElementById("login").classList.add("hidden");document.getElementById("app").classList.remove("hidden")}
async function loadServices(){let d=await api("/api/services");serviceGrid.innerHTML=d.services.filter(s=>s.enabled).map(s=>`<article class="card"><div class="service-logo">${ICONS[s.service_key]||"▣"}</div><h3>${s.name}</h3><p>Secure authorised service workflow</p><button onclick="openService('${s.service_key}','${s.name.replaceAll("'","")}')">Open service →</button></article>`).join("")}
function openService(key,name){if(["pan","voter","aadhaar","digilocker"].includes(key)){alert(`${name}: provider integration is ready to connect after authorised API credentials are configured.`)}else alert(`${name}: service module selected. Connect its authorised provider.`)}
async function loadTransactions(){let d=await api("/api/transactions");txnBody.innerHTML=d.transactions.length?d.transactions.map(x=>`<tr><td>${x.service}</td><td>${x.type}</td><td>₹${x.amount}</td><td>${x.description||"-"}</td><td>${x.created_at}</td><td><span class="badge">${x.status}</span></td><td>${me.id}</td></tr>`).join(""):`<tr><td colspan="7">No transactions yet.</td></tr>`}
function setAmount(v){amount.value=v; document.getElementById("paymentBox").classList.remove("hidden")}
rechargeForm.addEventListener("submit",async e=>{
 e.preventDefault(); const v=Number(amount.value);
 if(!Number.isFinite(v)||v<20){alert("Minimum recharge is ₹20.");return}
 document.getElementById("paymentBox").classList.remove("hidden");
})
function copyUPI(){navigator.clipboard?.writeText("ahadkhan36639-3@okaxis");alert("UPI ID copied")}
async function submitPaymentProof(){
 const v=Number(amount.value), ref=String(document.getElementById("utr").value||"").trim();
 if(v<20){alert("Minimum recharge is ₹20.");return}
 if(!ref){alert("Payment/reference ID enter karein.");return}
 try{
   const d=await api("/api/recharge/proof",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:v,reference:ref})});
   document.getElementById("paymentNote").textContent=d.message||"Payment proof submitted for verification.";
 }catch(e){document.getElementById("paymentNote").textContent=e.message}
}
function logout(){if(token)api("/api/auth/logout",{method:"POST"}).catch(()=>{});localStorage.removeItem("sp_token");location.reload()}
function toggleLang(){langMenu.classList.toggle("show")}
function setLang(lang){localStorage.setItem("sp_lang",lang);langLabel.textContent=lang==="hi"?"Hindi / हिंदी":lang==="hinglish"?"Hinglish":"English";const x=T[lang];document.querySelectorAll("[data-i]").forEach(el=>{let k=el.dataset.i;if(x[k])el.textContent=x[k]});langMenu.classList.remove("show")}
function openChat(){chat.classList.add("show")}
function closeChat(){chat.classList.remove("show")}
chatForm.addEventListener("submit",async e=>{e.preventDefault();let q=chatInput.value.trim();if(!q)return;addMsg(q,"user");chatInput.value="";let wait=addMsg("Thinking…","bot");try{let d=await api("/api/support",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q})});wait.textContent=d.reply||d.error}catch(e){wait.textContent=e.message}})
function addMsg(t,c){let d=document.createElement("div");d.className="msg "+c;d.textContent=t;chatBody.appendChild(d);chatBody.scrollTop=chatBody.scrollHeight;return d}
if(token)showApp().catch(()=>{localStorage.removeItem("sp_token");document.getElementById("login").classList.remove("hidden")});
setLang(localStorage.getItem("sp_lang")||"en");
