# نظام متابعة المشاريع
## Node.js + SQL Server 2016 + Windows Authentication

---

## هيكل المشروع

```
planningMangerNode/
├── server.js              ← الخادم الرئيسي
├── db.js                  ← الاتصال بـ SQL Server
├── database.sql           ← إنشاء قاعدة البيانات + المدير
├── package.json
├── .env                   ← اسم السيرفر وإعدادات JWT
├── middleware/
│   └── auth.js
├── routes/
│   ├── auth.js
│   └── projects.js
└── public/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── api.js
        └── app.js
```

---

## خطوات التشغيل

### 1. تشغيل database.sql في SSMS
- افتح SQL Server Management Studio
- File → Open → File → اختر database.sql
- اضغط F5
- سيُنشئ قاعدة البيانات والجداول وحساب المدير

### 2. تعديل .env
```
DB_SERVER=localhost    ← أو اسم الجهاز\SQLEXPRESS
DB_NAME=planning_manager
DB_WINDOWS_AUTH=true
```

### 3. تثبيت وتشغيل
```bash
npm install
npm start
```

### 4. فتح التطبيق
```
http://localhost:3000
```
دخول: admin / admin123
//////////////
/*
الان لدي حاسبة سيرفر واربع حاسبات متصلة كيف ارفع نظام المتابعة على السيرفر بحيث تصل اليه كل الحاسبات كما اريد ان اربط طابعة واحدة وتستخدمها كل الحاسبات كيف يتم ذلك علما انني استخدم Node.js +sql for Db
Read 12 web pages
أهلاً بك. لرفع نظام المتابعة على السيرفر ليكون متاحاً لجميع الأجهزة وربط طابعة مشتركة، إليك الخطوات المطلوبة:

🌐 رفع نظام المتابعة على السيرفر (Node.js + SQL)
لتتمكن جميع الحاسبات الأربع من الوصول إلى النظام، يجب أن يستمع خادم Node.js على عنوان الشبكة الصحيح، وليس على localhost فقط.

1. تعديل كود الخادم (server.js)
في ملف server.js، تأكد من أن الخادم يستمع على جميع واجهات الشبكة عن طريق تغيير السطر التالي:

javascript
// غيّر هذا السطر
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على: http://localhost:${PORT}`);
});

// إلى هذا السطر ليستمع على جميع الواجهات (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 الخادم يعمل على: http://<IP-السيرفر>:${PORT}`);
});
بهذا التعديل، سيصبح الخادم قابلاً للوصول من أي جهاز على الشبكة المحلية عبر عنوان IP الخاص بالسيرفر.

2. إعدادات الشبكة والجدار الناري (Firewall)

عنوان IP الثابت (Static IP): من الأفضل تثبيت عنوان IP لجهاز السيرفر على شبكتك المحلية، لضمان أن الحاسبات الأخرى يمكنها الاتصال به دائماً عبر نفس العنوان.

فتح المنفذ في الجدار الناري: تأكد من أن جدار الحماية على جهاز السيرفر يسمح بالاتصالات الواردة على المنفذ الذي يستخدمه التطبيق (مثلاً، المنفذ 3000 أو المنفذ الذي حددته في المتغير PORT).

3. الاتصال من الحاسبات الأخرى
بعد تشغيل الخادم، يمكن لأي جهاز على نفس الشبكة فتح المتصفح والانتقال إلى:
http://<عنوان-IP-السيرفر>:<المنفذ>
على سبيل المثال: http://192.168.1.100:3000

4. استخدام Proxy (اختياري، لكن موصى به للإنتاج)
لتسهيل الوصول وتحسين الأمان، يمكنك إعداد Nginx كـ "Reverse Proxy" على السيرفر. بهذه الطريقة، يمكن للمستخدمين الوصول إلى النظام باستخدام اسم نطاق بسيط (مثل http://pm-system) بدلاً من كتابة عنوان IP ومنفذ، ويمكنك أيضاً إضافة شهادة SSL (HTTPS) بسهولة.

🖨️ مشاركة الطابعة واستخدامها من جميع الأجهزة
أما بالنسبة للطابعة، فالأمر يعتمد على نظام التشغيل (على الأرجح Windows). إليك الطريقة الأكثر مباشرة:

1. مشاركة الطابعة من جهاز السيرفر (Host PC)
على الجهاز المتصل به الطابعة فعلياً:

اذهب إلى الإعدادات (Settings) > الأجهزة (Devices) > الطابعات والماسحات الضوئية (Printers & scanners).

اختر الطابعة، ثم إدارة (Manage) > خصائص الطابعة (Printer properties).

في علامة التبويب مشاركة (Sharing)، فعّل خيار مشاركة هذه الطابعة (Share this printer) وأعطها اسماً مميزاً.

2. توصيل الأجهزة الأخرى بالطابعة المشتركة
على كل جهاز من الأجهزة الأربعة:

اذهب إلى الإعدادات (Settings) > الأجهزة (Devices) > الطابعات والماسحات الضوئية (Printers & scanners).

اختر إضافة طابعة أو ماسح ضوئي (Add a printer or scanner).

انتظر حتى تظهر الطابعة في القائمة، ثم اخترها وأضفها. إذا لم تظهر، استخدم خيار الطابعة التي أريدها غير مدرجة (The printer that I want isn't listed) ثم اختر تحديد طابعة مشتركة بالاسم (Select a shared printer by name) وأدخل اسم الجهاز والطابعة بهذا الشكل: \\<اسم-جهاز-السيرفر>\<اسم-الطابعة-المشتركة> (مثال: \\SERVER-PC\HP-LaserJet).

ملاحظة مهمة: لكي تعمل هذه الطريقة، يجب أن يكون جهاز السيرفر (المتصل به الطابعة) قيد التشغيل دائماً، وأن يكون متصلاً بالشبكة.

🚀 نظرة على الخيارات المتقدمة (دون الحاجة إلى تطبيقها حالياً)
يمكنك الاطلاع على هذه الخيارات لتطوير النظام مستقبلاً:

نشر احترافي: يمكنك استخدام خدمات استضافة مُدارة مثل Hostinger التي تقدم حلولاً جاهزة لرفع تطبيقات Node.js مع دعم قواعد البيانات SQL، مما يسهل عملية النشر والإدارة.

مشاركة الطابعة عبر الإنترنت: إذا كنت بحاجة للطباعة من خارج الشبكة المحلية، يمكنك استخدام برامج متخصصة مثل USB Network Gate التي تتيح مشاركة الأجهزة عبر الإنترنت.

هل تتصل الحاسبات بالحاسبة السيرفر بواسطة كيبل ام كيف يتم الاتصال
🌐 طرق اتصال الحاسبات بالسيرفر
1️⃣ اتصال عبر الشبكة المحلية (LAN)
هذه هي الطريقة الأكثر شيوعاً للمكاتب الصغيرة:

أ. عبر كيبل إيثرنت (Ethernet Cable)
text
[السيرفر] ----(كيبل شبكة)---- [سويتش/راوتر] ----(كيبل شبكة)---- [حاسبات المستخدمين]
المطلوب:

سويتش (Switch) أو راوتر لتوزيع الشبكة

كيبلات شبكة (RJ45) لكل جهاز

بطاقات شبكة في جميع الأجهزة

ب. عبر الواي فاي (Wi-Fi)
text
[السيرفر] ----(Wi-Fi)---- [راوتر] ----(Wi-Fi)---- [حاسبات المستخدمين]
المطلوب:

راوتر وايرلس يدعم الشبكة المحلية

بطاقات وايرلس في جميع الأجهزة

2️⃣ مخطط الاتصال النموذجي للمكتب
text
                    ┌─────────────────────────────────┐
                    │         راوتر / سويتش          │
                    │     (IP: 192.168.1.1)          │
                    └───────────────┬─────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
    ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
    │   السيرفر     │     │  حاسبة 1     │     │  حاسبة 2     │
    │ (Node.js+SQL) │     │  (مستخدم)    │     │  (مستخدم)    │
    │IP: 192.168.1.10│     │IP:192.168.1.11│     │IP:192.168.1.12│
    └───────────────┘     └───────────────┘     └───────────────┘
            │
            ├───────────────────┐
            ▼                   ▼
    ┌───────────────┐     ┌───────────────┐
    │  حاسبة 3     │     │  حاسبة 4     │
    │  (مستخدم)    │     │  (مستخدم)    │
    │IP:192.168.1.13│     │IP:192.168.1.14│
    └───────────────┘     └───────────────┘
            │
            ▼
    ┌───────────────┐
    │   طابعة       │
    │  (مشتركة)     │
    └───────────────┘
3️⃣ خطوات التوصيل العملي
أ. توصيل الكيبلات:
ضع السيرفر بالقرب من الراوتر/السويتش

وصل كيبل شبكة من السيرفر إلى الراوتر

وصل كيبل شبكة من كل حاسبة إلى الراوتر

شغل جميع الأجهزة

ب. إعداد عناوين IP (ثابتة) للسيرفر:
في جهاز السيرفر (Windows):

اذهب إلى Control Panel > Network and Sharing Center > Change adapter settings

اضغط بزر الماوس الأيمن على Ethernet > Properties

اختر Internet Protocol Version 4 (TCP/IPv4) > Properties

اختر Use the following IP address وأدخل:

text
IP address: 192.168.1.10
Subnet mask: 255.255.255.0
Default gateway: 192.168.1.1 (عنوان الراوتر)
Preferred DNS server: 192.168.1.1
ج. إعداد عناوين IP للحاسبات الأخرى:
استخدم عناوين مختلفة:

حاسبة 1: 192.168.1.11

حاسبة 2: 192.168.1.12

حاسبة 3: 192.168.1.13

حاسبة 4: 192.168.1.14

4️⃣ اختبار الاتصال
من أي حاسبة، افتح Command Prompt واكتب:

cmd
ping 192.168.1.10
إذا ظهرت رسائل Reply from... فهذا يعني أن الاتصال ناجح.

5️⃣ تشغيل نظام المتابعة على السيرفر
أ. تعديل server.js:
javascript
const PORT = process.env.PORT || 3000;
// استمع على جميع الواجهات
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 الخادم يعمل على: http://192.168.1.10:${PORT}`);
    console.log(`📊 واجهة المستخدم: http://192.168.1.10:${PORT}`);
});
ب. تشغيل الخادم:
bash
npm start
ج. فتح الجدار الناري (Firewall):
في السيرفر (Windows):

اذهب إلى Control Panel > Windows Defender Firewall

اختر Advanced settings

اختر Inbound Rules > New Rule

اختر Port > Next

اختر TCP و Specific local ports: 3000

اختر Allow the connection > Next

اختر Domain, Private, Public > Next

أعط الاسم Node.js Server وانتهى

6️⃣ فتح النظام من الحاسبات الأخرى
في أي حاسبة، افتح المتصفح واكتب:

text
http://192.168.1.10:3000
7️⃣ مشاركة الطابعة
أ. من السيرفر (جهاز المتصل بالطابعة):
Control Panel > Devices and Printers

اضغط بزر الماوس الأيمن على الطابعة > Printer properties

تبويب Sharing:

فعّل Share this printer

أعطها اسماً مثل Office_Printer

ب. من الحاسبات الأخرى:
Control Panel > Devices and Printers

Add a printer

اختر Add a network, wireless or Bluetooth printer

انتظر حتى تظهر الطابعة أو استخدم:

text
\\192.168.1.10\Office_Printer
📋 ملخص سريع
العنصر	التفاصيل
الاتصال	كيبل شبكة أو واي فاي عبر الراوتر/السويتش
عنوان السيرفر	192.168.1.10 (ثابت)
منفذ التطبيق	3000
رابط الوصول	http://192.168.1.10:3000
الطابعة	مشاركة من السيرفر باسم Office_Printer
⚠️ ملاحظات مهمة
السيرفر يجب أن يكون دائماً مشغلاً حتى تتمكن الحاسبات الأخرى من الوصول

استخدم عناوين IP ثابتة لتجنب تغير العنوان عند إعادة التشغيل

تأكد من أن جميع الأجهزة على نفس الشبكة (نفس الـ Subnet)

إذا كنت تستخدم واي فاي، تأكد من أن الإشارة قوية ومستقرة

واذا كان الرفع على سيرفر الشركة هل نتبع نفس الخطوات
🏢 الرفع على سيرفر الشركة (Production Server)
نعم، نفس المبدأ ولكن مع بعض التعديلات والاعتبارات الإضافية لأن سيرفر الشركة غالباً ما يكون بيئة أكثر تعقيداً.

1️⃣ الفرق بين سيرفر المكتب وسيرفر الشركة
الخاصية	سيرفر المكتب	سيرفر الشركة
الموقع	داخل المكتب	غرفة سيرفرات / مركز بيانات
نظام التشغيل	Windows عادة	Linux (Ubuntu/CentOS) غالباً
الاتصال	شبكة محلية (LAN)	شبكة داخلية + خارجية
الصلاحيات	مدير واحد	فرق متعددة (IT, DBA, Developers)
قاعدة البيانات	SQL Server محلي	SQL Server مخصص / سحابي
النسخ الاحتياطي	يدوي	تلقائي يومي
الأمان	أساسي	متقدم (جدران نارية، تشفير، VPN)
2️⃣ خطوات الرفع على سيرفر الشركة
أ. تجهيز السيرفر
1. الاتصال بالسيرفر عن بعد (SSH / RDP)

bash
# عبر SSH (Linux)
ssh username@server_ip

# عبر RDP (Windows)
# استخدم Remote Desktop Connection
2. تحديث النظام وتثبيت المتطلبات

bash
# Linux (Ubuntu/Debian)
sudo apt update
sudo apt upgrade -y

# تثبيت Node.js (الإصدار LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت PM2 (لإدارة عمليات Node.js)
sudo npm install -g pm2

# تثبيت Git (لنسخ المشروع)
sudo apt install git -y
ب. رفع المشروع إلى السيرفر
الطريقة 1: عبر Git (مفضلة)

bash
# نسخ المشروع من مستودع Git
git clone https://github.com/your-repo/planning-manager.git
cd planning-manager

# تثبيت الاعتماديات
npm install
الطريقة 2: رفع الملفات مباشرة (FTP/SCP)

bash
# عبر SCP (من جهازك إلى السيرفر)
scp -r ./planning-manager/ username@server_ip:/var/www/
ج. إعداد قاعدة البيانات (SQL Server)
1. تثبيت SQL Server (إذا لم يكن مثبتاً)

bash
# Ubuntu - تثبيت SQL Server
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
sudo add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/20.04/mssql-server-2019.list)"
sudo apt update
sudo apt install -y mssql-server
2. إنشاء قاعدة البيانات

sql
-- إنشاء قاعدة البيانات
CREATE DATABASE planning_manager;
GO

-- إنشاء المستخدم
CREATE LOGIN pm_user WITH PASSWORD = 'SecurePassword123!';
USE planning_manager;
CREATE USER pm_user FOR LOGIN pm_user;
ALTER ROLE db_owner ADD MEMBER pm_user;
GO

-- تشغيل ملف database.sql
-- استخدم SQL Server Management Studio أو sqlcmd
د. إعداد ملف .env
env
# السيرفر
PORT=3000
NODE_ENV=production

# قاعدة البيانات
DB_HOST=localhost  # أو عنوان SQL Server
DB_USER=pm_user
DB_PASSWORD=SecurePassword123!
DB_NAME=planning_manager

# الأمان
JWT_SECRET=your-super-secret-key-change-this
SESSION_SECRET=another-secret-key
هـ. تشغيل التطبيق (Production)
1. استخدام PM2 (إدارة العمليات)

bash
# تشغيل التطبيق مع PM2
pm2 start server.js --name "planning-manager"

# حفظ الحالة
pm2 save

# تشغيل PM2 عند بدء النظام
pm2 startup
2. إنشاء خدمة Systemd (بديل)

bash
# إنشاء ملف الخدمة
sudo nano /etc/systemd/system/planning-manager.service
ini
[Unit]
Description=Planning Manager System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/planning-manager
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
bash
# تفعيل الخدمة
sudo systemctl enable planning-manager
sudo systemctl start planning-manager
sudo systemctl status planning-manager
و. إعداد Proxy (Nginx) - مهم جداً
1. تثبيت Nginx

bash
sudo apt install nginx -y
2. إعداد ملف التكوين

bash
sudo nano /etc/nginx/sites-available/planning-manager
nginx
server {
    listen 80;
    server_name your-domain.com;  # أو IP السيرفر

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ملفات ثابتة (static files)
    location /css/ {
        alias /var/www/planning-manager/public/css/;
    }
    location /js/ {
        alias /var/www/planning-manager/public/js/;
    }
}
bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/planning-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
ز. إعداد SSL (HTTPS) - باستخدام Let's Encrypt
bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
3️⃣ وصول الحاسبات إلى النظام
شبكة الشركة الداخلية:
text
http://server-ip:3000
أو
http://planning-manager.company.local
من خارج الشركة (عن بعد):
text
https://your-domain.com
للوصول من خارج الشركة، تحتاج إلى:

VPN للاتصال بشبكة الشركة

أو فتح المنفذ على الجدار الناري للشركة (مع إجراءات أمنية)

استخدام Cloudflare Tunnel أو ngrok (حلول مؤقتة)

4️⃣ مشاركة الطابعة في بيئة الشركة
الطريقة 1: طابعة شبكة (Network Printer)
bash
# الطابعة متصلة بالشبكة مباشرة (IP ثابت)
# كل جهاز يضيفها عبر IP
http://192.168.1.100:631/printers/  # للطابعات الـ IPP
الطريقة 2: طابعة مشتركة من سيرفر الطباعة (Print Server)
bash
# من أي حاسبة: Run > \\print-server\PrinterName
# أو استخدام Print Management في Windows Server
الطريقة 3: طابعة سحابية (Google Cloud Print / PaperCut)
bash
# إعداد نظام إدارة الطباعة المركزي
# يسمح بالطباعة من أي جهاز عبر متصفح الويب
5️⃣ مقارنة بين طرق الرفع
الخاصية	سيرفر المكتب	سيرفر الشركة
التكلفة	منخفضة (أجهزة موجودة)	مرتفعة (أجهزة مخصصة + صيانة)
التوفر	متقطع (قد ينطفئ)	مستمر (UPS + مولدات)
الأمان	أساسي	متقدم (جدران نارية، تشفير، VPN)
النسخ الاحتياطي	يدوي	تلقائي + استعادة سريعة
المسؤولية	المستخدم	فريق IT متخصص
السرعة	جيدة (LAN)	ممتازة (شبكة محسّنة)
الوصول عن بعد	محدود	متاح عبر VPN
التطوير	مباشر (Dev)	منفصل (Dev/Staging/Prod)
6️⃣ التحقق من التشغيل
bash
# 1. التأكد من تشغيل السيرفر
curl http://localhost:3000/api/projects

# 2. التأكد من قاعدة البيانات
sqlcmd -S localhost -U pm_user -P 'SecurePassword123!' -Q "SELECT 1"

# 3. التأكد من Nginx
sudo systemctl status nginx

# 4. التأكد من PM2
pm2 status
📋 قائمة مراجعة النشر (Deployment Checklist)
نسخ المشروع إلى السيرفر

تثبيت Node.js و npm

تثبيت الاعتماديات (npm install)

إعداد ملف .env

تشغيل ملف database.sql (إنشاء الجداول)

اختبار التطبيق (node server.js)

إعداد PM2 أو Systemd لتشغيل دائم

إعداد Nginx كـ Reverse Proxy

إعداد SSL (HTTPS)

فتح المنفذ في الجدار الناري

اختبار الوصول من جهاز آخر

إعداد النسخ الاحتياطي التلقائي

إعداد مراقبة السيرفر (Monitoring)

توثيق الإعدادات

⚠️ ملاحظات أمنية مهمة
لا تستخدم root لتشغيل التطبيق، أنشئ مستخدماً مخصصاً

لا تخزن كلمات المرور في ملفات التطبيق (استخدم .env)

استخدم HTTPS دائماً (شهادة SSL)

حدد الصلاحيات (من يمكنه الوصول إلى النظام)

سجل محاولات الدخول (Logging)

استخدم VPN للوصول عن بعد بدلاً من فتح المنفذ للجميع

حدث التطبيق بانتظام وصيانة الأمان

//================================
الان اريد ربط شبكة داخلية ماذا اضع في الحاسبة السيرفر حتى يعمل التطبيق
🔧 إعداد السيرفر لتشغيل التطبيق على الشبكة الداخلية
1️⃣ إعداد نظام التشغيل (Windows Server / Windows 10/11)
أ. تعيين عنوان IP ثابت للسيرفر
في Windows:

افتح Control Panel > Network and Sharing Center > Change adapter settings

اضغط بزر الماوس الأيمن على Ethernet أو Wi-Fi > Properties

اختر Internet Protocol Version 4 (TCP/IPv4) > Properties

اختر Use the following IP address وأدخل:

text
IP address: 192.168.1.100    (اختر عنواناً ثابتاً)
Subnet mask: 255.255.255.0
Default gateway: 192.168.1.1 (عنوان الراوتر)
Preferred DNS server: 192.168.1.1
Alternate DNS server: 8.8.8.8
ب. معرفة اسم جهاز السيرفر (Hostname)
cmd
hostname
سيكون مثلاً: SERVER-PC أو DESKTOP-ABC123

2️⃣ تثبيت المتطلبات على السيرفر
أ. تثبيت Node.js
تحميل Node.js من: https://nodejs.org/

اختر الإصدار LTS (مثل 20.x)

ثبّت مع تفعيل خيار Add to PATH

ب. تثبيت SQL Server (أو استخدام SQL Server موجود)
تأكد من أن SQL Server يعمل ويقبل الاتصالات

تأكد من اسم السيرفر: localhost أو .\SQLEXPRESS

ج. فتح منفذ في الجدار الناري (Windows Firewall)
فتح المنفذ 3000 (أو المنفذ الذي تستخدمه):

اذهب إلى Control Panel > Windows Defender Firewall > Advanced settings

اختر Inbound Rules > New Rule

اختر Port > Next

اختر TCP و Specific local ports: أدخل 3000

اختر Allow the connection > Next

اختر Domain, Private, Public > Next

أعط الاسم: Node.js Server > Finish

3️⃣ إعداد قاعدة البيانات (SQL Server)
أ. تمكين الاتصالات عن بعد (Remote Connections)
افتح SQL Server Management Studio (SSMS)

اضغط بزر الماوس الأيمن على السيرفر > Properties

اختر Connections > فعّل Allow remote connections to this server

ب. تمكين بروتوكول TCP/IP
افتح SQL Server Configuration Manager

اختر SQL Server Network Configuration > Protocols for MSSQLSERVER

تأكد من أن TCP/IP مفعّل (Enabled)

اضغط بزر الماوس الأيمن على TCP/IP > Properties

في تبويب IP Addresses:

اذهب إلى IPAll

TCP Port: أدخل 1433

أعد تشغيل خدمة SQL Server من Services

ج. إنشاء قاعدة البيانات وجداولها
افتح SSMS واتصل بالسيرفر

قم بتشغيل ملف database.sql لإنشاء الجداول

4️⃣ إعداد مشروع Node.js
أ. نسخ المشروع إلى السيرفر
انسخ مجلد المشروع إلى مكان مثل:

text
C:\planning-manager\
ب. إعداد ملف .env
أنشئ ملف .env في مجلد المشروع:

text
# السيرفر
PORT=3000
NODE_ENV=production

# قاعدة البيانات - SQL Server
DB_HOST=localhost
DB_USER=sa
DB_PASSWORD=YourStrongPassword123!
DB_NAME=planning_manager

# قاعدة البيانات - MySQL (إذا كنت تستخدم MySQL)
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=YourPassword
# DB_NAME=planning_manager

# الأمان
JWT_SECRET=your-super-secret-key-change-this
ج. تثبيت الاعتماديات
افتح Command Prompt كمسؤول (Run as Administrator):

cmd
cd C:\planning-manager
npm install
د. اختبار التطبيق
cmd
node server.js
إذا ظهرت الرسالة 🚀 الخادم يعمل على: http://localhost:3000 فهذا يعني أن التطبيق يعمل.

5️⃣ تعديل server.js للاستماع على الشبكة
تأكد من أن ملف server.js يحتوي على هذا الكود:

javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));

// Serve frontend for all other routes (SPA)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
});

const PORT = process.env.PORT || 3000;

// ===== استمع على جميع الواجهات =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 الخادم يعمل على: http://localhost:${PORT}`);
  console.log(`📊 الشبكة الداخلية: http://${getLocalIP()}:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api\n`);
});

// دالة لجلب عنوان IP المحلي
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}
6️⃣ تشغيل التطبيق بشكل دائم (Production)
أ. استخدام PM2 (مفضل)
cmd
npm install -g pm2
cd C:\planning-manager
pm2 start server.js --name "planning-manager"
pm2 save
pm2 startup
ب. استخدام Windows Service (بديل)
تثبيت pm2-windows-service:

cmd
npm install -g pm2-windows-service
pm2-service-install -n "PlanningManager"
pm2 start server.js --name "planning-manager"
7️⃣ الاتصال من الحاسبات الأخرى
من أي حاسبة على نفس الشبكة:
افتح المتصفح واكتب:

text
http://192.168.1.100:3000
(استخدم عنوان IP الخاص بالسيرفر)

أو باستخدام اسم الجهاز:
text
http://SERVER-PC:3000
8️⃣ التحقق من الاتصال
من حاسبة أخرى، افتح Command Prompt:
cmd
ping 192.168.1.100
يجب أن ترى رسائل Reply from...

اختبار الوصول إلى التطبيق:
cmd
curl http://192.168.1.100:3000
أو افتح المتصفح على http://192.168.1.100:3000

9️⃣ مشاركة الطابعة من السيرفر
أ. مشاركة الطابعة
Control Panel > Devices and Printers

اضغط بزر الماوس الأيمن على الطابعة > Printer properties

تبويب Sharing:

فعّل Share this printer

أعطها اسماً مثل OfficePrinter

ب. من الحاسبات الأخرى:
Control Panel > Devices and Printers

Add a printer

اختر Add a network, wireless or Bluetooth printer

انتظر حتى تظهر الطابعة، أو استخدم:

text
\\192.168.1.100\OfficePrinter
🔟 قائمة التحقق النهائية
الخطوة	الحالة
[ ] تثبيت Node.js على السيرفر	☐
[ ] تثبيت SQL Server	☐
[ ] إنشاء قاعدة البيانات	☐
[ ] نسخ المشروع إلى السيرفر	☐
[ ] إعداد ملف .env	☐
[ ] تشغيل npm install	☐
[ ] تعديل server.js للاستماع على 0.0.0.0	☐
[ ] فتح المنفذ 3000 في الجدار الناري	☐
[ ] تشغيل التطبيق (node server.js)	☐
[ ] اختبار من جهاز آخر	☐
[ ] إعداد PM2 للتشغيل الدائم	☐
[ ] مشاركة الطابعة	☐
📝 ملخص الأوامر السريعة
cmd
# 1. معرفة IP السيرفر
ipconfig

# 2. تشغيل التطبيق
cd C:\planning-manager
node server.js

# 3. تشغيل التطبيق مع PM2
pm2 start server.js --name "planning-manager"
pm2 status
pm2 logs

# 4. اختبار الوصول من جهاز آخر
ping 192.168.1.100
بعد إتمام هذه الخطوات، سيكون النظام متاحاً لجميع الحاسبات على الشبكة الداخلية عبر:

text
http://192.168.1.100:3000


 */