# Standard Operating Procedure Management UNLA

SOP Management is an application to manage SOP in each unit or campus organization, especially at Langlangbuana University.

## Status

This application is still under development

## Existing Features

- CRUD SOP

- SOP Publication

- Login (with email service)

## How to Install

1. Clone this repository

2. Change directory to backend/frontend

3. Run `npm install` in each folder (backend & frontend)

## How to Run

1. Backend -> run `npm run dev`

2. Frontend -> run `npm start`

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
- KEY

Frontend :

- VITE_SECRET_KEY

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
