# Data Structure Documentation

## Overview

This document outlines the data structure used in the application, particularly focusing on how modules and activities are stored, loaded, and managed.

## Key Components

### Server-Side Data Storage

The application stores data in JSON files on the server:

1. **Modules**: Stored in `server/modules/modules.json`
   - Contains the base module information (id, title, date, description)
   - Does not contain activities directly

2. **Activities**: Stored in `server/activities/activities.json`
   - Each activity includes a `moduleId` field to associate it with a module
   - Activities are stored separately from modules for better performance and separation of concerns

### API Endpoints

The application provides several endpoints to interact with the data:

1. **GET `/api/modules`**
   - Returns a list of all modules without their activities

2. **GET `/api/modules-with-activities`**
   - Returns all modules with their activities attached
   - Activities are cross-referenced using the `moduleId` field

3. **GET `/api/module-activities/:moduleId`**
   - Returns all activities for a specific module

4. **POST `/api/update-module`**
   - Updates a module's information (title, date, description)

5. **POST `/api/store-activity`**
   - Saves a new activity or updates an existing one
   - Activities must include a `moduleId` to link them to a module

6. **POST `/api/delete-activity`**
   - Deletes an activity from server storage

### Client-Side Data Management

The front-end handles data in the following way:

1. **Initial Load**
   - On app load, `PlatformOverview` component fetches all modules with their activities
   - Uses localStorage as a cache to show data quickly while fresh data loads from the server

2. **Module Selection**
   - When a module is selected, it refreshes that module's activities from the server
   - This ensures the most up-to-date activities are displayed

3. **Module Updates**
   - When module information (title, date, description) is edited, changes are sent to the server
   - Updates are also stored in localStorage for persistence

4. **Activity Management**
   - Activities can be added, edited, or deleted within a module
   - All changes are synchronized with the server and localStorage

## Data Flow

1. User opens application
   - App loads modules and activities from the server
   - Data is stored in component state and localStorage

2. User selects a module
   - Selected module's latest activities are fetched from the server
   - Module content is updated with the latest data

3. User makes changes
   - Changes are immediately reflected in the UI
   - Changes are sent to the server for persistence
   - Changes are stored in localStorage as a backup

4. User refreshes or reopens the app
   - The process repeats, with localStorage providing immediate data
   - Server data is fetched to ensure everything is up-to-date

## Benefits of This Structure

1. **Decoupling**: Modules and activities are decoupled, making it easier to manage each separately
2. **Performance**: Only loading activities for the current module when needed improves performance
3. **Consistency**: Single source of truth on the server with client-side caching for performance
4. **Flexibility**: Easy to extend or modify the structure as the application evolves 