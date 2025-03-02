// تهيئة Particles.js
particlesJS("particles-js", {
    "particles": {
        "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": ["#ffffff", "#81c784", "#4caf50"] },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.5, "random": true },
        "size": { "value": 3, "random": true },
        "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 },
        "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out" }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" } },
        "modes": { "repulse": { "distance": 100, "duration": 0.4 } }
    },
    "retina_detect": true
});

// تمرير ناعم للروابط
document.querySelectorAll('nav a, .sidebar a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        document.querySelector(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// زر العودة للأعلى
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTop.style.display = 'block';
    } else {
        backToTop.style.display = 'none';
    }
});
backToTop.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// زر الرجوع إلى الصفحة الرئيسية
const homeButton = document.getElementById('home-button');
homeButton.addEventListener('click', () => {
    document.querySelector('#home').scrollIntoView({
        behavior: 'smooth'
    });
});

// الوضع الليلي
const darkModeToggle = document.getElementById('dark-mode-toggle');
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    darkModeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    console.log('الوضع الليلي: ' + (isDarkMode ? 'مفعل' : 'غير مفعل')); // للتحقق من العمل
});

// التقويم الهجري (تقريبي)
const gregorianToHijri = (date) => {
    const d = new Date(date);
    const jd = Math.floor((d - new Date(-62168601600000).getTime()) / 86400000) + 2440588;
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = (Math.floor((10985 - l2) / 5319) * Math.floor((50 * l2) / 17719)) + (Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238));
    const l3 = l2 - (Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)) - (Math.floor(j / 43) * Math.floor((15238 * j) / 43)) + 29;
    const day = l3;
    const month = Math.floor((355668 * day - 1) / 108144);
    const year = Math.floor((1948440 + day - 1) / 354) + n * 30;
    const dayOfMonth = day - Math.floor((108144 * month + 1) / 355668);
    return `${Math.floor(dayOfMonth)} ${getHijriMonth(Math.floor(month))} ${Math.floor(year)} هـ`;
};

const getHijriMonth = (month) => {
    const hijriMonths = [
        "محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الثانية",
        "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    ];
    return hijriMonths[month - 1];
};

document.getElementById('hijri-date').textContent = gregorianToHijri(new Date());

// رسالة ترحيب
window.onload = () => {
    alert('مرحبًا بك في موقع ذِكْرَى! استمتع بتجربة الأذكار بأسلوب عصري.');
};