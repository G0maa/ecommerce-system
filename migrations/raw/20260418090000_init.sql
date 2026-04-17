CREATE TABLE category (
    uuid BINARY(16) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE customer (
    uuid BINARY(16) PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE product (
    uuid BINARY(16) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL,
    description TEXT,
    category_uuid BINARY(16) NOT NULL,
    FOREIGN KEY (category_uuid)
        REFERENCES category(uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE orders (
    uuid BINARY(16) PRIMARY KEY,
    order_date TIMESTAMP NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    customer_uuid BINARY(16) NOT NULL,
    FOREIGN KEY (customer_uuid)
        REFERENCES customer(uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE order_details(
    uuid BINARY(16) PRIMARY KEY,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    order_uuid BINARY(16) NOT NULL,
    product_uuid BINARY(16) NOT NULL,
    FOREIGN KEY (order_uuid)
        REFERENCES orders(uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (product_uuid)
        REFERENCES product(uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
