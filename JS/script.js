const navbar = document.getElementById('navbar');
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');

// 1. 處理滾動 Navbar 變色
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('nav-scrolled');
    } else {
        navbar.classList.remove('nav-scrolled');
    }
});

// 2. 處理漢堡選單點擊
menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// 3. 點擊選單項目後自動關閉選單 (手機體驗優化)
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// 4. 文字淡入效果 (The Mission 區塊)
const observerOptions = {
    threshold: 0.2 // 當區塊進入螢幕 20% 時觸發
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, observerOptions);

// 監聽所有帶有 .fade-in-section class 的元素
document.querySelectorAll('.fade-in-section').forEach(section => {
    observer.observe(section);
});