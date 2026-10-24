import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { authenticateMural, isMuralProtectedPath, muralAccessState, MURAL_OPENS_AT } from '../server/mural-access.mjs';

const before = MURAL_OPENS_AT - 60_000;
const secret = 'unit-test-only-not-a-real-password';
const request = (cookie='', ip='test-client') => ({ headers: { cookie, 'x-forwarded-for': ip }, socket: {} });
const cookieFrom = result => result.cookie.split(';')[0];

test('midnight Toronto is the exact automatic public-access boundary', () => {
  assert.equal(new Date(MURAL_OPENS_AT).toISOString(), '2026-11-20T05:00:00.000Z');
  assert.equal(muralAccessState(request(), {now:MURAL_OPENS_AT-1,secret}).authorized,false);
  assert.equal(muralAccessState(request(), {now:MURAL_OPENS_AT,secret:''}).authorized,true);
  assert.equal(muralAccessState(request(), {now:MURAL_OPENS_AT+1,secret:''}).requiresPassphrase,false);
});
test('unset password fails closed before the birthday, not after it', () => {
  assert.equal(muralAccessState(request(),{now:before,secret:''}).authorized,false);
  assert.equal(authenticateMural(request(),'anything',{now:before,secret:''}).status,503);
  assert.equal(authenticateMural(request(),'',{now:MURAL_OPENS_AT,secret:''}).authorized,true);
});
test('correct password grants an HttpOnly signed session, not a client-side password', () => {
  const session=authenticateMural(request(),'unit-test-only-not-a-real-password',{now:before,secret});
  assert.equal(session.status,200);
  assert.match(session.cookie,/HttpOnly/);assert.match(session.cookie,/SameSite=Strict/);assert.match(session.cookie,/Path=\/api/);
  assert.ok(!session.cookie.includes(secret));
  assert.equal(muralAccessState(request(cookieFrom(session)),{now:before,secret}).authorized,true);
});
test('wrong passwords, forged cookies and a rotated secret do not authorize', () => {
  assert.equal(authenticateMural(request('', 'wrong-client'),'bad',{now:before,secret}).status,401);
  const session=authenticateMural(request(),secret,{now:before,secret});
  assert.equal(muralAccessState(request(cookieFrom(session)+'tampered'),{now:before,secret}).authorized,false);
  assert.equal(muralAccessState(request('noemi_mural_access=garbage'),{now:before,secret}).authorized,false);
  assert.equal(muralAccessState(request(cookieFrom(session)),{now:before,secret:'rotated'}).authorized,false);
});
test('HTTPS cookies are secure and expire exactly when the password requirement ends', () => {
  const httpsRequest={headers:{'x-forwarded-proto':'https','x-forwarded-for':'https-test'},socket:{}};
  const session=authenticateMural(httpsRequest,secret,{now:before,secret});
  assert.match(session.cookie,/; Secure$/);assert.match(session.cookie,/Max-Age=60/);
  assert.match(session.cookie,/Expires=Fri, 20 Nov 2026 05:00:00 GMT/);
});
test('repeated wrong attempts are throttled and recover after one minute', () => {
  const req=request('','throttle-client');
  for(let i=0;i<8;i++)assert.equal(authenticateMural(req,'wrong',{now:before,secret}).status,401);
  assert.equal(authenticateMural(req,secret,{now:before,secret}).status,429);
  assert.equal(authenticateMural(req,secret,{now:before+60_001,secret}).status,200);
});
test('all note, upload and position endpoints are protected, not destination choice', () => {
  for(const path of ['/api/messages','/api/messages/12/position','/api/prepare-image'])assert.equal(isMuralProtectedPath(path),true);
  for(const path of ['/api/choice','/api/mural-access','/api/health'])assert.equal(isMuralProtectedPath(path),false);
});
test('actual API denies every mural operation before touching the database', async () => {
  const { handleApi } = await import('../server/api.mjs');
  const realNow = Date.now;
  Date.now = () => before;
  try {
  for(const [method,path] of [['GET','/api/messages'],['POST','/api/messages'],['PATCH','/api/messages/1/position'],['POST','/api/prepare-image']]) {
    const req=Readable.from([]);req.headers={};req.method=method;req.socket={};
    let status,body;
    await handleApi(req,{writeHead(value){status=value;},end(value){body=JSON.parse(value);}},new URL(path,'http://localhost'));
    assert.equal(status,401);assert.equal(body.code,'MURAL_ACCESS_REQUIRED');
  }
  } finally { Date.now = realNow; }
});

test('Vercel access checks and protected denials also work without schema initialization', async () => {
  const { invokeApi } = await import('../api/_shared.mjs');
  const realNow = Date.now;
  Date.now = () => before;
  try {
    for (const path of ['/api/mural-access','/api/messages']) {
      const req=Readable.from([]);req.headers={host:'localhost'};req.method='GET';req.url=path;req.socket={};
      let status,body;
      await invokeApi(req,{writeHead(value){status=value;},setHeader(){},end(value){body=JSON.parse(value);}},path);
      assert.equal(status,path.endsWith('access')?200:401);
      assert.equal(path.endsWith('access')?body.authorized:body.code,path.endsWith('access')?false:'MURAL_ACCESS_REQUIRED');
    }
  } finally { Date.now = realNow; }
});
