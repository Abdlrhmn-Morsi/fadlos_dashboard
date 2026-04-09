const fs = require('fs');
const files = [
    'src/features/products/api/products.api.ts',
    'src/features/categories/api/categories.api.ts',
    'src/features/addons/api/addons.api.ts'
];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/headers: \{\s*'Content-Type': 'multipart\/form-data',\s*\}/g, "headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}");
    fs.writeFileSync(file, content);
});
console.log('Fixed APIs');
