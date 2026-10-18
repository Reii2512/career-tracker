import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

// Fungsi login Google Native
async function loginWithGoogle() {
  try {
    const result = await FirebaseAuthentication.signInWithGoogle();
    console.log("Login sukses!", result.user);
    // Masuk ke halaman utama / dashboard
    window.location.href = "dashboard.html"; // sesuaikan dengan alur app kamu
  } catch (error) {
    console.error("Gagal login:", error);
    alert("Gagal login: " + error.message);
  }
}

// Pasang event listener ke tombol login
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("google-login-btn") || document.querySelector("button");
  if (loginBtn) {
    loginBtn.addEventListener("click", loginWithGoogle);
  }
});
