document.addEventListener("DOMContentLoaded", () => {
  // Matikan seleksi teks pada tombol login
  const style = document.createElement('style');
  style.innerHTML = `
    button, .btn { -webkit-user-select: none; user-select: none; }
  `;
  document.head.appendChild(style);

  // Cari tombol login Google
  const buttons = document.querySelectorAll("button, div, a");
  let targetBtn = null;

  buttons.forEach((el) => {
    if (el.innerText && el.innerText.includes("Masuk dengan Google")) {
      targetBtn = el;
    }
  });

  if (!targetBtn) {
    targetBtn = document.querySelector("button");
  }

  if (targetBtn) {
    targetBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        // Panggil Plugin Native via Window Capacitor Global
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAuthentication) {
          const res = await window.Capacitor.Plugins.FirebaseAuthentication.signInWithGoogle();
          alert("Login Berhasil! Selamat datang " + (res.user ? res.user.displayName : "User"));
        } else if (window.FirebaseAuthentication) {
          const res = await window.FirebaseAuthentication.signInWithGoogle();
          alert("Login Berhasil!");
        } else {
          // Fallback jika run di browser biasa
          alert("Native Auth Plugin belum terdeteksi di WebView. Memproses via Firebase Web...");
        }
      } catch (err) {
        console.error("Auth error:", err);
        alert("Gagal Login: " + (err.message || JSON.stringify(err)));
      }
    });
  }
});
