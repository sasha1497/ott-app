CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),

    email VARCHAR(255) UNIQUE NOT NULL,

    password VARCHAR(255) NOT NULL,

    phone VARCHAR(20),

    profile_image TEXT,

    role VARCHAR(20) DEFAULT 'USER',

    email_verified BOOLEAN DEFAULT FALSE,

    status BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE videos (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID REFERENCES categories(id),

    title VARCHAR(255) NOT NULL,

    description TEXT,

    thumbnail TEXT,

    video_url TEXT,

    duration INTEGER,

    release_date DATE,

    language VARCHAR(50),

    age_rating VARCHAR(20),

    is_featured BOOLEAN DEFAULT FALSE,

    is_published BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100),

    price NUMERIC(10,2),

    duration_days INTEGER,

    description TEXT,

    status BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_subscriptions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id),

    subscription_id UUID REFERENCES subscriptions(id),

    start_date TIMESTAMP,

    end_date TIMESTAMP,

    status VARCHAR(30),

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id),

    subscription_id UUID REFERENCES subscriptions(id),

    payment_gateway VARCHAR(100),

    transaction_id VARCHAR(255),

    amount NUMERIC(10,2),

    currency VARCHAR(20) DEFAULT 'INR',

    payment_status VARCHAR(50),

    paid_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE watch_history (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id),

    video_id UUID REFERENCES videos(id),

    watched_seconds INTEGER DEFAULT 0,

    completed BOOLEAN DEFAULT FALSE,

    last_watched TIMESTAMP DEFAULT NOW()
);

CREATE TABLE favorites (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id),

    video_id UUID REFERENCES videos(id),

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id),

    token TEXT,

    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_video_category
ON videos(category_id);

CREATE INDEX idx_watch_user
ON watch_history(user_id);

CREATE INDEX idx_watch_video
ON watch_history(video_id);

CREATE INDEX idx_payment_user
ON payments(user_id);

CREATE INDEX idx_subscription_user
ON user_subscriptions(user_id);