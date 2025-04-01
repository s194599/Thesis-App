# Learning Platform Overview

This module provides an interactive overview of learning modules and materials for students, with progress tracking and access to quizzes.

## Features

### 1. Module Navigation
- Sidebar/timeline view of upcoming and past modules
- Each module labeled by date and title
- Selected module is visually highlighted
- Progress indicators for each module

### 2. Module Content View
- Displays learning materials with appropriate icons:
  - PDFs
  - YouTube videos (with thumbnails)
  - Word documents
  - Interactive quizzes
- Materials are clickable and open in new tabs
- Completion status is tracked for each material

### 3. Progress Tracking
- Progress bar per module
- Shows percentage and number of completed activities
- Global progress tracker at the bottom
- State persisted via localStorage

### 4. Quiz Access
- Dedicated quiz section with access to the quiz-taking interface
- Seamless integration with existing quiz functionality

## Implementation Details

### State Management
- Uses React Context API for state management (`PlatformContext`)
- Stores modules, materials, and completion status
- Persists state in localStorage for session continuity

### Components
- `PlatformOverview`: Main container component
- `ModuleSidebar`: Navigation sidebar with module list
- `ModuleContent`: Displays selected module's materials
- `OverallProgress`: Shows global progress across all modules

### Styling
- Clean, minimal design using Bootstrap components
- Custom CSS animations and hover effects
- Fully responsive for different device sizes

## Usage

The platform is integrated into the main application routing system. To access:

1. Navigate to the root URL of the application
2. Select a module from the sidebar to view its contents
3. Click on materials to view/open them and track progress
4. Access quizzes through the quiz links in the materials list

## Future Enhancements
- Filtering modules by date or completion status
- Search functionality for finding specific materials
- User-specific profiles and progress tracking
- Additional material types (e.g., assignments, discussions)
