# Addressing feedback

## 1. User Interface
### 1.1. Wardrobe section
- In a card for a clothing item:
    + The Edit button works normally. 
    + The Delete button is not visible. 
    + The "Log Wear" button is visible but is not connected to any functionality. 
- Business logic: When a user clicks on the "Log Wear" button:
    + The Wear Count should increment by 1. 
    + The Last Worn date should update to the current date. 
    + Optional: Have a button to revert the change if the user accidentally clicks on the button. 
- Next steps: 
    + Shichang: 
        - Add a "Delete" button to the card and connect the button to the Delete API. 
        - Connect the "Log Wear" button to the Wear Count and Last Worn date.
    + Akbota: 
        - Connect the backend and the frontend. 

## 2. Separation of concern
- An issue recorded by the professor is that the frontend is directly connected to the database. 
- In reality, it should be the frontend connecting to the backend, and the backend connecting to the database. 

Two issues are recorded in WardrobeContext.tsx: 
### 2.1. WardrobeView generates a temporary ID
- This is from the file pages/WardrobeView.tsx. 
- The issue is that the frontend generates a temporary ID for the clothing item and then sends it to the backend. 
- The backend should generate the ID for the clothing item. 
- Fix timeline: After merging frontend, backend, and database together to get an MVP. 

### 2.2. Load the entire wardrobe when logging in (nice-to-have)
- Works fine for 10 items, not working well for 500+ items and 2000+ outfit logs. 
- Frontend should only ask for a maximum of 20 items at a time. 

### 2.3. Move the update logic to the backend
- In WardrobeContext.tsx, we have code that manually updates the wearCount and lastWorn date in the frontend state after logging an outfit. 
- This is not a good practice because we mirror the database logic in the browser. 
- Practice: After a successful "Log Outfit" call, the frontend should send a request to the backend to update the database, and thenthe frontend should refetch the data from the database through the backend (to ensure that the frontend is not talking directly to the backend).

## General recommendations: 
1. Close the pull requests only after all of the comments are resolved
2. We should use GitHub Copilot for all PRs or for none -> run all the PRs through the GitHub Copilot
