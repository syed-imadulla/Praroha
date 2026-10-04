from abc import ABC, abstractmethod
from typing import Any, Dict, List


class AIProvider(ABC):
    """Abstract base class for all AI generation providers (Gemini, Claude, Mock, etc.)."""

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Perform a liveness and authentication check on the provider."""
        pass

    @abstractmethod
    async def extract_dna(self, seed: str) -> Dict[str, Any]:
        """Extract structured Seed DNA from raw user seed text."""
        pass

    @abstractmethod
    async def generate_worlds(self, dna: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate exactly three high-contrast candidate worlds based on Seed DNA."""
        pass

    @abstractmethod
    async def unfold_stage(
        self, stage: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Progressively unfold a stage (bible, characters, scenes, etc.) for the chosen world."""
        pass
