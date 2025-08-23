# Standard Operating Procedure Management UNLA

SOP Management is an application to manage SOP in each unit or campus organization, especially at Langlangbuana University.

## Status

This application is still under development

## Existing Features

- CRUD SOP (with upload PDF)

- SOP Publication

- Login

- Displaying SOP published on public page

- SOP Feedback

- SOP Archive

- Displaying user profile

- User settings

- Users management

- Log Activity (on progress)

## How to Install

1. Clone this repository

2. Change directory to backend/frontend

3. Run `npm install` in each folder (backend & frontend)

## How to Run

Backend & frontend -> run `npm run dev`

Note :
There is an .env file that consists of :

Backend :

- PORT
- DB_HOST
- DB_USER
- DB_PASS
- DB_NAME
- EMAIL
- EMAIL_PASS
- JWT_SECRET
- JWT_REFRESH_SECRET
- FRONTEND_URL
- NODE_ENV
- ENCRYPTION_KEY
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID
- FIREBASE_MEASUREMENT_ID

Frontend :

- VITE_SECRET_KEY
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID

## Error Possible

Sometimes the package version is a problem when first trying projects from the repository, especially projects that have not been updated for a long time, during installation sometimes the version does not match. The solution to the problem is :

1. Remove the package from the package.json file (for example express package)

2. Install the package again manually (`npm install express`)

## Technology

1. [Express js](https://expressjs.com) => Backend

2. [React js](https://react.dev) => Frontend

3. [Tailwind CSS V.4.1](https://tailwindcss.com) => Styling

4. [MySQL](https://www.mysql.com) => Database

5. [Nodemailer](https://nodemailer.com) => Email service

6. [Vite](https://vite.dev) => The build tool for the web

7. [Firebase](https://firebase.google.com) => Storage for document
