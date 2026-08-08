require("dotenv").config();
const express=require("express");
const path=require("path");
const crypto=require("crypto");
const {db,sha256}=require("./db/database");
const {panService,voterService,aadhaarService,digilockerService}=require("./services/providers");

const app=express();
app.use(express.json({limit:"100kb"}));
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,"..","public")));

const sessions=new Map();
const port=process.env.PORT||3000;

function userFromToken(token){
  const id=sessions.get(token);
  if(!id) return null;
  return db.prepare("SELECT id,username,name,wallet_balance,verification_status FROM users WHERE id=?").get(id);
}
function auth(req,res,next){
  const token=(req.headers.authorization||"").replace(/^Bearer\s+/,"");
  const user=userFromToken(token);
  if(!user) return res.status(401).json({error:"Login required"});
  req.user=user; req.token=token; next();
}

app.post("/api/auth/login",(req,res)=>{
  const {username,password}=req.body||{};
  const user=db.prepare("SELECT * FROM users WHERE username=?").get(username||"");
  if(!user || sha256(password||"")!==user.password_hash)
    return res.status(401).json({error:"Invalid username or password"});
  const token=crypto.randomBytes(32).toString("hex");
  sessions.set(token,user.id);
  res.json({token,user:{id:user.id,username:user.username,name:user.name,walletBalance:user.wallet_balance,verificationStatus:user.verification_status}});
});

app.post("/api/auth/logout",auth,(req,res)=>{sessions.delete(req.token);res.json({ok:true});});

app.get("/api/me",auth,(req,res)=>{
  res.json({user:req.user});
});

app.get("/api/services",auth,(req,res)=>{
  res.json({services:db.prepare("SELECT service_key,name,enabled,charge FROM service_configs ORDER BY id").all()});
});

app.get("/api/transactions",auth,(req,res)=>{
  res.json({transactions:db.prepare("SELECT txn_ref,service,type,amount,description,status,created_at FROM transactions WHERE user_id=? ORDER BY id DESC LIMIT 20").all(req.user.id)});
});

app.post("/api/recharge/create",auth,(req,res)=>{
  const amount=Number(req.body?.amount);
  if(!Number.isFinite(amount)||amount<20||amount>100000) return res.status(400).json({error:"Minimum recharge is ₹20. Maximum recharge is ₹100,000."});
  const orderId="SP-RCH-"+Date.now()+"-"+crypto.randomBytes(3).toString("hex").toUpperCase();
  // Connect your authorised payment provider here. Never mark paid from the browser.
  res.json({ok:false,code:"PAYMENT_PROVIDER_NOT_CONFIGURED",orderId,message:"Payment gateway credentials are not configured yet."});
});

app.post("/api/recharge/proof",auth,(req,res)=>{
  const amount=Number(req.body?.amount);
  const reference=String(req.body?.reference||"").trim().slice(0,100);
  if(!Number.isFinite(amount)||amount<20||amount>100000) return res.status(400).json({error:"Invalid recharge amount."});
  if(!reference) return res.status(400).json({error:"Payment reference is required."});
  const txnRef="UPI-PENDING-"+Date.now()+"-"+crypto.randomBytes(3).toString("hex").toUpperCase();
  db.prepare("INSERT INTO transactions(user_id,txn_ref,service,type,amount,description,status) VALUES(?,?,?,?,?,?,?)")
    .run(req.user.id,txnRef,"Wallet Recharge","Credit",amount,`UPI reference: ${reference}`,"Pending");
  res.json({ok:true,status:"Pending",txnRef,message:"Payment proof submitted. Wallet credit will occur only after genuine payment verification."});
});

app.post("/api/service/:key",auth,async(req,res)=>{
  const key=req.params.key;
  const cfg=db.prepare("SELECT * FROM service_configs WHERE service_key=?").get(key);
  if(!cfg || !cfg.enabled) return res.status(404).json({error:"Service unavailable"});
  let result;
  if(key==="pan") result=await panService(req.body);
  else if(key==="voter") result=await voterService(req.body);
  else if(key==="aadhaar") result=await aadhaarService(req.body);
  else if(key==="digilocker") result=await digilockerService(req.body);
  else result={ok:false,code:"NO_PROVIDER",message:"This service needs its authorised provider integration."};
  res.json(result);
});

app.post("/api/support",auth,async(req,res)=>{
  const message=String(req.body?.message||"").trim();
  if(!message) return res.status(400).json({error:"Message required"});
  const safe={
    name:req.user.name,
    walletBalance:req.user.wallet_balance,
    verificationStatus:req.user.verification_status,
    recentTransactions:db.prepare("SELECT service,type,amount,status,txn_ref,created_at FROM transactions WHERE user_id=? ORDER BY id DESC LIMIT 5").all(req.user.id)
  };
  if(!process.env.BLACKBOX_API_KEY){
    return res.json({reply:"AI support is not configured yet. Your account is active; please contact human support."});
  }
  const system=`You are Sharma Print customer support. Be concise and polite. Use ONLY supplied account context; never invent account facts. Never ask for password, OTP, API key, or full government ID number. If a government-document action is requested, explain that it requires the authorised service provider and consent flow. Account context: ${JSON.stringify(safe)}`;
  try{
    const r=await fetch("https://api.blackbox.ai/chat/completions",{
      method:"POST",
      headers:{"Authorization":`Bearer ${process.env.BLACKBOX_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({model:process.env.BLACKBOX_MODEL||"blackboxai/anthropic/claude-opus-4.8",messages:[{role:"system",content:system},{role:"user",content:message}],stream:false})
    });
    const data=await r.json();
    if(!r.ok) return res.status(502).json({error:"AI provider error"});
    res.json({reply:data?.choices?.[0]?.message?.content||"I could not generate a reply."});
  }catch(e){res.status(502).json({error:"AI support unavailable"});}
});

app.get("*",(_req,res)=>res.sendFile(path.join(__dirname,"..","public","index.html")));
app.listen(port,()=>console.log(`Sharma Print: http://localhost:${port}`));
