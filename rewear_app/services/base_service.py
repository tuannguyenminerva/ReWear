from abc import ABC, abstractmethod
from ..models import db

class BaseService(ABC):
    """
    Template Method Pattern for resource creation and management.
    Ensures a consistent workflow for all business entities.
    """
    
    @property
    @abstractmethod
    def model(self):
        """The SQLAlchemy model class this service manages."""
        pass

    def create(self, user_id, data, files=None):
        """
        The Template Method defining the skeleton of resource creation.
        """
        # 1. Pre-process (Initial formatting)
        processed_data = self.pre_process(data)
        
        # 2. Validate (Domain logic)
        self.validate(processed_data)
        
        # 3. Handle Files (Uploads)
        if files:
            file_results = self.handle_files(files)
            processed_data.update(file_results)
            
        # 4. Instantiate
        resource = self.model(user_id=user_id, **processed_data)
        
        # 5. Add to session so it's tracked (required before flush/relationships)
        db.session.add(resource)
        
        # 6. Post-instantiation (e.g. relationship handling)
        self.post_create(resource, data)
        
        # 7. Commit
        db.session.commit()
        
        return resource

    def pre_process(self, data):
        """Default pre-processing (can be overridden)."""
        return data.copy()

    @abstractmethod
    def validate(self, data):
        """Domain-specific validation logic (must be implemented)."""
        pass

    def handle_files(self, files):
        """Default file handling (can be overridden)."""
        return {}

    def post_create(self, resource, raw_data):
        """Logic to run after the model is instantiated but before commit."""
        pass
