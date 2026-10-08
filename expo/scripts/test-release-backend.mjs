import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

function handler(name, createClient) {
  const source = readFileSync(new URL(`../../supabase/functions/${name}/index.ts`,import.meta.url),'utf8');
  let serve;
  const context = vm.createContext({ Request, Response, TextEncoder, crypto:webcrypto, console,
    createClient, Deno:{env:{get:key=>key},serve:fn=>{serve=fn;}} });
  vm.runInContext(stripTypeScriptTypes(source.replace(/^import .*;\r?\n/gm,''),{mode:'transform'}),context);
  return serve;
}
const request = body => new Request('https://unit.invalid', {method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify(body)});
const auth = { getUser:async()=>({data:{user:{id:'user-a',identities:[],app_metadata:{}}}}) };

test('account deletion uses one Auth transaction; failure never deletes application rows separately', async()=>{
  for (const fail of [false,true]) {
    let deletes=0;
    const admin={rpc:async()=>({data:null}),auth:{admin:{deleteUser:async id=>{assert.equal(id,'user-a');deletes++;return {error:fail?{code:'db_error'}:null};}}},from:()=>{throw Error('separate deletion forbidden');}};
    const serve=handler('delete-account',(_,key)=>key==='SUPABASE_SERVICE_ROLE_KEY'?admin:{auth});
    const response=await serve(request({}));
    assert.equal(response.status,fail?500:200);assert.equal(deletes,1);
    assert.equal((await response.json()).success,fail?undefined:true);
  }
});
test('business deletion must durably save a request before reporting pending and never calls deleteUser',async()=>{
  let inserts=0;let deletes=0;
  const query={select(){return this;},eq(){return this;},single:async()=>({data:{id:'request-a'}}),upsert:async(_,options)=>{assert.equal(options.ignoreDuplicates,true);inserts++;return {};}};
  const admin={rpc:async()=>({data:'business_dependencies'}),from:table=>{assert.equal(table,'account_deletion_requests');return query;},auth:{admin:{deleteUser:async()=>{deletes++;}}}};
  const serve=handler('delete-account',(_,key)=>key==='SUPABASE_SERVICE_ROLE_KEY'?admin:{auth});
  const response=await serve(request({}));const body=await response.json();
  assert.equal(body.status,'pending');assert.equal(body.request_id,'request-a');assert.equal(body.success,false);
  assert.equal(inserts,1);assert.equal(deletes,0);
});
test('an unauthenticated deletion cannot inspect or remove account data',async()=>{
  const serve=handler('delete-account',()=>{throw Error('must not connect');});
  assert.equal((await serve(new Request('https://unit.invalid',{method:'POST'}))).status,401);
});

function statusHarness({concurrent=false,updateError=false}={}) {
  let reads=0;const filters=[];
  const issued={id:'id',user_id:'user-a',status:'issued',expires_at:new Date(Date.now()-1000).toISOString()};
  const admin={from:table=>{
    let updating=false;
    const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},update(){updating=true;return q;},maybeSingle:async()=>{
      if(table==='redemptions')return {data:null};
      if(updating)return {data:concurrent?null:{id:'id'},error:updateError?{}:null};
      reads++;return {data:reads===1?issued:{...issued,status:'consumed',consumed_at:new Date().toISOString()}};
    }};return q;
  }};
  return {serve:handler('get-redemption-window-status',(_,key)=>key==='SUPABASE_SERVICE_ROLE_KEY'?admin:{auth}),filters};
}
test('last-second consumed QR wins over the expiry update race',async()=>{
  const h=statusHarness({concurrent:true});
  const body=await (await h.serve(request({token:'CGI-ABCDEF-'+'A'.repeat(32)}))).json();
  assert.equal(body.status,'consumed');assert.equal(h.filters.filter(([key,value])=>key==='user_id'&&value==='user-a').length,2);
});
test('unconsumed elapsed QR expires; database uncertainty is never shown as expiry',async()=>{
  for(const updateError of [false,true]) {
    const h=statusHarness({updateError});const response=await h.serve(request({token:'CGI-ABCDEF-'+'A'.repeat(32)}));
    const body=await response.json();assert.equal(response.status,updateError?500:200);
    assert.equal(body.status,updateError?undefined:'expired');
  }
});
test('activity strips raw QR, location, arbitrary metadata and IP address before writing',async()=>{
  const writes=[];
  const db={auth,from:table=>{
    const q={select(){return q;},eq(){return q;},gte:async()=>({count:0}),insert:async value=>{writes.push(value);return {};},update(){return {eq:async()=>({})};}};return q;
  }};
  const serve=handler('log-user-activity',()=>db);
  const response=await serve(request({event_type:'qr_generated',device_info:'ios',app_version:'1.0.0',metadata:{source:'mobile',flow:'free_drink',token:'SECRET',latitude:47.5,query:'private',duration_ms:123.4}}));
  assert.equal(response.status,200);assert.equal(writes[0].user_id,'user-a');assert.equal(writes[0].ip_address,null);
  assert.deepEqual(JSON.parse(JSON.stringify(writes[0].metadata)),{source:'mobile',flow:'free_drink',duration_ms:123});
});
test('activity rejects malformed events and limits request volume',async()=>{
  let writes=0;
  const q={select(){return q;},eq(){return q;},gte:async()=>({count:120}),insert:async()=>{writes++;return {};}};
  const serve=handler('log-user-activity',()=>({auth,from:()=>q}));
  assert.equal((await serve(request({event_type:'unknown'}))).status,400);
  assert.equal((await serve(request({event_type:'app_open'}))).status,429);
  assert.equal((await serve(request(null))).status,400);assert.equal(writes,0);
});
