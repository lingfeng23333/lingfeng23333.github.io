// ================================================================
// firebase-config.js — Firebase Initialization
// ================================================================

const firebaseConfig = {
    apiKey: "AIzaSyA_K0ieGWas5EMgv3E--dF5nUq4F0U5Awc",
    authDomain: "gekigame.firebaseapp.com",
    databaseURL: "https://gekigame-default-rtdb.firebaseio.com",
    projectId: "gekigame",
    storageBucket: "gekigame.firebasestorage.app",
    messagingSenderId: "890813310312",
    appId: "1:890813310312:web:1bf20599c6c5068728e2dd",
    measurementId: "G-34TYEVN3DB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Anonymous Auth for unique player IDs
let currentUser = null;

function initAuth() {
    return new Promise((resolve, reject) => {
        firebase.auth().signInAnonymously()
            .then((userCredential) => {
                currentUser = userCredential.user;
                console.log('[Firebase] Authenticated:', currentUser.uid);
                resolve(currentUser);
            })
            .catch((error) => {
                console.error('[Firebase] Auth error:', error);
                // Fallback: generate local UID
                currentUser = { uid: 'local_' + Math.random().toString(36).substr(2, 9) };
                resolve(currentUser);
            });
    });
}

function getUID() {
    return currentUser ? currentUser.uid : null;
}
