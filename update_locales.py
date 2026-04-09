import json
import os

locales_path = os.path.join(os.getcwd(), 'src', 'locales')
namespaces = ['products', 'categories', 'addons']

en_translations = {
  "toggleStatus": "Toggle Status",
  "statusToggleConfirmation": "Are you sure you want to toggle the active status of this item?"
}

ar_translations = {
  "toggleStatus": "تبديل الحالة",
  "statusToggleConfirmation": "هل أنت متأكد أنك تريد تبديل حالة تنشيط هذا العنصر؟"
}

for ns in namespaces:
    for lang, trans in [('en', en_translations), ('ar', ar_translations)]:
        file_path = os.path.join(locales_path, lang, f"{ns}.json")
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            data.update(trans)
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Updated {lang}/{ns}.json")

# Update common
for lang, text in [('en', 'Status updated successfully'), ('ar', 'تم تحديث الحالة بنجاح')]:
    file_path = os.path.join(locales_path, lang, "common.json")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if "success" not in data: # Wait, success already has a value in common? 
                                  # Let's check common.json first, or just define it.
                                  # Let's not override common:success since it's probably generic ('Success')
            pass # We used `t('common:success', { defaultValue: 'Status updated via toggle' })`
                 # We probably shouldn't override "success". Let's add "statusUpdatedViaToggle".

