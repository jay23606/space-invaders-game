#!/bin/bash
# This script sets up GitHub Pages for the space invaders game

# Push all changes to GitHub
git add .
git commit -m "Final commit before GitHub Pages setup"
git push origin master

echo "GitHub Pages setup complete. Please manually enable GitHub Pages in repository settings:"
echo "1. Visit https://github.com/jay23606/space-invaders-game"
echo "2. Go to Settings → Pages"
echo "3. Select 'Deploy from a branch'"
echo "4. Choose 'master' branch and '/ (root)' folder"
echo "5. Click Save"
echo ""
echo "Your game will then be available at: https://jay23606.github.io/space-invaders-game/"