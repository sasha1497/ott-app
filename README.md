# OTT Platform Backend API Test Guide

NestJS backend for an OTT platform. This README is written as a manual API test document for the current architecture: authentication, users, videos, and video streaming.

## Project Structure

```text
src/
  app.module.ts
  main.ts
  common/
    decorators/       # @Public, @Roles, @CurrentUser
    guards/           # JWT auth guard and role guard
    filters/          # global exception formatting
    interceptors/     # response transform interceptor
    utils/            # upload storage and file filters
  config/             # env-driven app/database/jwt/upload config
  database/           # global PostgreSQL pool + DatabaseService
  modules/
    auth/             # register, login, token refresh, password reset, email verify
    users/            # profile, password, profile image
    categories/       # video category CRUD
    videos/           # catalog, search, upload metadata, stream endpoint
    favorites/        # user favorite videos
    watch-history/    # progress tracking
```

## Run Locally

```bash
npm install
npm run start:dev
```

Default API base URL:

```text
http://localhost:3000/api/v1
```

Useful environment variables:

```env
PORT=3000
API_PREFIX=api/v1
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ott_platform
DB_USER=postgres
DB_PASSWORD=postgres
JWT_ACCESS_SECRET=access_secret
JWT_REFRESH_SECRET=refresh_secret
CORS_ORIGIN=*
```

Create local env files:

```bash
# Shareable template is committed:
.env.example

# Local runtime file is ignored by git:
.env
```

The included local `.env` uses the same PostgreSQL values as `docker-compose.yml`:

```text
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ott_platform
DB_USER=postgres
DB_PASSWORD=postgres
```

For production, replace `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, SMTP values, and Razorpay values with real private credentials.

## Build And Startup Checks

Run these before API testing:

```bash
npx tsc --noEmit
npx nest build
npm run start:dev
```

Expected result:

- TypeScript has no compile errors.
- Nest logs show all modules initialized.
- No error like `Nest can't resolve dependencies`.
- App starts at `http://localhost:3000/api/v1`.

## Auth Rules

Most routes are protected by the global JWT guard in:

```text
src/common/guards/jwt-auth.guard.ts
```

Public routes use:

```text
src/common/decorators/public.decorator.ts
```

Admin-only routes use:

```text
src/common/decorators/roles.decorator.ts
src/common/guards/roles.guard.ts
```

For protected routes, send:

```http
Authorization: Bearer <accessToken>
```

## Test Data Variables

Use these shell variables while testing:

```bash
BASE_URL=http://localhost:3000/api/v1
ACCESS_TOKEN=
REFRESH_TOKEN=
VIDEO_ID=
CATEGORY_ID=
```

## Auth API Test Cases

Module files:

```text
src/modules/auth/auth.controller.ts
src/modules/auth/auth.service.ts
src/modules/auth/auth.module.ts
```

### 1. Register User

```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test.user@example.com",
    "password": "Password123",
    "phone": "9999999999"
  }'
```

Expected:

- `201 Created`
- Response contains `user`, `accessToken`, and `refreshToken`.
- Password is not returned.

Negative checks:

- Duplicate email returns conflict.
- Weak password returns validation error.
- Invalid email returns validation error.

### 2. Login

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com",
    "password": "Password123"
  }'
```

Expected:

- `200 OK`
- Response contains `accessToken` and `refreshToken`.

Save tokens:

```bash
ACCESS_TOKEN=<copy accessToken>
REFRESH_TOKEN=<copy refreshToken>
```

Negative checks:

- Wrong password returns `401 Unauthorized`.
- Unknown email returns `401 Unauthorized`.

### 3. Get Auth Profile

```bash
curl "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Expected:

- `200 OK`
- Returns current authenticated user.

Negative checks:

- Missing token returns `401 Unauthorized`.
- Invalid token returns `401 Unauthorized`.

### 4. Refresh Token

```bash
curl -X POST "$BASE_URL/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }"
```

Expected:

- `200 OK`
- Returns a new access token and refresh token.
- Old refresh token is rotated.

### 5. Logout

```bash
curl -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }"
```

Expected:

- `200 OK`
- Refresh token is deleted.

### 6. Forgot And Reset Password

```bash
curl -X POST "$BASE_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com"
  }'
```

Expected:

- Always returns the same safe message, even when email does not exist.

Reset password with a token from the database/email flow:

```bash
curl -X POST "$BASE_URL/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<reset-token>",
    "newPassword": "NewPassword123"
  }'
```

Expected:

- Password changes.
- Existing refresh tokens for the user are revoked.

## Users API Test Cases

Module files:

```text
src/modules/users/users.controller.ts
src/modules/users/users.service.ts
src/modules/users/users.module.ts
```

All user routes require:

```http
Authorization: Bearer <accessToken>
```

### 1. Get Current User

```bash
curl "$BASE_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Expected:

- `200 OK`
- Returns safe user profile.

### 2. Update Current User

```bash
curl -X PUT "$BASE_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Tester",
    "phone": "8888888888"
  }'
```

Expected:

- `200 OK`
- Updated profile is returned.

### 3. Upload Profile Image

```bash
curl -X POST "$BASE_URL/users/me/profile-image" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "image=@/absolute/path/to/profile.png"
```

Expected:

- `201 Created`
- User profile image path is updated to `/uploads/profiles/<file>`.

Negative checks:

- Non-image file is rejected.
- File larger than 5 MB is rejected.

### 4. Change Password

```bash
curl -X PUT "$BASE_URL/users/change-password" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Password123",
    "newPassword": "NewPassword123"
  }'
```

Expected:

- `200 OK`
- Old password no longer works.
- New password works.

Negative checks:

- Wrong current password returns `401 Unauthorized`.
- Same current and new password returns validation/business error.

### 5. Delete Current User

```bash
curl -X DELETE "$BASE_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Expected:

- `200 OK`
- User account is deleted.

## Videos API Test Cases

Module files:

```text
src/modules/videos/videos.controller.ts
src/modules/videos/videos.service.ts
src/modules/videos/video-stream.service.ts
src/modules/videos/videos.module.ts
```

Public video catalog routes:

- `GET /videos`
- `GET /videos/featured`
- `GET /videos/latest`
- `GET /videos/popular`
- `GET /videos/search`
- `GET /videos/category/:id`
- `GET /videos/:id`
- `GET /videos/stream/:id`

Admin-only routes:

- `POST /videos`
- `PUT /videos/:id`
- `DELETE /videos/:id`
- `POST /videos/upload`
- `POST /videos/thumbnail`

Admin routes require:

```http
Authorization: Bearer <admin accessToken>
```

### 1. List Videos

```bash
curl "$BASE_URL/videos?page=1&limit=20&sortBy=created_at&sortOrder=desc"
```

Expected:

- `200 OK`
- Response contains `items` and pagination `meta`.
- Only published videos are listed.

Optional query params:

```text
page
limit
sortBy
sortOrder
categoryId
language
```

### 2. Featured Videos

```bash
curl "$BASE_URL/videos/featured?limit=10"
```

Expected:

- `200 OK`
- Returns published featured videos.

### 3. Latest Videos

```bash
curl "$BASE_URL/videos/latest?limit=10"
```

Expected:

- `200 OK`
- Returns newest published videos by release date and creation date.

### 4. Popular Videos

```bash
curl "$BASE_URL/videos/popular?limit=10"
```

Expected:

- `200 OK`
- Returns videos ordered by watch-history activity.

### 5. Search Videos

```bash
curl "$BASE_URL/videos/search?q=movie&page=1&limit=20"
```

Expected:

- `200 OK`
- Searches title and description for published videos.

Negative check:

- Missing `q` returns validation error.

### 6. Videos By Category

```bash
curl "$BASE_URL/videos/category/$CATEGORY_ID?page=1&limit=20"
```

Expected:

- `200 OK`
- Returns published videos for the category.

### 7. Get One Video

```bash
curl "$BASE_URL/videos/$VIDEO_ID"
```

Expected:

- `200 OK`
- Returns video details.

Negative check:

- Unknown UUID returns `404 Not Found`.
- Invalid UUID returns validation error.

### 8. Create Video Metadata

```bash
curl -X POST "$BASE_URL/videos" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Demo Video",
    "description": "Manual API test video",
    "categoryId": "<category-uuid>",
    "duration": 120,
    "releaseDate": "2026-06-30",
    "language": "en",
    "ageRating": "U/A",
    "isFeatured": false,
    "isPublished": true
  }'
```

Expected:

- Admin token: `201 Created`.
- Non-admin token: `403 Forbidden`.
- Save returned `id` as `VIDEO_ID`.

### 9. Update Video Metadata

```bash
curl -X PUT "$BASE_URL/videos/$VIDEO_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Demo Video",
    "isFeatured": true
  }'
```

Expected:

- Admin token: `200 OK`.
- Updated video is returned.

### 10. Upload Video File

```bash
curl -X POST "$BASE_URL/videos/upload" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "videoId=$VIDEO_ID" \
  -F "video=@/absolute/path/to/video.mp4"
```

Expected:

- Admin token: `201 Created`.
- Video `video_url` becomes `/uploads/videos/<file>`.

Negative checks:

- Non-video file is rejected.
- File larger than configured limit is rejected.
- Unknown `videoId` returns `404 Not Found`.

### 11. Upload Thumbnail

```bash
curl -X POST "$BASE_URL/videos/thumbnail" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "videoId=$VIDEO_ID" \
  -F "thumbnail=@/absolute/path/to/thumbnail.png"
```

Expected:

- Admin token: `201 Created`.
- Video `thumbnail` becomes `/uploads/thumbnails/<file>`.

### 12. Delete Video

```bash
curl -X DELETE "$BASE_URL/videos/$VIDEO_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Expected:

- Admin token: `200 OK`.
- Deleted video no longer appears in catalog.

## Video Streaming API Test Cases

Streaming code:

```text
src/modules/videos/video-stream.service.ts
src/modules/videos/videos.controller.ts
```

Route:

```text
GET /api/v1/videos/stream/:id
```

### 1. Stream With Browser

Open:

```text
http://localhost:3000/api/v1/videos/stream/<VIDEO_ID>
```

Expected:

- Browser can play the video.
- Server responds with partial content when the browser sends range headers.

### 2. Stream With Range Header

```bash
curl -i "$BASE_URL/videos/stream/$VIDEO_ID" \
  -H "Range: bytes=0-1023"
```

Expected:

- `206 Partial Content`
- Headers include:
  - `Content-Range`
  - `Accept-Ranges: bytes`
  - `Content-Length`
  - `Content-Type: video/...`

### 3. Stream Without Range Header

```bash
curl -I "$BASE_URL/videos/stream/$VIDEO_ID"
```

Expected:

- Returns video headers or streams the full file, depending on client behavior.

### 4. Stream Missing Video

```bash
curl -i "$BASE_URL/videos/stream/00000000-0000-0000-0000-000000000000"
```

Expected:

- `404 Not Found` if video does not exist or has no file URL.

## Categories Quick Test

Create category as admin:

```bash
curl -X POST "$BASE_URL/categories" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Action",
    "description": "Action movies and shows"
  }'
```

List categories:

```bash
curl "$BASE_URL/categories"
```

Expected:

- Public list endpoint returns all categories.
- Create/update/delete require admin role.

## Favorites Quick Test

Add favorite:

```bash
curl -X POST "$BASE_URL/favorites/$VIDEO_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

List favorites:

```bash
curl "$BASE_URL/favorites" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Remove favorite:

```bash
curl -X DELETE "$BASE_URL/favorites/$VIDEO_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Expected:

- Duplicate favorite returns conflict.
- Removing missing favorite returns `404 Not Found`.

## Watch History Quick Test

Save progress:

```bash
curl -X POST "$BASE_URL/watch-history" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"videoId\": \"$VIDEO_ID\",
    \"watchedSeconds\": 45,
    \"completed\": false
  }"
```

Update progress:

```bash
curl -X PUT "$BASE_URL/watch-history/$VIDEO_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "watchedSeconds": 120,
    "completed": true
  }'
```

List history:

```bash
curl "$BASE_URL/watch-history" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Clear history:

```bash
curl -X DELETE "$BASE_URL/watch-history/clear" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Expected:

- Progress is inserted or updated for the same user/video pair.
- Unknown video returns `404 Not Found`.

## Common Negative Test Checklist

- Protected route without token returns `401 Unauthorized`.
- Protected route with malformed token returns `401 Unauthorized`.
- Admin route with normal user token returns `403 Forbidden`.
- Invalid UUID path params return validation error.
- DTO validation rejects invalid body fields.
- Unknown database row returns `404 Not Found`.
- Duplicate unique data returns conflict where enforced.
- Upload endpoints reject wrong file type.
- Streaming endpoint returns `404` when `video_url` is missing or file is missing.

## Automated Test Commands

```bash
npm run test
npm run test:e2e
npm run test:cov
```

Recommended e2e coverage:

- Auth register/login/refresh/logout flow.
- JWT guard public vs protected route behavior.
- Role guard user vs admin behavior.
- User profile update and password change.
- Video catalog list/search/filter/pagination.
- Admin video create/update/upload/delete.
- Streaming range request returns `206 Partial Content`.
- Favorites add/list/remove.
- Watch history save/update/list/clear.
