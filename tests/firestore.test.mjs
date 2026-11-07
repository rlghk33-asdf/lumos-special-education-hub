// Run inside Firebase emulators: npm run test:rules
import test, { before, after, beforeEach } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require=createRequire(path.resolve(process.env.LUMOS_TEST_DEPENDENCIES||'.','package.json'));
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,collection,updateDoc,deleteDoc,serverTimestamp,Timestamp}=require('firebase/firestore');
let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-lumos',firestore:{rules:await readFile('firestore.rules','utf8')}});});
after(async()=>{await env?.cleanup();});
beforeEach(async()=>{await env.clearFirestore();});
const db=(uid='teacher-a',provider='google.com')=>env.authenticatedContext(uid,{firebase:{sign_in_provider:provider}}).firestore();
const entry=()=>({date:'2026-11-07',title:'오늘의 성찰',body:'작은 변화에 감사한 하루',mood:'calm',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
test('owner can create, read, update and delete own entry',async()=>{const ref=doc(db(),'users/teacher-a/entries/one');await assertSucceeds(setDoc(ref,entry()));await assertSucceeds(getDoc(ref));await assertSucceeds(updateDoc(ref,{title:'수정한 성찰',updatedAt:serverTimestamp()}));await assertSucceeds(getDocs(collection(db(),'users/teacher-a/entries')));await assertSucceeds(deleteDoc(ref));});
test('unauthenticated and other users cannot read, list or write diary entries',async()=>{await setDoc(doc(db(),'users/teacher-a/entries/one'),entry());for(const client of [env.unauthenticatedContext().firestore(),db('teacher-b')]){const ref=doc(client,'users/teacher-a/entries/one');await assertFails(getDoc(ref));await assertFails(getDocs(collection(client,'users/teacher-a/entries')));await assertFails(setDoc(ref,entry()));await assertFails(updateDoc(ref,{title:'탈취',updatedAt:serverTimestamp()}));await assertFails(deleteDoc(ref));}});
test('anonymous provider and public profiles are denied',async()=>{await assertFails(setDoc(doc(db('teacher-a','anonymous'),'users/teacher-a/entries/one'),entry()));await assertFails(setDoc(doc(db(),'users/teacher-a'),{isAdmin:true}));});
test('create rejects unknown fields, missing fields, wrong types and oversized content',async()=>{const invalid=[{...entry(),ownerId:'teacher-b'},{...entry(),body:'x'.repeat(10001)},{...entry(),title:123},{...entry(),mood:'admin'},{...entry(),title:''},{...entry(),date:'invalid'}];const missing=entry();delete missing.body;invalid.push(missing);for(const value of invalid)await assertFails(setDoc(doc(db(),'users/teacher-a/entries/one'),value));});
test('updates cannot bypass schema or change creation timestamp',async()=>{const ref=doc(db(),'users/teacher-a/entries/one');await setDoc(ref,entry());for(const patch of [{extra:'bad'},{body:'x'.repeat(10001)},{title:123},{createdAt:Timestamp.fromMillis(0)},{updatedAt:Timestamp.fromMillis(0)}])await assertFails(updateDoc(ref,{...patch,...(!('updatedAt'in patch)?{updatedAt:serverTimestamp()}:{})}));const missing=entry();delete missing.body;await assertFails(setDoc(ref,missing));});
