require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./database");

async function createAdmin() {
  const username = String(
    process.argv[2] || ""
  ).trim();

  const password = String(
    process.argv[3] || ""
  );

  if (!username || !password) {
    console.error(
      "Использование: node server/create-admin.js логин пароль"
    );

    process.exit(1);
  }

  if (username.length < 4 || username.length > 50) {
    console.error(
      "Логин должен содержать от 4 до 50 символов."
    );

    process.exit(1);
  }

  if (password.length < 12) {
    console.error(
      "Пароль должен содержать минимум 12 символов."
    );

    process.exit(1);
  }

  const existingAdmin = db
    .prepare(`
      SELECT id
      FROM admins
      WHERE username = ?
    `)
    .get(username);

  const passwordHash =
    await bcrypt.hash(password, 12);

  if (existingAdmin) {
    db.prepare(`
      UPDATE admins
      SET
        password_hash = ?,
        is_active = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      passwordHash,
      existingAdmin.id
    );

    console.log(
      `Пароль администратора "${username}" обновлён.`
    );

    return;
  }

  db.prepare(`
    INSERT INTO admins (
      username,
      password_hash
    )
    VALUES (?, ?)
  `).run(
    username,
    passwordHash
  );

  console.log(
    `Администратор "${username}" создан.`
  );
}

createAdmin().catch((error) => {
  console.error(
    "Не удалось создать администратора:",
    error
  );

  process.exit(1);
});