# System Dynamics Lab

کتابخانه‌ای از مدل‌های پویایی سیستم با امکان مشاهده دیاگرام Stock–Flow، تغییر پارامترهای مجاز، اجرای شبیه‌سازی و مقایسه سناریوها.

## آدرس‌های ثابت پیشنهادی

- **صفحه اصلی کتابخانه:** `https://fmehrabi.github.io/system-dynamics-lab/`
- **مدل فعلی:** `https://fmehrabi.github.io/system-dynamics-lab/models/demand-supply-delay/`
- **Repository:** `https://github.com/fmehrabi/system-dynamics-lab`

برای ثابت ماندن این آدرس‌ها، نام حساب GitHub و نام Repository را تغییر نده.

## معماری پروژه

```text
system-dynamics-lab/
├── index.html                    # صفحه اصلی و فهرست مدل‌ها
├── assets/
│   ├── library.css               # استایل صفحه کتابخانه
│   ├── library.js                # خواندن Registry و ساخت کارت مدل‌ها
│   ├── favicon.svg
│   └── model-previews/
├── shared/
│   └── style.css                 # تم مشترک صفحات مدل‌ها
├── models/
│   ├── registry.json             # فهرست مرکزی مدل‌های منتشرشده
│   ├── demand-supply-delay/
│   │   ├── index.html             # صفحه تعاملی مدل فعلی
│   │   ├── app.js                 # رابط کاربری و دیاگرام اختصاصی مدل
│   │   ├── engine.js              # معادلات و موتور شبیه‌سازی مدل
│   │   ├── manifest.json          # اطلاعات و تنظیمات مدل
│   │   └── source.mdl             # فایل اصلی Vensim
│   └── _template/                 # دستورالعمل و قرارداد افزودن مدل جدید
├── docs/
│   ├── ADDING_MODELS.md
│   └── ADDING_MODELS_FA.md
├── tests/
├── downloads/
├── .nojekyll
└── README.md
```

### منطق این ساختار

- آدرس اصلی همیشه صفحه کتابخانه مدل‌ها را باز می‌کند.
- هر مدل پوشه مستقل خودش را دارد؛ فایل MDL، معادلات، دیاگرام، رابط کاربری و تست‌های آن با مدل‌های دیگر مخلوط نمی‌شوند.
- صفحه اصلی مدل‌ها را از `models/registry.json` می‌خواند. برای اضافه کردن کارت مدل جدید، لازم نیست HTML یا JavaScript صفحه اصلی تغییر کند.
- `shared/style.css` تم مشترک تمام صفحات مدل‌ها را نگه می‌دارد.
- اضافه شدن مدل جدید نباید باعث تغییر یا شکستن مدل‌های قبلی شود.

## مدل فعلی

در این انتشار فقط **Demand, Supply & Adjustment Delay** قرار دارد. مدل‌های دیگر تا زمان بررسی معادلات، Lookupها، اتصالات دیاگرام و تنظیمات شبیه‌سازی وارد کتابخانه نمی‌شوند.

پارامترهای قابل تغییر:

- Demand Slope = 10
- Supply Slope = 30
- Delay = 2 ماه
- Initial Price = 5
- Initial Capacity = 100
- مقادیر y پنج نقطه Lookup تابع F؛ مقادیر x ثابت هستند.

سایر متغیرهای محاسبه‌شده فقط خواندنی‌اند. عدد 1000 در معادله Demand و تنظیمات زمانی در رابط فعلی ثابت هستند.

تنظیمات شبیه‌سازی: زمان شروع 0، زمان پایان 20 ماه، گام زمانی 0.125 ماه، روش Euler و درون‌یابی خطی Lookup با نگه‌داشتن مقدار ابتدا/انتهای منحنی خارج از دامنه نقاط.

موتور مرورگر، معادلات فایل Vensim ارسالی را به‌صورت صریح پیاده‌سازی می‌کند و مفسر عمومی Vensim نیست. برای استفاده پژوهشی، تطبیق عددی نقطه‌به‌نقطه با خروجی Vensim لازم است.

## روش افزودن مدل در آینده

راهنمای کامل در [`docs/ADDING_MODELS_FA.md`](docs/ADDING_MODELS_FA.md) قرار دارد.

خلاصه مراحل:

1. یک پوشه جدید با شناسه کوتاه و ثابت در `models/` ایجاد کن.
2. فایل‌های `manifest.json`، فایل اصلی `.mdl`، موتور `engine.js`، رابط `app.js`، صفحه `index.html`، تصویر پیش‌نمایش و تست‌های همان مدل را در آن قرار بده.
3. فقط یک ورودی جدید به `models/registry.json` اضافه کن.
4. مدل را محلی اجرا و خروجی آن را با Vensim اعتبارسنجی کن.
5. تغییرات را Commit و Push کن. کارت مدل جدید به‌صورت خودکار در کتابخانه ظاهر می‌شود.

معادلات مدل‌های مختلف را در یک فایل engine مشترک ادغام نکن. هر مدل باید موتور مستقل خودش را داشته باشد.

## اجرای محلی

در ریشه پروژه اجرا کن:

```bash
python -m http.server 8000
```

سپس `http://localhost:8000/` را باز کن. صفحه کتابخانه از `fetch()` برای خواندن Registry استفاده می‌کند؛ بنابراین بهتر است آن را از طریق سرور محلی اجرا کنی، نه با باز کردن مستقیم فایل از مسیر `file://`.

صفحه مستقیم مدل فعلی: `http://localhost:8000/models/demand-supply-delay/`

## انتشار در GitHub Pages

1. یک Repository عمومی به نام `system-dynamics-lab` در حساب `fmehrabi` بساز.
2. **محتویات** پوشه پروژه را در ریشه Repository بارگذاری یا Push کن؛ خود فایل ZIP را به‌عنوان محتوای سایت آپلود نکن.
3. به **Settings → Pages** برو.
4. در بخش **Build and deployment** گزینه **Deploy from a branch** را انتخاب کن.
5. شاخه `main` و پوشه `/(root)` را انتخاب و Save کن.
6. پس از پایان Deployment، آدرس کتابخانه `https://fmehrabi.github.io/system-dynamics-lab/` خواهد بود.

در GitHub Free، Repository برای استفاده از Pages باید Public باشد. محتوای منتشرشده در GitHub Pages برای عموم قابل مشاهده است؛ فایل محرمانه یا اطلاعات حساس را Commit نکن.

## اطلاعات Repository

**نام:** `system-dynamics-lab`

**Description:** `Interactive system dynamics model library — Vensim-based stock–flow diagrams, live simulation, editable parameters, lookup functions, and scenario comparison.`

**Topics:** `system-dynamics`, `vensim`, `simulation`, `stock-flow`, `feedback-loops`, `systems-thinking`, `github-pages`, `education`, `javascript`

فعلاً License اضافه نشده است. پیش از اجازه استفاده یا بازتوزیع کدها و مدل‌ها، نوع مجوز را آگاهانه انتخاب کن.

## اجرای تست‌ها

```bash
node tests/test_engine.js
python tests/browser_test.py
python tests/library_test.py
python tests/test_registry.py
```
