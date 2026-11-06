import os
import sys

# Add services/model directory to sys.path so 'main' can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
