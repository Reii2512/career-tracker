// ==========================================
// 1. KONFIGURASI FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyA7vQkiF5tCxRPpyXPFLfdArBLc_TXeQCA",
  authDomain: "job-hunting-tracker25.firebaseapp.com",
  projectId: "job-hunting-tracker25",
  storageBucket: "job-hunting-tracker25.firebasestorage.app",
  messagingSenderId: "999890485754",
  appId: "1:999890485754:web:f040413b359f6c6cefa443",
  measurementId: "G-XRG0YZF1YR"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================
// 2. REFERENSI ELEMEN DOM
// ==========================================
const loginScreen = document.getElementById('loginScreen');
const appContainer = document.getElementById('appContainer');
const btnGoogleLogin = document.getElementById('btnGoogleLogin');
const btnLogout = document.getElementById('btnLogout');
const userDisplayName = document.getElementById('userDisplayName');

const jobForm = document.getElementById('jobForm');
const jobList = document.getElementById('jobList');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');

// Variable Global State
let currentUser = null;
let jobs = [];
let editingDocId = null;
let myChart = null;

// Set default input tanggal ke hari ini
if (document.getElementById('date')) {
    document.getElementById('date').valueAsDate = new Date();
}

// ==========================================
// 3. AUTHENTICATION (LOGIN & LOGOUT)
// ==========================================

// Tombol Login Google
btnGoogleLogin.addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await auth.signInWithRedirect(provider);
    } catch (error) {
        alert("Gagal memulai login: " + error.message);
    }
});

// Menangkap hasil setelah user ter-redirect balik dari Google Login
auth.getRedirectResult().then((result) => {
    if (result.user) {
        console.log("Berhasil login:", result.user.displayName);
    }
}).catch((error) => {
    if (error.code && error.code !== 'auth/popup-closed-by-user') {
        alert("Gagal autentikasi: " + error.message);
    }
});

// Tombol Logout
btnLogout.addEventListener('click', () => {
    auth.signOut().then(() => {
        loginScreen.style.display = 'flex';
        appContainer.style.display = 'none';
        jobs = [];
    }).catch((err) => {
        alert("Gagal logout: " + err.message);
    });
});

// Listener Perubahan Status User Login
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        userDisplayName.textContent = user.displayName || user.email;
        loginScreen.style.display = 'none';
        appContainer.style.display = 'block';
        
        // Mulai dengarkan data di Firestore khusus user ini
        listenJobsData();
    } else {
        currentUser = null;
        loginScreen.style.display = 'flex';
        appContainer.style.display = 'none';
    }
});

// ==========================================
// 4. FIRESTORE DATABASE OPERATIONS
// ==========================================

// Mendengarkan data lamaran secara Realtime
function listenJobsData() {
    if (!currentUser) return;

    db.collection('users')
      .doc(currentUser.uid)
      .collection('jobs')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
          jobs = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          }));
          renderJobs();
      }, (err) => {
          console.error("Firestore Error:", err);
      });
}

// Simpan atau Update Data Lamaran
jobForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const jobData = {
        company: document.getElementById('company').value.trim(),
        position: document.getElementById('position').value.trim(),
        workType: document.getElementById('workType').value,
        platform: document.getElementById('platform').value,
        date: document.getElementById('date').value,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const userJobsRef = db.collection('users').doc(currentUser.uid).collection('jobs');

    try {
        if (editingDocId !== null) {
            // Mode Update
            await userJobsRef.doc(editingDocId).update(jobData);
            editingDocId = null;
            
            const submitBtn = jobForm.querySelector('.btn-submit');
            submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Simpan Lamaran`;
            submitBtn.style.background = '#2563eb';
        } else {
            // Mode Tambah Baru
            jobData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await userJobsRef.add(jobData);
        }

        jobForm.reset();
        document.getElementById('date').valueAsDate = new Date();
    } catch (err) {
        alert("Gagal menyimpan data: " + err.message);
    }
});

// Mengisi Form untuk Mode Edit
window.editJob = function(docId) {
    const job = jobs.find(j => j.id === docId);
    if (!job) return;

    editingDocId = docId;
    document.getElementById('company').value = job.company;
    document.getElementById('position').value = job.position;
    document.getElementById('workType').value = job.workType;
    document.getElementById('platform').value = job.platform;
    document.getElementById('date').value = job.date;
    document.getElementById('status').value = job.status;
    document.getElementById('notes').value = job.notes || '';

    const submitBtn = jobForm.querySelector('.btn-submit');
    submitBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Update Lamaran`;
    submitBtn.style.background = '#f59e0b';

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Hapus Data Lamaran
window.deleteJob = async function(docId) {
    if (confirm('Yakin ingin menghapus lamaran ini?')) {
        try {
            if (editingDocId === docId) {
                editingDocId = null;
                jobForm.reset();
                const submitBtn = jobForm.querySelector('.btn-submit');
                submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Simpan Lamaran`;
                submitBtn.style.background = '#2563eb';
            }
            await db.collection('users').doc(currentUser.uid).collection('jobs').doc(docId).delete();
        } catch (err) {
            alert("Gagal menghapus data: " + err.message);
        }
    }
};

// ==========================================
// 5. RENDER UI, STATS & CHART
// ==========================================

// Update Counter & Chart
function updateStats() {
    const applied = jobs.filter(j => j.status === 'Applied').length;
    const interview = jobs.filter(j => j.status === 'Interview').length;
    const offered = jobs.filter(j => j.status === 'Offered').length;
    const rejected = jobs.filter(j => j.status === 'Rejected').length;

    document.getElementById('statApplied').textContent = applied;
    document.getElementById('statInterview').textContent = interview;
    document.getElementById('statOffered').textContent = offered;
    document.getElementById('statRejected').textContent = rejected;

    if (typeof Chart !== 'undefined') {
        renderChart(applied, interview, offered, rejected);
    }
}

// Render Doughnut Chart dengan Chart.js
function renderChart(applied, interview, offered, rejected) {
    const canvas = document.getElementById('statusChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Applied', 'Interview', 'Offered', 'Rejected'],
            datasets: [{
                data: [applied, interview, offered, rejected],
                backgroundColor: ['#38bdf8', '#f59e0b', '#22c55e', '#ef4444'],
                borderWidth: 2,
                borderColor: '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 }
                }
            },
            cutout: '70%'
        }
    });
}

// Render Daftar Kartu Lamaran
function renderJobs() {
    updateStats();
    jobList.innerHTML = '';

    const query = searchInput.value.toLowerCase();
    const filter = filterStatus.value;

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = (job.company || '').toLowerCase().includes(query) || (job.position || '').toLowerCase().includes(query);
        const matchesFilter = filter === 'All' || job.status === filter;
        return matchesSearch && matchesFilter;
    });

    if (filteredJobs.length === 0) {
        jobList.innerHTML = `<p style="text-align:center; color:#64748b; padding:30px 0; font-size:13px;">Tidak ada data lamaran ditemukan.</p>`;
        return;
    }

    filteredJobs.forEach((job) => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.innerHTML = `
            <div class="job-card-header">
                <div>
                    <div class="company-name">${job.company}</div>
                    <div class="job-position">${job.position}</div>
                </div>
                <span class="badge ${job.status}">${job.status}</span>
            </div>

            <div class="job-tags">
                <span class="tag"><i class="fa-solid fa-briefcase"></i> ${job.workType}</span>
                <span class="tag"><i class="fa-solid fa-globe"></i> ${job.platform}</span>
            </div>

            ${job.notes ? `<div class="job-notes"><i class="fa-solid fa-note-sticky"></i> ${job.notes}</div>` : ''}

            <div class="card-actions">
                <span class="date-text"><i class="fa-regular fa-calendar"></i> ${job.date}</span>
                <div>
                    <button type="button" class="btn-delete" style="color:#38bdf8; margin-right:12px;" onclick="editJob('${job.id}')"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                    <button type="button" class="btn-delete" onclick="deleteJob('${job.id}')"><i class="fa-solid fa-trash"></i> Hapus</button>
                </div>
            </div>
        `;
        jobList.appendChild(card);
    });
}

// Event Listener Search & Filter
searchInput.addEventListener('input', renderJobs);
filterStatus.addEventListener('change', renderJobs);
