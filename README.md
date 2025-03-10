English Words Trainer
=====================

English Words Trainer — це сучасний вебдодаток для інтерактивного вивчення англійських слів із підтримкою різних категорій, прогресу навчання та функцією озвучки. Ідеально підходить для початківців і тих, хто хоче розширити свій словниковий запас.

Функціональність
----------------

*   **Перегляд слів**: Відображення слова, його транскрипції та перекладу.

*   **Озвучка**: Вимова слів за допомогою синтезатора мовлення з підтримкою голосу "Дэниэл" або інших англійських голосів (залежить від браузера).

*   **Перемикання слів**: Перехід до нового слова при натисканні кнопки "Вже знаю".

*   **Прогрес навчання**: Відстеження вивчених слів із прогрес-баом (до 100% для кожної категорії).

*   **Словник**: Перегляд історії вивчених слів із можливістю фільтрації.

*   **Категорії**: Вибір тем (анатомія, їжа, спорт тощо) через бокове меню.

Структура проєкту
-----------------

*   index.html: Головна HTML-сторінка з адаптивним дизайном.

*   css/styles.css: Стилі оформлення, побудовані на Bootstrap 5 із кастомними анімаціями.

*   js/script.js: Основний JavaScript-код із логікою додатка (асинхронне завантаження, локальне зберігання, синтез мовлення).

*   vocabulary/: Папка з JSON-файлами словникових даних для кожної категорії (наприклад, anatomy.json).

*   images/: Зображення, включаючи favicon.ico, ukraine.svg і зображення для Open Graph (ogimage.jpg).

*   LICENSE: Файл із ліцензією проєкту.

Встановлення та запуск
----------------------

1.  **Залежності**:

*   **Bootstrap 5.3.3** (підключено через CDN).

*   **Google Fonts** (Poppins) і **Material Icons** (підключено через CDN).

*   Інтернет-підключення необхідно для завантаження стилів і шрифтів із CDN. Для офлайн-використання завантажте файли локально.

2.  **Запуск**:

*   Відкрийте index.html у сучасному браузері (Chrome, Firefox, Safari).

*   Переконайтеся, що файли JSON у папці vocabulary/ доступні (наприклад, vocabulary/anatomy.json).

3.  **Розгортання**:

*   Для публічного доступу розмістіть проєкт на сервері (наприклад, GitHub Pages) або локальному веб-сервері.

Внесення змін
-------------

1.  **Додавання категорій**:

*   Додайте новий JSON-файл у папку vocabulary/ (наприклад, newcategory.json) з масивом об'єктів { word, transcription, translation }.

*   Оновіть index.html, додавши категорію з відповідним заголовком і іконкою.

3.  **Редагування слів**:

*   Змініть вміст JSON-файлів у vocabulary/, дотримуючись формату.

4.  **Кастомізація стилів**:

*   Редагуйте css/styles.css для зміни дизайну.

Вимоги
------

*   Сучасний браузер із підтримкою speechSynthesis (Chrome, Firefox, Safari).

*   Інтернет для завантаження CDN-залежностей (або локальні копії для офлайн-використання).

Ліцензія
--------

Проєкт поширюється відповідно до ліцензії, зазначеної у файлі LICENSE.