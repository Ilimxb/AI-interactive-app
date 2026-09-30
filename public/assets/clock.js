/* clock.js  ——  登录大时钟 + 对话飘动时钟 */
(() => {
  function drawClock(ctx, radius) {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();
    const cvs = ctx.canvas;
    const center = cvs.width / 2;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.beginPath();
    ctx.arc(center, center, radius - 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 6;
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI) / 6;
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, -radius + 10);
      ctx.lineTo(0, -radius + 20);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.stroke();
      ctx.restore();
    }
    const hourAng = (h + m / 60) * (Math.PI / 6);
    drawHand(ctx, hourAng, radius * 0.5, 6, '#fff');
    const minAng = (m + s / 60) * (Math.PI / 30);
    drawHand(ctx, minAng, radius * 0.75, 4, '#fff');
    const secAng = (s + ms / 1000) * (Math.PI / 30);
    drawHand(ctx, secAng, radius * 0.85, 2, '#ff4757');
    ctx.beginPath();
    ctx.arc(center, center, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4757';
    ctx.fill();
  }
  function drawHand(ctx, ang, length, width, color) {
    const center = ctx.canvas.width / 2;
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(ang - Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  const loginClock = document.getElementById('loginClock');
  const loginCtx = document.getElementById('loginClockCanvas').getContext('2d');
  function animateLogin() {
    drawClock(loginCtx, 130);
    requestAnimationFrame(animateLogin);
  }

  const floatClock = document.getElementById('floatClock');
  const floatCtx = document.getElementById('floatClockCanvas').getContext('2d');
  const closeBtn = floatClock.querySelector('.close-btn');
  const toggleBtn = document.getElementById('clockToggleBtn');
  let raf, vx = 2, vy = 2, x = 100, y = 100;
  function animateFloat() {
    drawClock(floatCtx, 45);
    const w = window.innerWidth - 90;
    const h = window.innerHeight - 90;
    x += vx; y += vy;
    if (x <= 0 || x >= w) vx = -vx;
    if (y <= 0 || y >= h) vy = -vy;
    floatClock.style.transform = `translate(${x}px, ${y}px)`;
    raf = requestAnimationFrame(animateFloat);
  }
  function startFloat() {
    floatClock.style.display = 'block';
    toggleBtn.style.display = 'none';
    animateFloat();
  }
  function stopFloat() {
    floatClock.style.display = 'none';
    toggleBtn.style.display = 'flex';
    cancelAnimationFrame(raf);
  }
  closeBtn.addEventListener('click', stopFloat);
  toggleBtn.addEventListener('click', startFloat);

  function init() {
    if (document.getElementById('authContainer') && !document.getElementById('chatApp').classList.contains('hidden')) {
      loginClock.style.display = 'none';
    } else {
      loginClock.style.display = 'block';
      animateLogin();
    }
    if (document.getElementById('chatApp') && !document.getElementById('chatApp').classList.contains('hidden')) {
      startFloat();
    } else {
      stopFloat();
    }
  }
  const originalShowChatApp = window.showChatApp;
  const originalShowAuth = window.showAuth;
  window.showChatApp = function () {
    originalShowChatApp();
    loginClock.style.display = 'none';
    startFloat();
  };
  window.showAuth = function () {
    originalShowAuth();
    loginClock.style.display = 'block';
    stopFloat();
  };
  init();
})();