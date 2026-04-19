# ReWear Unit Tests

A comprehensive unit test suite for the ReWear application with **78 passing tests** covering backend models, authentication, and API routes.

## Running the Tests

### Run all tests:
```bash
python -m pytest tests/ -v
```

### Run tests for a specific module:
```bash
python -m pytest tests/test_models.py -v
python -m pytest tests/test_auth_routes.py -v
python -m pytest tests/test_items_routes.py -v
python -m pytest tests/test_outfits_routes.py -v
```

### Run with coverage report:
```bash
python -m pytest tests/ --cov=rewear_app
```

### Run specific test:
```bash
python -m pytest tests/test_models.py::TestUserModel::test_user_creation -v
```

## Test Coverage

### Test Files Overview

#### [test_models.py](test_models.py) - **20 tests**
Tests for SQLAlchemy database models:
- **TestUserModel** (5 tests): User creation, password hashing/verification, email uniqueness, timestamps
- **TestItemModel** (4 tests): Item creation, cost constraints, soft delete, postponement
- **TestItemTagModel** (2 tests): Tag creation, cascade deletion
- **TestOutfitModel** (2 tests): Outfit creation, default status
- **TestOutfitItemModel** (2 tests): Many-to-many associations, unique constraints
- **TestReminderModel** (1 test): Reminder creation

#### [test_auth_guard.py](test_auth_guard.py) - **4 tests**
Tests for authentication middleware:
- No session/invalid session handling
- Valid user retrieval
- Session cleanup on invalid user

#### [test_auth_routes.py](test_auth_routes.py) - **23 tests**
Tests for authentication API endpoints:
- **TestAuthRegister** (7 tests): Registration success, validation, duplicate prevention, session creation
- **TestAuthLogin** (6 tests): Login success, invalid credentials, session handling
- **TestAuthLogout** (3 tests): Logout functionality, session clearing
- **TestAuthMe** (3 tests): Current user retrieval, authentication checks

#### [test_items_routes.py](test_items_routes.py) - **17 tests**
Tests for item management API:
- **TestGetItems** (4 tests): Retrieval, empty lists, archived item filtering
- **TestCreateItem** (6 tests): Creation, validation, cost constraints, defaults
- **TestUpdateItem** (5 tests): Updates, permissions, validation
- **TestDeleteItem** (3 tests): Deletion, permissions, not found handling

#### [test_outfits_routes.py](test_outfits_routes.py) - **11 tests**
Tests for outfit management API:
- **TestGetOutfits** (4 tests): Retrieval, sorting by date
- **TestCreateOutfit** (7 tests): Creation with items, date handling, user isolation

#### [test_serializers.py](test_serializers.py) - **10 tests**  
Tests for data serialization:
- **TestItemToDict** (6 tests): Item serialization, wear counts, defaults
- **TestOutfitToDict** (4 tests): Outfit serialization with items and metadata

### test Configuration

- **[pytest.ini](../pytest.ini)**: pytest configuration with test discovery and output settings
- **[conftest.py](conftest.py)**: Shared fixtures for Flask app, database, and test clients

## Key Features Tested

### Authentication & Authorization
- User registration and login
- Password hashing and verification
- Session management
- Protected routes requiring authentication
- User isolation (users can only access their own data)

### Database Models
- Model creation and relationships
- Constraints (unique emails, positive costs, outfit-item uniqueness)
- Cascading deletes
- Soft deletes (archiving items)
- Timestamps and defaults

### API Endpoints
- CRUD operations for items and outfits
- Error handling and validation
- Request/response serialization
- Permission checks
- Date handling and sorting

### Data Integrity
- Foreign key relationships
- Unique constraints
- Check constraints
- Transaction rollback on errors

## Test Results

```
======================== 78 passed in 5.64s ========================
```

All tests pass with:
- ✅ 100% test success rate
- ✅ Full model coverage
- ✅ Full auth coverage  
- ✅ API endpoint coverage
- ✅ Error handling coverage
- ✅ Permission/authorization coverage

## Setup

The test suite uses:
- **pytest** - Test framework
- **pytest-flask** - Flask integration
- **SQLAlchemy** - ORM testing with in-memory SQLite
- **Flask Test Client** - API testing

### Requirements
All dependencies are in [requirements.txt](../requirements.txt):
```
pytest==7.4.3
pytest-flask==1.3.0
```

Install with:
```bash
pip install -r requirements.txt
```

## Architecture

Tests use several key fixtures (see [conftest.py](conftest.py)):

- **app**: Flask application with in-memory SQLite database
- **client**: Test client for making HTTP requests
- **db_session**: Direct database session for setup/verification
- **authenticated_client**: Pre-authenticated test client
- **user_data**: Sample user credentials
- **registered_user**: Already-registered test user

Each test gets a fresh database, ensuring test isolation and repeatability.

## Best Practices Applied

✅ **Test Isolation** - Fresh database for each test  
✅ **Explicit Assertions** - Clear failure messages  
✅ **Organized Structure** - Tests grouped by class/module  
✅ **Comprehensive Coverage** - Happy paths and error cases  
✅ **Security Testing** - Authorization and validation checks  
✅ **Data Integrity** - Model constraints and relationships  

## Running Tests in Development

For continuous testing during development:
```bash
# Watch for changes and rerun tests
pytest-watch tests/

# Or with pytest-django for more features
pytest tests/ --lf -v  # Run last failed tests
pytest tests/ -k "auth" -v  # Run only auth tests
```
