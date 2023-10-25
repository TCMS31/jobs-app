# Jobs Server

## Getting started

This is a full-stack web application that combines a React-based frontend with a Node.js Express backend, and it uses PostgreSQL for the database. In this project, users can browse job listings and apply for jobs. Upon applying, the "Apply to Job" button transforms into "Applied," and users can also sign up and log in to manage their applications and access additional features.

**Features**
- Job Listings: View a list of available job opportunities.
- Job Application: Users can apply for jobs by clicking the "Apply to Job" button, which changes to "Applied" upon submission.
- User Authentication: Register and log in to the platform to manage job applications and access personalized features.

**Technologies Used**
- Frontend: React
- Backend: Node.js with Express
- Database: PostgreSQL

**Getting Started**
To get started with this project, follow the instructions below:

**Prerequisites**
- Node.js installed
- npm (Node Package Manager) installed
- PostgreSQL installed and running



## UI
<img width="1680" alt="Screenshot 2023-10-25 at 6 12 41 AM" src="https://github.com/Chsaleem31/jobs-app/assets/119432487/c32d8997-8da8-4fae-ad8f-27300d9d6b2e">


### Clone the Repository:
```
git clone [<repository-url>](https://github.com/Chsaleem31/jobs-app.git)
```
create a .env file and copy content from .env.example to it

### 1. Install dependencies

#### Prerequisite : Node.js v18.16

Install dependencies using yarn:

```
yarn install
```

### 2. Setup environment variables

Rename `.env.example` file with `.env`.
By default, Database URI is set to:

```
postgresql://root:root@localhost:5432/jobs-db
```

Make sure to replace `root (username)` & `root (password)` in `DATABASE_URL` with your PostgreSQL username & password set on your local machine.
Default server port is set to 8080. You can change it in env file by changing `PORT` value if 8080 is already in use for your machine.

### 3. Setup, migrate & seed database

Run following commands in the terminal:

```
npx prisma migrate deploy
```

```
npx prisma db seed
```

### 4. Start the server

For production server, run this command:

```
yarn start
```

For development server, run this command:

```
yarn run dev
```

Server will start at `http://localhost:8080` by default.

## Running test cases

Quit the server if it is running.
Run following command in the terminal.

```
yarn run test
```

# Jobs Application

## Installation

Install dependencies using yarn:

```
npm install --global yarn
yarn install
```

## Available Scripts

## Run the app in the development mode.

```
yarn start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.




## Running test cases

Quit the server if it is running.
Run following command in the terminal.

```
yarn run test
```
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.




