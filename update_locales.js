const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'src', 'locales');
const namespaces = ['products', 'categories', 'addons'];

const enTranslations = {
  "toggleStatus": "Toggle Status",
  "statusToggleConfirmation": "Are you sure you want to toggle the active status of this item?"
};

const arTranslations = {
  "toggleStatus": "تبديل الحالة",
  "statusToggleConfirmation": "هل أنت متأكد أنك تريد تبديل حالة تنشيط هذا العنصر؟"
};

namespaces.forEach(ns => {
  ['en', 'ar'].forEach(lang => {
    const filePath = path.join(localesPath, lang, `${ns}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const trans = lang === 'en' ? enTranslations : arTranslations;
      Object.assign(data, trans);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Updated ${lang}/${ns}.json`);
    }
  });
});
