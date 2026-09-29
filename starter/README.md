\# Sudoku Flask Web Application



A responsive Sudoku web application built with Python and Flask. The application generates Sudoku puzzles with different difficulty levels and provides validation, hints, a timer, completion feedback, and a persistent Top 10 leaderboard.



\## Features



\- Sudoku puzzle generation with a unique solution

\- Easy, Medium, and Hard difficulty levels

\- Locked prefilled Sudoku cells

\- Immediate validation of incorrect entries

\- Check button to identify incorrect cells

\- Completion detection with a success message

\- Hint functionality

\- Hint count tracking

\- Game timer

\- Persistent Top 10 fastest-times leaderboard

\- Player name, completion time, difficulty, and hint count stored in browser localStorage

\- Light and Dark Mode

\- Responsive design for desktop, tablet, and mobile screens

\- Alternating visual colors for 3x3 Sudoku blocks

\- Flask backend with JSON API endpoints

\- Automated testing using pytest



\## Technologies Used



\- Python

\- Flask

\- HTML5

\- CSS3

\- JavaScript

\- Browser localStorage for leaderboard persistence

\- pytest



\## Project Structure



```text

starter/

├── app.py

├── sudoku\_logic.py

├── instruction.md

├── requirements.txt

├── pytest.ini

├── README.md

│

├── static/

│   └── ...

│

├── templates/

│   └── ...

│

├── tests/

│   ├── test\_app.py

│   └── test\_sudoku\_logic.py

│

└── Screenshots/

&#x20;   ├── initial\_tests.png

&#x20;   ├── 01\_instruction\_file\_prompt.png

&#x20;   ├── 02\_testing\_setup\_prompt.png

&#x20;   ├── ...

&#x20;   └── 20\_final\_tests\_passing.png

