import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

async function handleGoogleLogin() {
  try {
    const result = await FirebaseAuthentication.signInWithGoogle();
    console.log("Login berhasil:", result.user);
    alert("Login berhasil! Selamat datang " + (result.user.displayName || "User"));
    // Arahkan ke halaman utama/dashboard kamu jika ada
  } catch (error) {
    console.error("Login gagal:", error);
    alert("Gagal login: " + (error.message || JSON.stringify(error)));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Cari semua elemen tombol atau teks login
  const loginButtons = document.querySelectorAll("button, .btn, [id*='google'], [class*='google']");
  
  loginButtons.forEach((btn) => {
    if (btn.innerText.includes("Masuk dengan Google") || btn.id.includes("google")) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        handleGoogleLogin();
      });
    }
  });
});
