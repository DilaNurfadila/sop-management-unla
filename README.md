# Standard Operating Procedure Management UNLA

SOP Management is an application to manage SOP in each unit or campus organization, especially at Langlangbuana University.

## Status

This application is still under development

## Existing Features

- CRUD SOP

- SOP publication (all users, including guests, only university SOPs)

- SOP publication per units (all internal university users according to work unit)

- Login

- Register

- Forgot password

- SOP Feedback

- SOP Archive

- User settings

- Manage users

- Log Activity (only superadmin)

- Manage units

- Assign create SOP with admin & admin unit

- SOP revision via SOP creator

- Manage assignments [admin & admin unit]

- My assignments [admin unit & user]

- KPI Dashboard (only superadmin & admin)

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

7. [Mermaid js](https://mermaid.js.org/) => JavaScript based diagramming and charting tool

8. [QR Code](https://www.npmjs.com/package/qrcode) => QR code/2d barcode generator

### ⚠️ Attention

If you encounter any errors or bugs, or would like to provide feedback and suggestions on this application, please contact us via [email](mailto:nurfadila1523@gmail.com)
