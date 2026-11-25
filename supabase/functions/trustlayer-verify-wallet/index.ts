import { createClient } from 'npm:@supabase/supabase-js@2.119.2';
import bs58 from 'npm:bs58@6.0.0';
const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
 if(req.method!=='POST') return reply({error:'POST required'},405);
 const authorization=req.headers.get('authorization')||'';
 if(!authorization.startsWith('Bearer ')) return reply({error:'Authentication required'},401);
 const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await client.auth.getUser(authorization.slice(7));
 if(authError||!user) return reply({error:'Invalid or expired session'},401);
 try {
  const reader=req.body?.getReader(); if(!reader) return reply({error:'Body required'},400);
  const chunks:Uint8Array[]=[]; let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();return reply({error:'Request too large'},413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
  const {challengeId,signature}=JSON.parse(new TextDecoder().decode(bytes));
  if(typeof challengeId!=='string'||!/^[0-9a-f-]{36}$/i.test(challengeId)||typeof signature!=='string'||signature.length>128)return reply({error:'Invalid proof'},400);
  const {data:c,error}=await client.from('wallet_challenges').select('public_key,message,expires_at,consumed_at').eq('id',challengeId).eq('user_id',user.id).single();
  if(error||!c||c.consumed_at||Date.parse(c.expires_at)<=Date.now())return reply({error:'Challenge expired or already used. Request a new challenge.'},400);
  const publicKey=bs58.decode(c.public_key);const proof=Uint8Array.from(atob(signature),c=>c.charCodeAt(0));
  if(publicKey.length!==32||proof.length!==64)return reply({error:'Invalid signature'},400);
  const key=await crypto.subtle.importKey('raw',publicKey,{name:'Ed25519'},false,['verify']);
  if(!await crypto.subtle.verify('Ed25519',key,proof,new TextEncoder().encode(c.message)))return reply({error:'Signature verification failed'},400);
  const {error:consumeError}=await client.rpc('complete_wallet_challenge',{p_id:challengeId,p_user:user.id});
  if(consumeError)return reply({error:'Proof already used, expired, or wallet linked to another account.'},409);
  return reply({verified:true,publicKey:c.public_key});
 }catch{return reply({error:'Unable to verify wallet proof'},400);}
});
