import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockModules } from '../data/mockData';

const PlatformContext = createContext();

export const usePlatformContext = () => useContext(PlatformContext);

export const PlatformProvider = ({ children }) => {
  // State for modules and the currently selected module
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize modules from mock data (or fetch from API)
  useEffect(() => {
    // Load modules from localStorage if available
    const savedModules = localStorage.getItem('learningModules');
    if (savedModules) {
      setModules(JSON.parse(savedModules));
      // Set the first module as selected if none is selected
      setSelectedModuleId(prevId => prevId || JSON.parse(savedModules)[0]?.id);
    } else {
      setModules(mockModules);
      setSelectedModuleId(mockModules[0]?.id);
    }
    setIsLoading(false);
  }, []);

  // Save modules to localStorage when they change
  useEffect(() => {
    if (modules.length > 0) {
      localStorage.setItem('learningModules', JSON.stringify(modules));
    }
  }, [modules]);

  // Select a module by ID
  const selectModule = (moduleId) => {
    setSelectedModuleId(moduleId);
  };

  // Get the currently selected module
  const selectedModule = modules.find(m => m.id === selectedModuleId) || modules[0];

  // Mark a material as completed
  const markMaterialCompleted = (moduleId, materialId) => {
    setModules(prevModules => 
      prevModules.map(module => {
        if (module.id === moduleId) {
          return {
            ...module,
            materials: module.materials.map(material => {
              if (material.id === materialId) {
                return { ...material, completed: true };
              }
              return material;
            })
          };
        }
        return module;
      })
    );
  };

  // Calculate progress for a module
  const calculateModuleProgress = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return { percentage: 0, completed: 0, total: 0 };
    
    const totalMaterials = module.materials.length;
    const completedMaterials = module.materials.filter(m => m.completed).length;
    const percentage = totalMaterials === 0 ? 0 : Math.round((completedMaterials / totalMaterials) * 100);
    
    return {
      percentage,
      completed: completedMaterials,
      total: totalMaterials
    };
  };

  // Calculate overall progress across all modules
  const calculateOverallProgress = () => {
    const totalMaterials = modules.reduce((acc, module) => acc + module.materials.length, 0);
    const completedMaterials = modules.reduce(
      (acc, module) => acc + module.materials.filter(m => m.completed).length, 
      0
    );
    
    const percentage = totalMaterials === 0 ? 0 : Math.round((completedMaterials / totalMaterials) * 100);
    
    return {
      percentage,
      completed: completedMaterials,
      total: totalMaterials
    };
  };

  const contextValue = {
    modules,
    selectedModule,
    selectModule,
    markMaterialCompleted,
    calculateModuleProgress,
    calculateOverallProgress,
    isLoading
  };

  return (
    <PlatformContext.Provider value={contextValue}>
      {children}
    </PlatformContext.Provider>
  );
};

export default PlatformProvider; 