// 迷你音乐播放器（进度条 = 歌曲进度，4 秒无操作自动最小化，图标避让）
class MiniMusicPlayer {
  constructor() {
    // --- DOM 引用 ---
    this.audio            = document.getElementById('audioPlayer');
    this.playPauseBtn     = document.getElementById('playPauseBtn');
    this.prevBtn          = document.getElementById('prevBtn');
    this.nextBtn          = document.getElementById('nextBtn');
    this.progressSlider   = document.getElementById('volumeSlider'); // 实为进度条
    this.currentSongEl    = document.getElementById('currentSong');
    this.miniPlayer       = document.getElementById('miniPlayer');
    this.miniPlayerBtn    = document.getElementById('miniPlayerBtn');
    this.minimizeBtn      = document.getElementById('minimizePlayer');

    // --- 状态 ---
    this.songs          = [];
    this.currentIndex   = 0;
    this.isPlaying      = false;
    this.userSliding    = false; // 是否手动拖拽进度条
    this.autoHideTimer  = null;  // 自动最小化计时器

    this.init();
  }

  /* ---------- 初始化 ---------- */
  async init() {
    await this.loadMusicList();
    this.setupEventListeners();
    this.audio.volume = 0.5; // 固定音量 50%
    if (this.songs.length) this.loadSong(0);
  }

  /* ---------- 歌单 ---------- */
  async loadMusicList() {
    this.songs = [
      { name: '春日影',    url: 'assets/music/春日影.mp3' },
      { name: '猛独が襲う', url: 'assets/music/猛独が襲う.mp3' },
      { name: '迷星叫',    url: 'assets/music/迷星叫.mp3' },
      { name: '詩超絆',    url: 'assets/music/詩超絆.mp3' },
      { name: '壱雫空',    url: 'assets/music/壱雫空.mp3' },
      { name: '影色舞',    url: 'assets/music/影色舞.mp3' }
    ];
  }

  /* ---------- 事件绑定 ---------- */
  setupEventListeners() {
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.prevBtn.addEventListener('click', () => this.playPrevious());
    this.nextBtn.addEventListener('click', () => this.playNext());

    // 进度条
    this.progressSlider.addEventListener('mousedown', () => this.userSliding = true);
    this.progressSlider.addEventListener('mouseup',   () => this.userSliding = false);
    this.progressSlider.addEventListener('input',     () => this.seekTo(this.progressSlider.value));

    // 最小化/恢复
    this.minimizeBtn.addEventListener('click', () => this.minimize());
    this.miniPlayerBtn.addEventListener('click', () => this.restore());

    // 音频事件
    this.audio.addEventListener('loadedmetadata', () => this.updateProgressBar());
    this.audio.addEventListener('timeupdate',     () => this.updateProgressBar());
    this.audio.addEventListener('ended',          () => this.playNext());

    // 键盘空格播放/暂停
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.togglePlayPause();
      }
    });

    // 自动隐藏计时
    this.resetAutoHide(); // 首次展开
    ['mousedown', 'touchstart', 'input'].forEach((ev) => {
      this.progressSlider.addEventListener(ev, () => this.resetAutoHide());
    });
    [this.playPauseBtn, this.prevBtn, this.nextBtn].forEach((btn) => {
      btn.addEventListener('click', () => this.resetAutoHide());
    });
  }

  /* ---------- 加载歌曲 ---------- */
  loadSong(index) {
    if (index < 0 || index >= this.songs.length) return;
    this.currentIndex = index;
    const song = this.songs[index];
    this.audio.src = song.url;
    this.currentSongEl.textContent = song.name;
    if (this.isPlaying) this.play();
  }

  /* ---------- 播放/暂停 ---------- */
  togglePlayPause() {
    this.isPlaying ? this.pause() : this.play();
    this.resetAutoHide();
  }
  play() {
    this.audio.play().catch(console.error);
    this.isPlaying = true;
    this.playPauseBtn.textContent = '⏸';
    this.playPauseBtn.classList.remove('play');
  }
  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.playPauseBtn.textContent = '▶';
    this.playPauseBtn.classList.add('play');
  }

  /* ---------- 上一首 / 下一首 ---------- */
  playPrevious() {
    const i = this.currentIndex > 0 ? this.currentIndex - 1 : this.songs.length - 1;
    this.loadSong(i);
    if (this.isPlaying) this.play();
    this.resetAutoHide();
  }
  playNext() {
    const i = this.currentIndex < this.songs.length - 1 ? this.currentIndex + 1 : 0;
    this.loadSong(i);
    if (this.isPlaying) this.play();
    this.resetAutoHide();
  }

  /* ---------- 进度条 ---------- */
  updateProgressBar() {
    if (this.userSliding) return;
    const percent = this.audio.duration ? (this.audio.currentTime / this.audio.duration) * 100 : 0;
    this.progressSlider.value = percent;
  }
  seekTo(percent) {
    if (this.audio.duration) {
      this.audio.currentTime = (percent / 100) * this.audio.duration;
    }
    this.resetAutoHide();
  }

  /* ---------- 最小化 / 恢复 ---------- */
  minimize() {
    this.miniPlayer.classList.add('minimized');
    this.miniPlayerBtn.classList.remove('hidden');
    clearTimeout(this.autoHideTimer);
  }
  restore() {
    this.miniPlayer.classList.remove('minimized');
    this.miniPlayerBtn.classList.add('hidden');
    this.resetAutoHide();
  }
  resetAutoHide() {
    clearTimeout(this.autoHideTimer);
    this.autoHideTimer = setTimeout(() => this.minimize(), 4000);
  }
}

/* ---------- 页面加载后初始化 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const check = () => {
    const chatApp = document.getElementById('chatApp');
    if (chatApp && !chatApp.classList.contains('hidden')) {
      new MiniMusicPlayer();
    } else {
      setTimeout(check, 500);
    }
  };
  check();
});