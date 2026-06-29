# Backend separation plan

This project is intentionally built with HTML, CSS, and JavaScript only for the user interface.
The backend logic is separated into this folder as a future integration layer.

## Intended backend responsibilities
- user registration verification
- document validation
- secure authentication
- pension and benefit workflow processing
- community moderation
- content management

## Front-end demo storage
The current prototype uses browser localStorage in `frontend/js/app.js` to simulate:
- registration
- login
- dashboard population

## Next step
Replace localStorage with a real API and database when the backend stack is selected.