# Quick Start: Running Tests

## Installation
```bash
cd /Users/macbook/github/ReWear
pip install pytest pytest-flask
```

## Run All Tests
```bash
python -m pytest tests/ -v
```

## View Test Results Summary
```bash
python -m pytest tests/ -v --tb=short
```

## Run Specific Test File
```bash
python -m pytest tests/test_models.py -v
python -m pytest tests/test_auth_routes.py -v
python -m pytest tests/test_items_routes.py -v
python -m pytest tests/test_outfits_routes.py -v
python -m pytest tests/test_serializers.py -v
```

## Run Specific Test Class
```bash
python -m pytest tests/test_models.py::TestUserModel -v
python -m pytest tests/test_auth_routes.py::TestAuthLogin -v
```

## Run Specific Test
```bash
python -m pytest tests/test_models.py::TestUserModel::test_user_creation -v
```

## Show Coverage
```bash
python -m pytest tests/ --cov=rewear_app --cov-report=html
```

## Watch Mode (auto-rerun on changes)
```bash
pip install pytest-watch
ptw tests/
```

## Test Statistics
- **Total Tests**: 78
- **All Passing**: ✅ Yes
- **Coverage Areas**:
  - Models (User, Item, Outfit, etc.)
  - Authentication (register, login, logout, permissions)
  - API Routes (items, outfits, auth)
  - Data Serialization
  - Error Handling

## Expected Output
```
======================== 78 passed in ~5.6s ========================
```
