# Copilot Instructions

- Write readable, modular Python that follows the project's existing conventions.
- Add type hints and concise docstrings to Python functions and public classes.
- Keep functions small and single-purpose; use clear, descriptive names.
- Keep Sudoku rules and puzzle generation in `sudoku_logic.py`.
- Keep Flask routes and request/response handling organized in the Flask application module, while keeping Sudoku logic separate in sudoku_logic.py.
- Keep browser code, styles, and templates in their existing frontend areas; put static assets under `static/`.
- Avoid mixing route handling, puzzle logic, and frontend behavior in one file.
- Add or update pytest tests for every feature and meaningful behavior change.
- Test normal cases, invalid input, and relevant error paths.
- Use plain CSS; support both light and dark color schemes.
- Preserve accessible contrast and usable layouts across screen sizes.
- Handle errors consistently: validate input at boundaries and return clear, appropriate responses.
- Do not expose internal exceptions or sensitive details to users.
- Before proposing code changes, explain the suggestion, its rationale, and any important tradeoffs.
- Wait for my approval before applying a suggested change.
- Keep changes focused; mention any assumptions or related risks before proceeding.