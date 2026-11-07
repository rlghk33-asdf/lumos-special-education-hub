import { firebaseConfig } from './firebase-config.js';
import { validateEntry } from './core.mjs';
export const configured = Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId && firebaseConfig?.authDomain && firebaseConfig?.appId);
let services;
export async function connect(onUser) {
  if (!configured) return;
  const [app, authSDK, dbSDK] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js')
  ]);
  const instance = app.initializeApp(firebaseConfig);
  const auth = authSDK.getAuth(instance);
  await authSDK.setPersistence(auth, authSDK.browserSessionPersistence);
  // Memory cache only: private diary content is never persisted to IndexedDB.
  const db = dbSDK.initializeFirestore(instance, { localCache: dbSDK.memoryLocalCache() });
  services = { auth, db, a: authSDK, d: dbSDK };
  authSDK.onAuthStateChanged(auth, onUser);
}
export async function login() {
  if (!services) throw new Error('Firebase 연결을 확인해 주세요.');
  const provider = new services.a.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return services.a.signInWithPopup(services.auth, provider);
}
export async function logout() { await services.a.signOut(services.auth); }
function owner() {
  const uid = services?.auth.currentUser?.uid;
  if (!uid) throw new Error('다시 로그인해 주세요.');
  return uid;
}
export async function loadEntries() {
  const {db, d} = services;
  const snapshot = await d.getDocsFromServer(d.collection(db, 'users', owner(), 'entries'));
  return snapshot.docs.map(item=>({id:item.id,...item.data()})).sort((a,b)=>b.date.localeCompare(a.date));
}
export async function saveEntry(id, entry) {
  const error = validateEntry(entry);
  if (error) throw new Error(error);
  const {db,d} = services;
  const collection = d.collection(db, 'users', owner(), 'entries');
  const reference = id ? d.doc(collection,id) : d.doc(collection);
  const value = { ...entry, updatedAt: d.serverTimestamp() };
  if (id) await d.updateDoc(reference, value);
  else await d.setDoc(reference, {...value, createdAt:d.serverTimestamp()});
  return reference.id;
}
export async function deleteEntry(id) {
  const {db,d} = services;
  await d.deleteDoc(d.doc(db,'users',owner(),'entries',id));
}
