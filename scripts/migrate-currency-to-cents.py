import sqlite3

MONEY_COLUMNS = {
    'products': ['cost'],
    'product_pricing': ['sell_price', 'competitor_price'],
    'purchases': ['total_amount_paid', 'total_amount_paid_sgd'],
    'purchase_items': [
        'unit_cost',
        'unit_cost_sgd',
        'total_cost',
        'total_cost_sgd',
        'shipping_fee',
        'shipping_fee_sgd',
        'other_fee',
        'other_fee_sgd',
    ],
    'finance_entries': ['amount'],
    'vouchers': ['min_spend', 'discount', 'max_discount'],
}


def convert_to_cents(cursor: sqlite3.Cursor, table: str, column: str) -> None:
    cursor.execute(
        f"""
        UPDATE {table}
        SET {column} = CAST(ROUND({column} * 100, 0) AS INTEGER)
        WHERE {column} IS NOT NULL
        """
    )


def main() -> None:
    conn = sqlite3.connect('gentech.sqlite')
    cursor = conn.cursor()

    for table, columns in MONEY_COLUMNS.items():
        for column in columns:
            convert_to_cents(cursor, table, column)

    conn.commit()
    conn.close()


if __name__ == '__main__':
    main()
