"""Resolve both a repository checkout and the assignment ZIP layout."""
from pathlib import Path

QMS = Path(__file__).resolve().parents[1]
REPO = QMS.parent if (QMS.parent / 'backend').is_dir() else QMS.parent / 'SEF/emergency-resource-coordination-platform'
ROOT = QMS.parent
