Ryo Currency Blackjack Game
This is a decentralized blackjack game built with ReactJS for the frontend and Python (FastAPI/Flask) + Node.js for the backend. It integrates RYO cryptocurrency support, multiplayer logic via WebSockets, and provides a complete gaming experience.

Getting Started with Create React App
This project was bootstrapped with Create React App.

Available Scripts (Frontend):

In the frontend directory, you can run:

npm start
Runs the app in development mode.
Open http://localhost:3000 to view it in your browser.
The page will reload when you make changes. You may also see any lint errors in the console.

Backend Requirements
Make sure you have Python 3.6+ and Node.js/npm installed.

Install Backend Dependencies:

For app.py and multiplayer_server.py:
pip install flask flask-cors

For check_balance.py:
pip install requests
Also run:

ryod.exe

ryo_wallet_cli.exe

For history.py:
pip install fastapi pydantic uvicorn

For main.py:
pip install fastapi uvicorn httpx pydantic python-multipart

For server.js:
npm install express socket.io cors

Frontend Dependencies
Run the following in the frontend directory:

npm install react react-dom react-router-dom
npm install socket.io-client
npm install react-confetti
npm install react-icons

How to Run the Project
You need to open 6 terminals 

backend >> uvicorn main:app --reload --port 8000
backend >> uvicorn main:app --reload --port 5002
backend >> node server.js
backend >> python multiplayer_server.py
backend >> python app.py
frontend >> npm start


Learn More
React Documentation: https://reactjs.org/
FastAPI Documentation: https://fastapi.tiangolo.com/
Flask Documentation: https://flask.palletsprojects.com/
Socket.IO Documentation: https://socket.io/docs/

Developer
Developed by Nisha Shahzad

