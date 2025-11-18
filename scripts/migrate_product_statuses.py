import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "gentech.sqlite"


def main():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA foreign_keys = OFF")

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS product_statuses (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            )
            """
        )
        cursor.executemany(
            "INSERT OR IGNORE INTO product_statuses (id, name) VALUES (?, ?)",
            [(1, "Active"), (2, "Active Decoy"), (3, "Inactive")],
        )

        cursor.execute("DROP TABLE IF EXISTS products_new")
        cursor.execute(
            """
            CREATE TABLE products_new (
                id INTEGER PRIMARY KEY,
                sku TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                status_id INTEGER NOT NULL DEFAULT 1,
                cost INTEGER,
                supplier TEXT,
                supplier_link TEXT,
                purchase_remarks TEXT,
                supplier_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (status_id) REFERENCES product_statuses(id)
            )
            """
        )

        cursor.execute(
            """
            INSERT INTO products_new (
                id,
                sku,
                name,
                status_id,
                cost,
                supplier,
                supplier_link,
                purchase_remarks,
                supplier_id,
                created_at,
                updated_at
            )
            SELECT
                id,
                sku,
                name,
                CASE LOWER(status)
                    WHEN 'active decoy' THEN 2
                    WHEN 'inactive' THEN 3
                    ELSE 1
                END,
                cost,
                supplier,
                supplier_link,
                purchase_remarks,
                supplier_id,
                created_at,
                updated_at
            FROM products
            """
        )

        cursor.execute("DROP TABLE products")
        cursor.execute("ALTER TABLE products_new RENAME TO products")

        cursor.execute("PRAGMA foreign_keys = ON")
        conn.commit()


if __name__ == "__main__":
    main()
